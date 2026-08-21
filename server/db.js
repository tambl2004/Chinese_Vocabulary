import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

const {
  DATABASE_URL,
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_NAME = 'postgres'
} = process.env;

let poolConnection;

export async function initDB() {
  console.log('Connecting to PostgreSQL database...');
  if (DATABASE_URL) {
    poolConnection = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } else {
    poolConnection = new Pool({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });
  }

  // Check database connection
  await poolConnection.query('SELECT NOW()');
  console.log('PostgreSQL database connected successfully.');

  // Migration scan: check if 'word_type' column exists in vocabularies.
  // Re-build all tables dynamically if outdated.
  try {
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vocabularies' AND column_name = 'word_type'
    `;
    const checkResult = await poolConnection.query(checkColumnQuery);
    
    // Check if tables exist at all
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vocabularies'
      )
    `;
    const checkTableResult = await poolConnection.query(checkTableQuery);
    const tableExists = checkTableResult.rows[0].exists;

    if (tableExists && checkResult.rows.length === 0) {
      throw new Error('Outdated schema detected.');
    }
  } catch (err) {
    console.log('Migrating database schema for PostgreSQL...');
    await poolConnection.query('DROP TABLE IF EXISTS vocabularies CASCADE');
    await poolConnection.query('DROP TABLE IF EXISTS english_vocabularies CASCADE');
    await poolConnection.query('DROP TABLE IF EXISTS users CASCADE');
  }

  // 1. Create users table
  await poolConnection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      plain_password VARCHAR(255) NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Create vocabularies (Chinese) table
  await poolConnection.query(`
    CREATE TABLE IF NOT EXISTS vocabularies (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      chinese VARCHAR(255) NOT NULL,
      pinyin VARCHAR(255) NOT NULL,
      han_viet VARCHAR(255) NOT NULL,
      meaning TEXT NOT NULL,
      word_type VARCHAR(50) NULL,
      memory_level VARCHAR(50) NOT NULL DEFAULT 'Chưa nhớ',
      study_date DATE NULL,
      last_reviewed_at DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 3. Create english_vocabularies table
  await poolConnection.query(`
    CREATE TABLE IF NOT EXISTS english_vocabularies (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      word VARCHAR(255) NOT NULL,
      transliteration VARCHAR(255) NOT NULL,
      meaning TEXT NOT NULL,
      word_type VARCHAR(50) NULL,
      memory_level VARCHAR(50) NOT NULL DEFAULT 'Chưa nhớ',
      study_date DATE NULL,
      last_reviewed_at DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed default users if empty
  const userRows = await poolConnection.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(userRows.rows[0].count) === 0) {
    console.log('No users found. Seeding default admin and user accounts...');
    
    // Hash passwords
    const hashedAdminPass = await bcrypt.hash('admin', 10);
    const hashedUserPass = await bcrypt.hash('user', 10);
    
    await poolConnection.query('INSERT INTO users (username, password, plain_password, role) VALUES ($1, $2, $3, $4)', ['admin', hashedAdminPass, 'admin', 'admin']);
    await poolConnection.query('INSERT INTO users (username, password, plain_password, role) VALUES ($1, $2, $3, $4)', ['user', hashedUserPass, 'user', 'user']);
    console.log('Default users seeded.');
  }

  // Get normal user ID for seeding vocabularies
  const normalUserResult = await poolConnection.query('SELECT id FROM users WHERE username = $1', ['user']);
  const normalUserId = normalUserResult.rows[0]?.id;

  if (normalUserId) {
    // Seed default Chinese vocabularies if empty
    const chineseCountRows = await poolConnection.query('SELECT COUNT(*) as count FROM vocabularies');
    if (parseInt(chineseCountRows.rows[0].count) === 0) {
      console.log('Seeding default Chinese vocabularies for default user...');
      const defaultWords = [
        { chinese: '城里', pinyin: 'chéng lǐ', han_viet: 'thành lý', meaning: 'trong thành phố', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
        { chinese: '郊区', pinyin: 'jiāo qū', han_viet: 'giao khu', meaning: 'ngoại ô', word_type: 'Danh từ', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
        { chinese: '空气', pinyin: 'kōng qì', han_viet: 'không khí', meaning: 'không khí', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
        { chinese: '笔记', pinyin: 'bǐ jì', han_viet: 'bút ký', meaning: 'ghi chép', word_type: 'Danh từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { chinese: '拜托', pinyin: 'bài tuō', han_viet: 'bái thác', meaning: 'nhờ vả', word_type: 'Động từ', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
        { chinese: '汉语', pinyin: 'hàn ngữ', han_viet: 'hán ngữ', meaning: 'tiếng Trung', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-20' },
        { chinese: '词汇', pinyin: 'cí huì', han_viet: 'từ vựng', meaning: 'từ vựng', word_type: 'Danh từ', memory_level: 'Đang nhớ', study_date: '2026-08-19' },
        { chinese: '学习', pinyin: 'xué xí', han_viet: 'học tập', meaning: 'học tập', word_type: 'Động từ', memory_level: 'Đã nhớ', study_date: '2026-08-18' },
        { chinese: '努力', pinyin: 'nǔ lì', han_viet: 'nỗ lực', meaning: 'nỗ lực, cố gắng', word_type: 'Tính từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { chinese: '简单', pinyin: 'jiǎn dān', han_viet: 'giản đơn', meaning: 'đơn giản', word_type: 'Tính từ', memory_level: 'Đã nhớ', study_date: '2026-08-15' },
        { chinese: '复杂', pinyin: 'fù zá', han_viet: 'phức tạp', meaning: 'phức tạp', word_type: 'Tính từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { chinese: '感谢', pinyin: 'gǎn xiè', han_viet: 'cảm tạ', meaning: 'cảm ơn', word_type: 'Động từ', memory_level: 'Đã nhớ', study_date: '2026-08-10' }
      ];

      const insertQuery = `
        INSERT INTO vocabularies (user_id, chinese, pinyin, han_viet, meaning, word_type, memory_level, study_date, last_reviewed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      for (const word of defaultWords) {
        await poolConnection.query(insertQuery, [
          normalUserId,
          word.chinese,
          word.pinyin,
          word.han_viet,
          word.meaning,
          word.word_type,
          word.memory_level,
          word.study_date,
          word.study_date
        ]);
      }
      console.log('Chinese seeding completed.');
    }

    // Seed default English vocabularies if empty
    const englishCountRows = await poolConnection.query('SELECT COUNT(*) as count FROM english_vocabularies');
    if (parseInt(englishCountRows.rows[0].count) === 0) {
      console.log('Seeding default English words for default user...');
      const defaultEnglishWords = [
        { word: 'Language', transliteration: "/'læŋgwədʒ/", meaning: 'Ngôn ngữ', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
        { word: 'Together', transliteration: "/tə'geðər/", meaning: 'Cùng nhau', word_type: 'Khác', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
        { word: 'Begin', transliteration: "/bɪ'gɪn/", meaning: 'Bắt đầu', word_type: 'Động từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { word: 'Program', transliteration: "/'proʊˌgræm/", meaning: 'Chương trình', word_type: 'Danh từ', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
        { word: 'Agree', transliteration: "/ə'gri/", meaning: 'Đồng ý', word_type: 'Động từ', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
        { word: 'Recognise', transliteration: "/'rekəgˌnaɪz/", meaning: 'Nhận ra', word_type: 'Động từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { word: 'English', transliteration: "/'ɪŋglɪʃ/", meaning: 'Tiếng Anh', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-21' }
      ];

      const insertEnglishQuery = `
        INSERT INTO english_vocabularies (user_id, word, transliteration, meaning, word_type, memory_level, study_date, last_reviewed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      for (const item of defaultEnglishWords) {
        await poolConnection.query(insertEnglishQuery, [
          normalUserId,
          item.word,
          item.transliteration,
          item.meaning,
          item.word_type,
          item.memory_level,
          item.study_date,
          item.study_date
        ]);
      }
      console.log('English seeding completed.');
    }
  }
}

export function getPool() {
  if (!poolConnection) {
    throw new Error('Database pool not initialized. Call initDB first.');
  }
  
  // Return wrapper matching mysql2 api (destructured array values)
  return {
    query: async (text, params) => {
      let pgText = text;
      
      // 1. MySQL "?" parameter placeholders to PostgreSQL sequential "$1, $2, ..."
      let paramCount = 0;
      pgText = pgText.replace(/\?/g, () => {
        paramCount++;
        return `$${paramCount}`;
      });

      // 2. MySQL DATE(study_date) to PostgreSQL compatible syntax
      pgText = pgText.replace(/DATE\(\s*study_date\s*\)/gi, 'study_date');

      // 3. MySQL DATE_SUB(CURRENT_DATE(), INTERVAL 5 DAY) to PostgreSQL
      pgText = pgText.replace(/DATE_SUB\s*\(\s*CURRENT_DATE\s*\(\s*\)\s*,\s*INTERVAL\s*5\s*DAY\s*\)/gi, "CURRENT_DATE - INTERVAL '5 days'");
      pgText = pgText.replace(/DATE_SUB\s*\(\s*CURRENT_DATE\s*,\s*INTERVAL\s*5\s*DAY\s*\)/gi, "CURRENT_DATE - INTERVAL '5 days'");

      // 4. Append "RETURNING id" to INSERT queries to mimic insertId behavior
      const trimmed = pgText.trim().toUpperCase();
      if (trimmed.startsWith('INSERT') && !trimmed.includes('RETURNING')) {
        pgText += ' RETURNING id';
      }

      const res = await poolConnection.query(pgText, params);
      const rows = res.rows || [];
      const resultObj = {
        affectedRows: res.rowCount,
        insertId: rows[0]?.id || null
      };

      return [rows, resultObj];
    }
  };
}
