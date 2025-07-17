-- PayGo Database Schema
-- Solar Refrigeration Pay-as-you-go System
-- Database: paygodb

CREATE DATABASE IF NOT EXISTS paygodb;
USE paygodb;

-- ===================================
-- 1. ADMIN USERS TABLE
-- ===================================
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin', 'support') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===================================
-- 2. PRODUCT CATEGORIES TABLE
-- ===================================
CREATE TABLE product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL, -- 'Fridge', 'Freezer', 'Refrigerator'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- 3. PRODUCTS TABLE
-- ===================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, -- 'KOYO BC-90DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER'
    model_code VARCHAR(50) NOT NULL, -- 'BC-90DC'
    description_text TEXT,
    long_description TEXT,
    capacity_litres INT, -- 90
    power_consumption_watts INT, -- 65
    color VARCHAR(50), -- 'Grey', 'White'
    defrost_type ENUM('Manual', 'Automatic') DEFAULT 'Manual',
    cash_warranty_months INT DEFAULT 12, -- 1 year
    paygo_warranty_months INT DEFAULT 24, -- 2 years
    price_usd DECIMAL(10,2) NOT NULL, -- 1290.00
    weekly_installment_usd DECIMAL(10,2) NOT NULL, -- 25.00
    monthly_installment_usd DECIMAL(10,2), -- calculated field
    features JSON, -- Store features array as JSON
    images JSON, -- Store image URLs as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT
);

-- ===================================
-- 4. CLIENTS TABLE
-- ===================================
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_code VARCHAR(20) UNIQUE NOT NULL, -- 'CL001'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    location VARCHAR(255), -- 'Nairobi, Kenya'
    payment_plan ENUM('weekly', 'monthly') NOT NULL,
    status ENUM('active', 'suspended', 'completed', 'defaulted') DEFAULT 'active',
    payment_status ENUM('current', 'overdue', 'completed') DEFAULT 'current',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===================================
-- 5. APPLIANCES TABLE
-- ===================================
CREATE TABLE appliances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unit_id VARCHAR(50) UNIQUE NOT NULL, -- 'UNIT-001', 'KOYO001'
    serial_number VARCHAR(100) UNIQUE NOT NULL, -- 'KY90-2024-001'
    client_id INT NOT NULL,
    product_id INT NOT NULL,
    installation_location VARCHAR(255) NOT NULL,
    installation_date DATE NOT NULL,
    status ENUM('active', 'offline', 'maintenance', 'decommissioned') DEFAULT 'active',
    current_temperature VARCHAR(10), -- '3°C'
    current_battery_voltage VARCHAR(10), -- '12.8V'
    last_ping TIMESTAMP NULL,
    last_maintenance_date DATE NULL,
    warranty_expiry_date DATE,
    installation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ===================================
-- 6. PAYMENT PLANS TABLE
-- ===================================
CREATE TABLE payment_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    appliance_id INT NOT NULL,
    total_amount_usd DECIMAL(10,2) NOT NULL, -- 1290.00
    down_payment_usd DECIMAL(10,2) DEFAULT 0, -- 129.00 (10%)
    installment_amount_usd DECIMAL(10,2) NOT NULL, -- 25.00
    payment_frequency ENUM('weekly', 'monthly') NOT NULL,
    total_installments INT NOT NULL, -- 52 weeks
    installments_completed INT DEFAULT 0,
    total_paid_usd DECIMAL(10,2) DEFAULT 0,
    remaining_balance_usd DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    expected_completion_date DATE NOT NULL,
    next_payment_due_date DATE NOT NULL,
    grace_period_days INT DEFAULT 3,
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    status ENUM('active', 'completed', 'defaulted', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE RESTRICT
);

-- ===================================
-- 7. PAYMENTS TABLE
-- ===================================
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_plan_id INT NOT NULL,
    client_id INT NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('M-Pesa', 'Airtel Money', 'Bank Transfer', 'Cash', 'Other') NOT NULL,
    payment_reference VARCHAR(100), -- M-Pesa transaction ID
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    late_fee_usd DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    processed_by INT, -- admin user ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ===================================
-- 8. APPLIANCE_MONITORING TABLE
-- ===================================
CREATE TABLE appliance_monitoring (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appliance_id INT NOT NULL,
    temperature VARCHAR(10), -- '3°C'
    battery_voltage VARCHAR(10), -- '12.8V'
    power_status ENUM('on', 'off', 'paygo_disabled') DEFAULT 'on',
    signal_strength INT, -- 0-100
    error_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE CASCADE,
    INDEX idx_appliance_date (appliance_id, recorded_at)
);

-- ===================================
-- 9. CONTACT_INQUIRIES TABLE
-- ===================================
CREATE TABLE contact_inquiries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject ENUM('sales', 'support', 'paygo', 'partnership', 'other') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to INT, -- admin user ID
    response_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_to) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ===================================
