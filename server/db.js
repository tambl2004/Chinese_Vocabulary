import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = 'root',
  DB_NAME = 'hsk_vocab'
} = process.env;

let pool;

export async function initDB() {
  // First, connect to MySQL without specifying a database to create it if it doesn't exist
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();

  // Create the connection pool with the database specified
  pool = mysql.createPool({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
  });

  // Dynamic schema migration check: check if the 'word_type' column exists in vocabularies.
  // If the column does not exist (old schema), we drop the tables to rebuild them.
  try {
    const [columns] = await pool.query(`
      SHOW COLUMNS FROM vocabularies LIKE 'word_type'
    `);
    if (columns.length === 0) {
      throw new Error('Migrating database: word_type column missing.');
    }
  } catch (err) {
    console.log('Old database schema detected. Migrating tables to support word type classifications and tracking...');
    await pool.query('DROP TABLE IF EXISTS vocabularies');
    await pool.query('DROP TABLE IF EXISTS english_vocabularies');
    await pool.query('DROP TABLE IF EXISTS users');
  }

  // Create users table
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createUsersTableQuery);

  // Create vocabularies (Chinese) table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS vocabularies (
      id INT AUTO_INCREMENT PRIMARY KEY,
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableQuery);

  // Create english_vocabularies table
  const createEnglishTableQuery = `
    CREATE TABLE IF NOT EXISTS english_vocabularies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      word VARCHAR(255) NOT NULL,
      transliteration VARCHAR(255) NOT NULL,
      meaning TEXT NOT NULL,
      word_type VARCHAR(50) NULL,
      memory_level VARCHAR(50) NOT NULL DEFAULT 'Chưa nhớ',
      study_date DATE NULL,
      last_reviewed_at DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createEnglishTableQuery);

  // Seed default users if empty
  const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (userRows[0].count === 0) {
    console.log('No users found. Seeding default admin and user accounts...');
    
    // Hash passwords
    const hashedAdminPass = await bcrypt.hash('admin', 10);
    const hashedUserPass = await bcrypt.hash('user', 10);
    
    await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedAdminPass, 'admin']);
    await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['user', hashedUserPass, 'user']);
    console.log('Default users seeded.');
  }

  // Get normal user ID for seeding vocabularies
  const [normalUserResult] = await pool.query('SELECT id FROM users WHERE username = ?', ['user']);
  const normalUserId = normalUserResult[0]?.id;

  if (normalUserId) {
    // Seed default Chinese vocabularies if empty
    const [chineseCountRows] = await pool.query('SELECT COUNT(*) as count FROM vocabularies');
    if (chineseCountRows[0].count === 0) {
      console.log('Seeding default Chinese vocabularies for default user...');
      const defaultWords = [
        { chinese: '城里', pinyin: 'chéng lǐ', han_viet: 'thành lý', meaning: 'trong thành phố', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
        { chinese: '郊区', pinyin: 'jiāo qū', han_viet: 'giao khu', meaning: 'ngoại ô', word_type: 'Danh từ', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
        { chinese: '空气', pinyin: 'kōng qì', han_viet: 'không khí', meaning: 'không khí', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
        { chinese: '笔记', pinyin: 'bǐ jì', han_viet: 'bút ký', meaning: 'ghi chép', word_type: 'Danh từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { chinese: '拜托', pinyin: 'bài tuō', han_viet: 'bái thác', meaning: 'nhờ vả', word_type: 'Động từ', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
        { chinese: '汉语', pinyin: 'hàn ngữ', pinyin_accent: 'hàn yǔ', han_viet: 'hán ngữ', meaning: 'tiếng Trung', word_type: 'Danh từ', memory_level: 'Đã nhớ', study_date: '2026-08-20' },
        { chinese: '词汇', pinyin: 'cí huì', han_viet: 'từ vựng', meaning: 'từ vựng', word_type: 'Danh từ', memory_level: 'Đang nhớ', study_date: '2026-08-19' },
        { chinese: '学习', pinyin: 'xué xí', han_viet: 'học tập', meaning: 'học tập', word_type: 'Động từ', memory_level: 'Đã nhớ', study_date: '2026-08-18' },
        { chinese: '努力', pinyin: 'nǔ lì', han_viet: 'nỗ lực', meaning: 'nỗ lực, cố gắng', word_type: 'Tính từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { chinese: '简单', pinyin: 'jiǎn dān', han_viet: 'giản đơn', meaning: 'đơn giản', word_type: 'Tính từ', memory_level: 'Đã nhớ', study_date: '2026-08-15' },
        { chinese: '复杂', pinyin: 'fù zá', han_viet: 'phức tạp', meaning: 'phức tạp', word_type: 'Tính từ', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
        { chinese: '感谢', pinyin: 'gǎn xiè', han_viet: 'cảm tạ', meaning: 'cảm ơn', word_type: 'Động từ', memory_level: 'Đã nhớ', study_date: '2026-08-10' }
      ];

      const insertQuery = `
        INSERT INTO vocabularies (user_id, chinese, pinyin, han_viet, meaning, word_type, memory_level, study_date, last_reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const word of defaultWords) {
        await pool.query(insertQuery, [
          normalUserId,
          word.chinese,
          word.pinyin,
          word.han_viet,
          word.meaning,
          word.word_type,
          word.memory_level,
          word.study_date,
          word.study_date // last_reviewed_at matches study_date initially
        ]);
      }
      console.log('Chinese seeding completed.');
    }

    // Seed default English vocabularies if empty
    const [englishCountRows] = await pool.query('SELECT COUNT(*) as count FROM english_vocabularies');
    if (englishCountRows[0].count === 0) {
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const item of defaultEnglishWords) {
        await pool.query(insertEnglishQuery, [
          normalUserId,
          item.word,
          item.transliteration,
          item.meaning,
          item.word_type,
          item.memory_level,
          item.study_date,
          item.study_date // last_reviewed_at matches study_date initially
        ]);
      }
      console.log('English seeding completed.');
    }
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDB first.');
  }
  return pool;
}
