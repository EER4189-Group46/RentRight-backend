-- RentRight MySQL Database Schema
-- Multi-Category Item Rental Platform

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  role ENUM('renter', 'provider', 'admin') NOT NULL DEFAULT 'renter',
  provider_type ENUM('individual', 'business') NOT NULL DEFAULT 'individual',
  business_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_user (user_id),
  INDEX idx_reset_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Rental Items Table
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price_per_day DECIMAL(10, 2) NOT NULL,
  price_per_hour DECIMAL(10, 2) NULL,
  deposit_amount DECIMAL(10, 2) NULL,
  location VARCHAR(255) NOT NULL,
  status ENUM('available', 'rented', 'maintenance', 'unavailable') NOT NULL DEFAULT 'available',
  images JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_items_category (category_id),
  INDEX idx_items_provider (provider_id),
  INDEX idx_items_status (status),
  INDEX idx_items_price (price_per_day),
  INDEX idx_items_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Rental Requests Table
CREATE TABLE IF NOT EXISTS rental_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  renter_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_requests_item (item_id),
  INDEX idx_requests_renter (renter_id),
  INDEX idx_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Payments Table (Simulated Academic Gateway Flow)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rental_request_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'card',
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('completed', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rental_request_id) REFERENCES rental_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payments_user (user_id),
  INDEX idx_payments_request (rental_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
