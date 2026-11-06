-- SAMRA VEHICLE SERVICE MANAGEMENT SYSTEM
-- Run this file in MySQL Workbench.

CREATE DATABASE IF NOT EXISTS samra_vehicle_service;
USE samra_vehicle_service;

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL UNIQUE,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    CONSTRAINT fk_vehicle_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    service_date DATE NOT NULL,
    description TEXT,
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Requested',
    CONSTRAINT fk_service_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    CONSTRAINT fk_payment_service
        FOREIGN KEY (service_id) REFERENCES services(service_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Optional sample records (uncomment to insert examples)
-- INSERT INTO customers (name, phone, email, address)
-- VALUES ('Ayesha Khan', '9876543210', 'ayesha@example.com', 'Anantapur');
