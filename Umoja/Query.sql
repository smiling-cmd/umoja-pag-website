-- ============================================
-- Umoja P.A.G Church — Database Setup
-- Run this entire file in HeidiSQL's Query tab
-- ============================================

CREATE DATABASE IF NOT EXISTS umoja_church
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE umoja_church;

-- ── Admin users (for logging into admin.html) ──────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Registrations (from the public registration form) ──────
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(150) NULL,
  area VARCHAR(150) NULL,
  reg_for VARCHAR(100) NOT NULL,
  age_group VARCHAR(50) NULL,
  status ENUM('pending','contacted','active','inactive') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- IMPORTANT: This creates a placeholder admin user
-- with a TEMPORARY password that you MUST change.
-- The password below is: ChangeMe123!
-- It is stored properly hashed, not in plain text.
-- ============================================
INSERT INTO admin_users (username, password_hash)
VALUES (
  'admin',
  '$2b$10$HACx1tAnBV7Yk5nHTJGpzOwpf.JbJ8wZbqDMznosvz5YGJLOdrm36'
)
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO registrations
  (first_name, last_name, email, phone, area, reg_for, age_group, status, created_at)
VALUES
  ('Grace', 'Wanjiru', 'grace.wanjiru@example.com', '0712345678', 'Ruaka', 'Choir', 'Adult', 'pending', NOW()),
  ('Brian', 'Otieno', 'brian.otieno@example.com', '0798765432', 'Ridgeways', 'Worship Team', 'Youth', 'contacted', NOW()),
  ('Faith', 'Mumbi', NULL, '0722334455', 'Kamiti', 'New Member Registration', 'Adult', 'active', NOW());