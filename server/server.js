import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, getPool } from './db.js';
import { convertPinyinNumberToAccent } from './pinyinUtils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
// 1. Get statistics
app.get('/api/vocabularies/stats', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN memory_level = 'Đã nhớ' THEN 1 ELSE 0 END) as da_nho,
        SUM(CASE WHEN memory_level = 'Đang nhớ' THEN 1 ELSE 0 END) as dang_nho,
        SUM(CASE WHEN memory_level = 'Chưa nhớ' THEN 1 ELSE 0 END) as chua_nho
      FROM vocabularies
    `);
    
    const stats = rows[0];
    res.json({
      total: stats.total || 0,
      da_nho: stats.da_nho || 0,
      dang_nho: stats.dang_nho || 0,
      chua_nho: stats.chua_nho || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Get unique study dates for filter dropdown
app.get('/api/vocabularies/dates', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT DISTINCT study_date 
      FROM vocabularies 
      WHERE study_date IS NOT NULL 
      ORDER BY study_date DESC
    `);
    
    const dates = rows.map(r => r.study_date);
    
    res.json(dates);
  } catch (error) {
    console.error('Error fetching study dates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Get all vocabularies with filters & search
app.get('/api/vocabularies', async (req, res) => {
  try {
    const pool = getPool();
    const { search, memory_level, study_date } = req.query;
    
    let query = 'SELECT * FROM vocabularies WHERE 1=1';
    const params = [];
    
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
    
    query += ' ORDER BY id DESC'; // Newest first
    
    const [rows] = await pool.query(query, params);
    
    const formattedRows = rows.map(r => {
      return { ...r, study_date: r.study_date };
    });

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching vocabularies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Add new vocabulary
app.post('/api/vocabularies', async (req, res) => {
  try {
    const pool = getPool();
    const { chinese, pinyin, han_viet, meaning, memory_level, study_date } = req.body;
    
    if (!chinese || !pinyin || !han_viet || !meaning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const level = memory_level || 'Chưa nhớ';
    const date = study_date || new Date().toISOString().split('T')[0]; // Default to today
    
    const query = `
      INSERT INTO vocabularies (chinese, pinyin, han_viet, meaning, memory_level, study_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [chinese, pinyin, han_viet, meaning, level, date]);
    
    res.status(201).json({
      id: result.insertId,
      chinese,
      pinyin,
      han_viet,
      meaning,
      memory_level: level,
      study_date: date
    });
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Update vocabulary
app.put('/api/vocabularies/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { chinese, pinyin, han_viet, meaning, memory_level, study_date } = req.body;
    
    // Check if word exists
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
      memory_level: memory_level !== undefined ? memory_level : current.memory_level,
      study_date: study_date !== undefined ? study_date : current.study_date
    };
    
    const query = `
      UPDATE vocabularies 
      SET chinese = ?, pinyin = ?, han_viet = ?, meaning = ?, memory_level = ?, study_date = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [
      updateFields.chinese,
      updateFields.pinyin,
      updateFields.han_viet,
      updateFields.meaning,
      updateFields.memory_level,
      updateFields.study_date,
      id
    ]);
    
    res.json({ id: parseInt(id), ...updateFields });
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Delete vocabulary
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
      
      // Clean brackets and quotes
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

// Initialize DB and start server
initDB()
  .then(() => {
    loadDictionary();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
