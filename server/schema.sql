CREATE DATABASE IF NOT EXISTS hsk_vocab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hsk_vocab;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  plain_password VARCHAR(255) NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin', 'user'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vocabularies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  chinese VARCHAR(255) NOT NULL,
  pinyin VARCHAR(255) NOT NULL,
  han_viet VARCHAR(255) NOT NULL,
  meaning TEXT NOT NULL,
  word_type VARCHAR(50) NULL, -- 'Danh từ', 'Động từ', 'Tính từ', 'Khác'
  memory_level VARCHAR(50) NOT NULL DEFAULT 'Chưa nhớ', -- 'Chưa nhớ', 'Đang nhớ', 'Đã nhớ', 'Rất nhớ'
  study_date DATE NULL,
  last_reviewed_at DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS english_vocabularies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  word VARCHAR(255) NOT NULL,
  transliteration VARCHAR(255) NOT NULL,
  meaning TEXT NOT NULL,
  word_type VARCHAR(50) NULL, -- 'Danh từ', 'Động từ', 'Tính từ', 'Khác'
  memory_level VARCHAR(50) NOT NULL DEFAULT 'Chưa nhớ', -- 'Chưa nhớ', 'Đang nhớ', 'Đã nhớ', 'Rất nhớ'
  study_date DATE NULL,
  last_reviewed_at DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
