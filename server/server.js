import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initDB, getPool } from './db.js';
import { convertPinyinNumberToAccent } from './pinyinUtils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Middleware: check and run demotion once a day on-request (to work on serverless environments like Vercel)
let lastDemotionRunDate = null;
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const today = new Date().toISOString().split('T')[0];
    if (lastDemotionRunDate !== today) {
      lastDemotionRunDate = today;
      console.log(`Auto demotion triggered by request: ${req.method} ${req.path}`);
      runAutoDemotion().catch(err => console.error("Demotion trigger error:", err));
    }
  }
  next();
});

// Authentication Endpoints
app.post('/api/login', async (req, res) => {
  try {
    const pool = getPool();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }
    
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }
    
    const user = rows[0];
    // Compare password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin User Management CRUD
// 1. Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, username, plain_password, role, created_at FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Add user
app.post('/api/admin/users', async (req, res) => {
  try {
    const pool = getPool();
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại.' });
    }
    
    const hashedPass = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, password, plain_password, role) VALUES (?, ?, ?, ?)', [username, hashedPass, password, role]);
    
    res.status(201).json({
      id: result.insertId,
      username,
      plain_password: password,
      role
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Update user
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }
    
    const current = existing[0];
    let query = 'UPDATE users SET username = ?, role = ?';
    const params = [username || current.username, role || current.role];
    let plainPassValue = current.plain_password;
    
    if (password && password.trim() !== '') {
      const hashedPass = await bcrypt.hash(password, 10);
      query += ', password = ?, plain_password = ?';
      params.push(hashedPass, password);
      plainPassValue = password;
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.query(query, params);
    res.json({
      id: parseInt(id),
      username: username || current.username,
      plain_password: plainPassValue,
      role: role || current.role
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    // Prevent deleting self (or first admin, for safety)
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }
    res.json({ success: true, message: 'Xóa tài khoản thành công.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin Vocabularies Statistics
// 1. Chinese Stats by User
app.get('/api/admin/stats/chinese', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT 
        u.id as userId,
        u.username,
        COUNT(v.id) as total,
        SUM(CASE WHEN v.memory_level = 'Rất nhớ' THEN 1 ELSE 0 END) as rat_nho,
        SUM(CASE WHEN v.memory_level = 'Đã nhớ' THEN 1 ELSE 0 END) as da_nho,
        SUM(CASE WHEN v.memory_level = 'Đang nhớ' THEN 1 ELSE 0 END) as dang_nho,
        SUM(CASE WHEN v.memory_level = 'Chưa nhớ' THEN 1 ELSE 0 END) as chua_nho
      FROM users u
      LEFT JOIN vocabularies v ON u.id = v.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username
      ORDER BY u.username ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Chinese vocab stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. English Stats by User
app.get('/api/admin/stats/english', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT 
        u.id as userId,
        u.username,
        COUNT(ev.id) as total,
        SUM(CASE WHEN ev.memory_level = 'Rất nhớ' THEN 1 ELSE 0 END) as rat_nho,
        SUM(CASE WHEN ev.memory_level = 'Đã nhớ' THEN 1 ELSE 0 END) as da_nho,
        SUM(CASE WHEN ev.memory_level = 'Đang nhớ' THEN 1 ELSE 0 END) as dang_nho,
        SUM(CASE WHEN ev.memory_level = 'Chưa nhớ' THEN 1 ELSE 0 END) as chua_nho
      FROM users u
      LEFT JOIN english_vocabularies ev ON u.id = ev.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.username
      ORDER BY u.username ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching English vocab stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. System stats summary
app.get('/api/admin/stats/summary', async (req, res) => {
  try {
    const pool = getPool();
    const [userRows] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const [chineseRows] = await pool.query("SELECT COUNT(*) as count FROM vocabularies");
    const [englishRows] = await pool.query("SELECT COUNT(*) as count FROM english_vocabularies");
    
    res.json({
      totalUsers: userRows[0].count,
      totalChineseWords: chineseRows[0].count,
      totalEnglishWords: englishRows[0].count
    });
  } catch (error) {
    console.error('Error fetching admin summary stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Chinese Vocabularies Routes
// 1. Get statistics for a user
app.get('/api/vocabularies/stats', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });

    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN memory_level = 'Rất nhớ' THEN 1 ELSE 0 END) as rat_nho,
        SUM(CASE WHEN memory_level = 'Đã nhớ' THEN 1 ELSE 0 END) as da_nho,
        SUM(CASE WHEN memory_level = 'Đang nhớ' THEN 1 ELSE 0 END) as dang_nho,
        SUM(CASE WHEN memory_level = 'Chưa nhớ' THEN 1 ELSE 0 END) as chua_nho
      FROM vocabularies
      WHERE user_id = ?
    `, [userId]);
    
    const stats = rows[0];
    res.json({
      total: stats.total || 0,
      rat_nho: stats.rat_nho || 0,
      da_nho: stats.da_nho || 0,
      dang_nho: stats.dang_nho || 0,
      chua_nho: stats.chua_nho || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Get unique study dates for a user
app.get('/api/vocabularies/dates', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });

    const [rows] = await pool.query(`
      SELECT DISTINCT study_date 
      FROM vocabularies 
      WHERE user_id = ? AND study_date IS NOT NULL 
      ORDER BY study_date DESC
    `, [userId]);
    
    const dates = rows.map(r => r.study_date);
    res.json(dates);
  } catch (error) {
    console.error('Error fetching study dates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Get Chinese vocabularies with filters for a user
app.get('/api/vocabularies', async (req, res) => {
  try {
    const pool = getPool();
    const { search, memory_level, study_date, userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });
    
    let query = 'SELECT * FROM vocabularies WHERE user_id = ?';
    const params = [userId];
    
    if (search) {
      query += ' AND (chinese LIKE ? OR pinyin LIKE ? OR han_viet LIKE ? OR meaning LIKE ?)';
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }
    
    if (memory_level) {
      query += ' AND memory_level = ?';
      params.push(memory_level);
    }
    
    if (study_date) {
      query += ' AND DATE(study_date) = ?';
      params.push(study_date);
    }
    
    query += ' ORDER BY id DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching vocabularies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Add new Chinese vocabulary
app.post('/api/vocabularies', async (req, res) => {
  try {
    const pool = getPool();
    const { user_id, chinese, pinyin, han_viet, meaning, word_type, memory_level, study_date } = req.body;
    
    if (!user_id || !chinese || !pinyin || !han_viet || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const level = memory_level || 'Chưa nhớ';
    const date = study_date || new Date().toISOString().split('T')[0];
    const type = word_type || 'Danh từ';
    
    const query = `
      INSERT INTO vocabularies (user_id, chinese, pinyin, han_viet, meaning, word_type, memory_level, study_date, last_reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [user_id, chinese, pinyin, han_viet, meaning, type, level, date, date]);
    
    res.status(201).json({
      id: result.insertId,
      user_id,
      chinese,
      pinyin,
      han_viet,
      meaning,
      word_type: type,
      memory_level: level,
      study_date: date,
      last_reviewed_at: date
    });
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Update Chinese vocabulary
app.put('/api/vocabularies/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { chinese, pinyin, han_viet, meaning, word_type, memory_level, study_date } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM vocabularies WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }
    
    const current = existing[0];
    const updateFields = {
      chinese: chinese !== undefined ? chinese : current.chinese,
      pinyin: pinyin !== undefined ? pinyin : current.pinyin,
      han_viet: han_viet !== undefined ? han_viet : current.han_viet,
      meaning: meaning !== undefined ? meaning : current.meaning,
      word_type: word_type !== undefined ? word_type : current.word_type,
      memory_level: memory_level !== undefined ? memory_level : current.memory_level,
      study_date: study_date !== undefined ? study_date : current.study_date,
      last_reviewed_at: memory_level !== undefined ? new Date().toISOString().split('T')[0] : current.last_reviewed_at
    };
    
    const query = `
      UPDATE vocabularies 
      SET chinese = ?, pinyin = ?, han_viet = ?, meaning = ?, word_type = ?, memory_level = ?, study_date = ?, last_reviewed_at = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [
      updateFields.chinese,
      updateFields.pinyin,
      updateFields.han_viet,
      updateFields.meaning,
      updateFields.word_type,
      updateFields.memory_level,
      updateFields.study_date,
      updateFields.last_reviewed_at,
      id
    ]);
    
    res.json({ id: parseInt(id), ...updateFields });
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Delete Chinese vocabulary
app.delete('/api/vocabularies/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM vocabularies WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }
    
    res.json({ message: 'Vocabulary deleted successfully', id: parseInt(id) });
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// English Vocabularies Routes
// 1. Get statistics for English
app.get('/api/english-vocabularies/stats', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });

    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN memory_level = 'Rất nhớ' THEN 1 ELSE 0 END) as rat_nho,
        SUM(CASE WHEN memory_level = 'Đã nhớ' THEN 1 ELSE 0 END) as da_nho,
        SUM(CASE WHEN memory_level = 'Đang nhớ' THEN 1 ELSE 0 END) as dang_nho,
        SUM(CASE WHEN memory_level = 'Chưa nhớ' THEN 1 ELSE 0 END) as chua_nho
      FROM english_vocabularies
      WHERE user_id = ?
    `, [userId]);
    
    const stats = rows[0];
    res.json({
      total: stats.total || 0,
      rat_nho: stats.rat_nho || 0,
      da_nho: stats.da_nho || 0,
      dang_nho: stats.dang_nho || 0,
      chua_nho: stats.chua_nho || 0
    });
  } catch (error) {
    console.error('Error fetching English stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Get unique study dates for English
app.get('/api/english-vocabularies/dates', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });

    const [rows] = await pool.query(`
      SELECT DISTINCT study_date 
      FROM english_vocabularies 
      WHERE user_id = ? AND study_date IS NOT NULL 
      ORDER BY study_date DESC
    `, [userId]);
    
    const dates = rows.map(r => r.study_date);
    res.json(dates);
  } catch (error) {
    console.error('Error fetching English study dates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Get all English vocabularies with filters
app.get('/api/english-vocabularies', async (req, res) => {
  try {
    const pool = getPool();
    const { search, memory_level, study_date, userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });
    
    let query = 'SELECT * FROM english_vocabularies WHERE user_id = ?';
    const params = [userId];
    
    if (search) {
      query += ' AND (word LIKE ? OR transliteration LIKE ? OR meaning LIKE ?)';
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild);
    }
    
    if (memory_level) {
      query += ' AND memory_level = ?';
      params.push(memory_level);
    }
    
    if (study_date) {
      query += ' AND DATE(study_date) = ?';
      params.push(study_date);
    }
    
    query += ' ORDER BY id DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching English vocabularies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Add new English vocabulary
app.post('/api/english-vocabularies', async (req, res) => {
  try {
    const pool = getPool();
    const { user_id, word, transliteration, meaning, word_type, memory_level, study_date } = req.body;
    
    if (!user_id || !word || !transliteration || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const level = memory_level || 'Chưa nhớ';
    const date = study_date || new Date().toISOString().split('T')[0];
    const type = word_type || 'Danh từ';
    
    const query = `
      INSERT INTO english_vocabularies (user_id, word, transliteration, meaning, word_type, memory_level, study_date, last_reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [user_id, word, transliteration, meaning, type, level, date, date]);
    
    res.status(201).json({
      id: result.insertId,
      user_id,
      word,
      transliteration,
      meaning,
      word_type: type,
      memory_level: level,
      study_date: date,
      last_reviewed_at: date
    });
  } catch (error) {
    console.error('Error adding English vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Update English vocabulary
app.put('/api/english-vocabularies/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { word, transliteration, meaning, word_type, memory_level, study_date } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM english_vocabularies WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'English vocabulary not found' });
    }
    
    const current = existing[0];
    const updateFields = {
      word: word !== undefined ? word : current.word,
      transliteration: transliteration !== undefined ? transliteration : current.transliteration,
      meaning: meaning !== undefined ? meaning : current.meaning,
      word_type: word_type !== undefined ? word_type : current.word_type,
      memory_level: memory_level !== undefined ? memory_level : current.memory_level,
      study_date: study_date !== undefined ? study_date : current.study_date,
      last_reviewed_at: memory_level !== undefined ? new Date().toISOString().split('T')[0] : current.last_reviewed_at
    };
    
    const query = `
      UPDATE english_vocabularies 
      SET word = ?, transliteration = ?, meaning = ?, word_type = ?, memory_level = ?, study_date = ?, last_reviewed_at = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [
      updateFields.word,
      updateFields.transliteration,
      updateFields.meaning,
      updateFields.word_type,
      updateFields.memory_level,
      updateFields.study_date,
      updateFields.last_reviewed_at,
      id
    ]);
    
    res.json({ id: parseInt(id), ...updateFields });
  } catch (error) {
    console.error('Error updating English vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Delete English vocabulary
app.delete('/api/english-vocabularies/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM english_vocabularies WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'English vocabulary not found' });
    }
    
    res.json({ message: 'English vocabulary deleted successfully', id: parseInt(id) });
  } catch (error) {
    console.error('Error deleting English vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, 'hanviet.csv');
const dictMap = new Map();

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function loadDictionary() {
  try {
    if (!fs.existsSync(csvPath)) {
      console.warn('hanviet.csv not found! Dictionary lookup will not work.');
      return;
    }
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 3) continue;
      
      const char = parts[0].trim();
      let hanvietStr = parts[1].trim();
      const pinyin = parts[2].trim();
      
      hanvietStr = hanvietStr.replace(/[\[\]']/g, '');
      const hanvietList = hanvietStr ? hanvietStr.split(',').map(s => s.trim()) : [];
      
      if (!dictMap.has(char)) {
        dictMap.set(char, []);
      }
      dictMap.get(char).push({
        hanviet: hanvietList,
        pinyin: pinyin
      });
    }
    console.log(`Loaded Hán Việt dictionary: ${dictMap.size} characters.`);
  } catch (error) {
    console.error('Error loading Hán Việt dictionary:', error);
  }
}

app.get('/api/vocabularies/lookup', async (req, res) => {
  try {
    const { word } = req.query;
    if (!word) {
      return res.status(400).json({ error: 'Missing word parameter' });
    }
    
    const pinyinList = [];
    const hanvietList = [];
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const match = dictMap.get(char);
      if (match && match.length > 0) {
        const item = match[0];
        const pinyinAccent = convertPinyinNumberToAccent(item.pinyin);
        pinyinList.push(pinyinAccent);
        
        const hv = item.hanviet.length > 0 ? item.hanviet[0] : '';
        hanvietList.push(hv);
      } else {
        pinyinList.push(char);
        hanvietList.push(char);
      }
    }
    
    const pinyin = pinyinList.join(' ');
    const han_viet = hanvietList.join(' ');
    let meaning = '';
    
    // Try to find meaning from database
    const pool = getPool();
    const [existing] = await pool.query('SELECT meaning FROM vocabularies WHERE chinese = ? LIMIT 1', [word]);
    if (existing.length > 0) {
      meaning = existing[0].meaning;
    } else {
      const commonMeanings = {
        '城里': 'trong thành phố',
        '郊区': 'ngoại ô',
        '空气': 'không khí',
        '笔记': 'ghi chép',
        '拜托': 'nhờ vả',
        '学习': 'học tập',
        '汉语': 'tiếng Trung',
        '词汇': 'từ vựng',
        '努力': 'nỗ lực, cố gắng',
        '简单': 'đơn giản',
        '复杂': 'phức tạp',
        '感谢': 'cảm ơn',
        '电脑': 'máy tính',
        '手机': 'điện thoại di động',
        '老师': 'thầy cô giáo',
        '学生': 'học sinh, sinh viên',
        '学校': 'trường học',
        '咖啡': 'cà phê',
        '面包': 'bánh mì',
        '苹果': 'quả táo',
        '西瓜': 'dưa hấu',
        '朋友': 'bạn bè',
        '时间': 'thời gian',
        '工作': 'công việc'
      };
      if (commonMeanings[word]) {
        meaning = commonMeanings[word];
      }
    }
    
    res.json({
      chinese: word,
      pinyin,
      han_viet,
      meaning
    });
  } catch (error) {
    console.error('Error during dictionary lookup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const englishCsvPath = path.join(__dirname, 'english.csv');
const englishDictMap = new Map();

function loadEnglishDictionary() {
  try {
    if (!fs.existsSync(englishCsvPath)) {
      console.warn('english.csv not found! English lookup will not work.');
      return;
    }
    const content = fs.readFileSync(englishCsvPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 3) continue;
      
      const word = parts[0].trim().toLowerCase();
      const transliteration = parts[1].trim();
      const meaning = parts[2].trim();
      
      englishDictMap.set(word, {
        word: parts[0].trim(),
        transliteration,
        meaning
      });
    }
    console.log(`Loaded English dictionary: ${englishDictMap.size} words.`);
  } catch (error) {
    console.error('Error loading English dictionary:', error);
  }
}

app.get('/api/english-vocabularies/lookup', async (req, res) => {
  try {
    const { word } = req.query;
    if (!word) {
      return res.status(400).json({ error: 'Missing word parameter' });
    }
    
    const searchWord = word.trim().toLowerCase();
    let match = englishDictMap.get(searchWord);
    
    // Find autocomplete suggestions from our local dictionary
    const suggestions = [];
    if (searchWord.length > 0) {
      for (const key of englishDictMap.keys()) {
        if (key.startsWith(searchWord)) {
          suggestions.push(englishDictMap.get(key));
          if (suggestions.length >= 8) break;
        }
      }
    }
    
    if (match) {
      return res.json({
        word: match.word,
        transliteration: match.transliteration,
        meaning: match.meaning,
        suggestions
      });
    }

    // Fallback: If not found locally, fetch online!
    console.log(`Word "${searchWord}" not found locally. Fetching online fallback...`);
    let transliteration = '';
    let meaning = '';

    // 1. Fetch pronunciation from Free Dictionary API
    try {
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchWord)}`);
      if (dictRes.ok) {
        const dictData = await dictRes.json();
        if (Array.isArray(dictData) && dictData.length > 0) {
          const entry = dictData[0];
          transliteration = entry.phonetic || '';
          if (!transliteration && entry.phonetics) {
            const foundText = entry.phonetics.find(p => p.text && p.text.trim())?.text;
            if (foundText) transliteration = foundText;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching from Dictionary API:', err.message);
    }

    // 2. Fetch Vietnamese meaning from Google Translate API
    try {
      const translateRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(searchWord)}`);
      if (translateRes.ok) {
        const translateData = await translateRes.json();
        if (Array.isArray(translateData) && translateData[0] && translateData[0][0]) {
          meaning = translateData[0][0][0] || '';
        }
      }
    } catch (err) {
      console.error('Error fetching from Google Translate:', err.message);
    }

    // If fetched successful details, save to local memory map for next lookups
    if (transliteration || meaning) {
      const dynamicMatch = {
        word: word.trim(),
        transliteration: transliteration || '',
        meaning: meaning || ''
      };
      englishDictMap.set(searchWord, dynamicMatch);
      match = dynamicMatch;
    }

    res.json({
      word: match ? match.word : word,
      transliteration: match ? match.transliteration : '',
      meaning: match ? match.meaning : '',
      suggestions
    });
  } catch (error) {
    console.error('Error during English dictionary lookup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function runAutoDemotion() {
  try {
    const pool = getPool();
    console.log('Running automatic 5-day memory level demotion scheduler...');
    
    // Demote Chinese vocabularies
    const [resultCN] = await pool.query(`
      UPDATE vocabularies
      SET
        memory_level = CASE
          WHEN memory_level = 'Rất nhớ' THEN 'Đã nhớ'
          WHEN memory_level = 'Đã nhớ' THEN 'Đang nhớ'
          WHEN memory_level = 'Đang nhớ' THEN 'Chưa nhớ'
          ELSE memory_level
        END,
        last_reviewed_at = CURRENT_DATE
      WHERE last_reviewed_at <= DATE_SUB(CURRENT_DATE(), INTERVAL 5 DAY)
    `);
    
    // Demote English vocabularies
    const [resultEN] = await pool.query(`
      UPDATE english_vocabularies
      SET
        memory_level = CASE
          WHEN memory_level = 'Rất nhớ' THEN 'Đã nhớ'
          WHEN memory_level = 'Đã nhớ' THEN 'Đang nhớ'
          WHEN memory_level = 'Đang nhớ' THEN 'Chưa nhớ'
          ELSE memory_level
        END,
        last_reviewed_at = CURRENT_DATE
      WHERE last_reviewed_at <= DATE_SUB(CURRENT_DATE(), INTERVAL 5 DAY)
    `);
    
    console.log(`Demotion run complete. Chinese updated: ${resultCN.affectedRows}, English updated: ${resultEN.affectedRows}`);
  } catch (error) {
    console.error('Error during auto-demotion scheduler:', error);
  }
}

// Initialize DB and start server
initDB()
  .then(() => {
    loadDictionary();
    loadEnglishDictionary();
    // Run demotion on start
    runAutoDemotion();
    // Run demotion every 12 hours (12 * 60 * 60 * 1000 = 43,200,000 ms)
    setInterval(runAutoDemotion, 43200000);
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
