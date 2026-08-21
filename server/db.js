import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

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

  // Create table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS vocabularies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chinese VARCHAR(255) NOT NULL,
      pinyin VARCHAR(255) NOT NULL,
      han_viet VARCHAR(255) NOT NULL,
      meaning TEXT NOT NULL,
      memory_level VARCHAR(50) NOT NULL DEFAULT 'Chưa nhớ',
      study_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(createTableQuery);

  // Check if table is empty and seed default data
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM vocabularies');
  if (rows[0].count === 0) {
    console.log('Database is empty. Seeding default vocabularies...');
    const defaultWords = [
      { chinese: '城里', pinyin: 'chéng lǐ', han_viet: 'thành lý', meaning: 'trong thành phố', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
      { chinese: '郊区', pinyin: 'jiāo qū', han_viet: 'giao khu', meaning: 'ngoại ô', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
      { chinese: '空气', pinyin: 'kōng qì', han_viet: 'không khí', meaning: 'không khí', memory_level: 'Đã nhớ', study_date: '2026-08-21' },
      { chinese: '笔记', pinyin: 'bǐ jì', han_viet: 'bút ký', meaning: 'ghi chép', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
      { chinese: '拜托', pinyin: 'bài tuō', han_viet: 'bái thác', meaning: 'nhờ vả', memory_level: 'Đang nhớ', study_date: '2026-08-21' },
      { chinese: '汉语', pinyin: 'hàn yǔ', han_viet: 'hán ngữ', meaning: 'tiếng Trung', memory_level: 'Đã nhớ', study_date: '2026-08-20' },
      { chinese: '词汇', pinyin: 'cí huì', han_viet: 'từ vựng', meaning: 'từ vựng', memory_level: 'Đang nhớ', study_date: '2026-08-19' },
      { chinese: '学习', pinyin: 'xué xí', han_viet: 'học tập', meaning: 'học tập', memory_level: 'Đã nhớ', study_date: '2026-08-18' },
      { chinese: '努力', pinyin: 'nǔ lì', han_viet: 'nỗ lực', meaning: 'nỗ lực, cố gắng', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
      { chinese: '简单', pinyin: 'jiǎn dān', han_viet: 'giản đơn', meaning: 'đơn giản', memory_level: 'Đã nhớ', study_date: '2026-08-15' },
      { chinese: '复杂', pinyin: 'fù zá', han_viet: 'phức tạp', meaning: 'phức tạp', memory_level: 'Chưa nhớ', study_date: '2026-08-21' },
      { chinese: '感谢', pinyin: 'gǎn xiè', han_viet: 'cảm tạ', meaning: 'cảm ơn', memory_level: 'Đã nhớ', study_date: '2026-08-10' }
    ];

    const insertQuery = `
      INSERT INTO vocabularies (chinese, pinyin, han_viet, meaning, memory_level, study_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const word of defaultWords) {
      await pool.query(insertQuery, [
        word.chinese,
        word.pinyin,
        word.han_viet,
        word.meaning,
        word.memory_level,
        word.study_date
      ]);
    }
    console.log('Seeding completed.');
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDB first.');
  }
  return pool;
}