-- 10. PAYMENT_REMINDERS TABLE
-- ===================================
CREATE TABLE payment_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_plan_id INT NOT NULL,
    client_id INT NOT NULL,
    reminder_type ENUM('3_days', '1_day', 'due_date', 'overdue') NOT NULL,
    sent_via ENUM('SMS', 'Email', 'Push') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status ENUM('sent', 'delivered', 'failed') DEFAULT 'sent',
    message_content TEXT,
    
    FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ===================================
-- 11. SYSTEM_SETTINGS TABLE
-- ===================================
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_active BOOLEAN DEFAULT TRUE,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ===================================
-- 12. LOCATIONS TABLE
-- ===================================
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(255) NOT NULL, -- 'Nairobi', 'Mombasa'
    region VARCHAR(100), -- 'Central', 'Coast'
    country VARCHAR(100) DEFAULT 'Kenya',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- 13. AUDIT_LOGS TABLE
-- ===================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT, -- admin or client ID
    user_type ENUM('admin', 'client') NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'payment_made', 'appliance_registered'
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Clients table indexes
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_payment_status ON clients(payment_status);

-- Appliances table indexes
CREATE INDEX idx_appliances_unit_id ON appliances(unit_id);
CREATE INDEX idx_appliances_client ON appliances(client_id);
CREATE INDEX idx_appliances_status ON appliances(status);

-- Payments table indexes
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- Payment plans table indexes
CREATE INDEX idx_payment_plans_client ON payment_plans(client_id);
CREATE INDEX idx_payment_plans_status ON payment_plans(status);
CREATE INDEX idx_payment_plans_next_due ON payment_plans(next_payment_due_date);

-- ===================================
-- SAMPLE DATA INSERTION
-- ===================================

-- Insert product categories
INSERT INTO product_categories (name, description) VALUES
('Fridge', 'Single and double door refrigerators'),
('Freezer', 'Deep freezers for frozen storage'),
('Display Cooler', 'Glass door display refrigerators');

-- Insert sample products
INSERT INTO products (category_id, name, model_code, description_text, capacity_litres, power_consumption_watts, color, price_usd, weekly_installment_usd, features, images) VALUES
(1, 'KOYO BC-50DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER', 'BC-50DC', 'A compact and efficient single-door fridge with a dedicated freezer chamber', 50, 45, 'Grey', 805.00, 15.00, 
 JSON_ARRAY('Single Door', 'Freezer Chamber', 'Compact Design', 'Energy Efficient', 'Solar Powered', 'Dual Power'), 
 JSON_ARRAY('/images/koyo-50l-1.jpg', '/images/koyo-50l-2.jpg')),

(1, 'KOYO BC-90DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER', 'BC-90DC', 'This 90-litre single-door fridge offers ample storage for essentials', 90, 65, 'Grey', 1290.00, 25.00,
 JSON_ARRAY('Single Door', 'Freezer Chamber', 'Medium Capacity', 'Reliable Cooling', 'Solar Powered', 'Dual Power'),
 JSON_ARRAY('/images/koyo-90l-1.jpg', '/images/koyo-90l-2.jpg')),

(2, 'KOYO BC-268DC FREEZER DOUBLE DOOR', 'BC-268DC', 'The KOYO BC-268DC is a robust double-door freezer, providing extensive storage', 268, 81, 'White', 1240.00, 24.00,
 JSON_ARRAY('Double Door', 'Large Capacity', 'Deep Freezing', 'White Finish', 'Solar Powered', 'Dual Power'),
 JSON_ARRAY('/images/koyo-268l-1.jpg', '/images/koyo-268l-2.jpg'));

-- Insert sample admin user
INSERT INTO admin_users (email, password_hash, first_name, last_name, role) VALUES
('admin@koyo.com', '$2y$10$hash_placeholder', 'Admin', 'User', 'super_admin');

-- Insert sample system settings
INSERT INTO system_settings (setting_key, setting_value, description, data_type) VALUES
('grace_period_days', '3', 'Number of days grace period for payments', 'number'),
('late_fee_percentage', '5', 'Late fee percentage on overdue payments', 'number'),
('sms_provider', 'Africa\'s Talking', 'SMS service provider', 'string'),
('company_email', 'info@dropaccess.tech', 'Company contact email', 'string'),
('company_phone', '+254 702 627 384', 'Company contact phone', 'string');

-- Insert locations
INSERT INTO locations (location_name, region, latitude, longitude) VALUES
('Nairobi', 'Central', -1.286389, 36.817223),
('Mombasa', 'Coast', -4.043740, 39.668207),
('Kisumu', 'Nyanza', -0.091702, 34.767956),
('Nakuru', 'Rift Valley', -0.307262, 36.080026),
('Eldoret', 'Rift Valley', 0.514277, 35.269779);