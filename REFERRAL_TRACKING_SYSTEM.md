# Referral Tracking System

## Overview

The referral tracking system allows sales persons to track their referrals and automatically increases their referral count when clients register using their referral codes.

## Features

### For Main Admin Panel
- **Sales Persons Management**: Add, edit, delete, and track sales persons
- **Referral Performance**: View total and monthly referral counts for each sales person
- **Referral Code Management**: Generate unique referral codes for each sales person
- **Referral Tracking**: Monitor which clients were referred by which sales person

### For Sales Admin (Client Admin)
- **Track Referrals**: View all clients who registered using their referral code
- **Performance Dashboard**: See total referrals, monthly referrals, and active referrals
- **Referral Code Sharing**: Easy copy-to-clipboard functionality for sharing referral codes
- **Client Information**: View detailed information about referred clients

## Database Schema

### sales_persons Table
```sql
CREATE TABLE sales_persons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(32),
  referral_code VARCHAR(64) NOT NULL UNIQUE,
  total_referrals INT NOT NULL DEFAULT 0,
  monthly_referrals INT NOT NULL DEFAULT 0,
  last_monthly_reset DATE DEFAULT (CURDATE()),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### referrals Table
```sql
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sales_person_id INT NOT NULL,
  client_id INT NOT NULL,
  referral_code VARCHAR(64) NOT NULL,
  referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'converted', 'expired') DEFAULT 'pending',
  FOREIGN KEY (sales_person_id) REFERENCES sales_persons(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_client_referral (client_id)
);
```

## API Endpoints

### Sales Persons Management
- `GET /api/sales-persons` - Get all sales persons with referral counts
- `POST /api/sales-persons` - Create a new sales person
- `PUT /api/sales-persons/:id` - Update a sales person
- `DELETE /api/sales-persons/:id` - Delete a sales person

### Referral Tracking
- `GET /api/sales-persons/:id/referrals` - Get referrals for a specific sales person
- `GET /api/sales-persons/referral/:code` - Get sales person by referral code
- `POST /api/referrals` - Create a referral record
- `POST /api/sales-persons/reset-monthly-referrals` - Reset monthly referral counts

## How It Works

### 1. Sales Person Creation
When an admin creates a new sales person:
- A unique 8-character referral code is automatically generated
- The sales person is added to the system with initial referral counts of 0

### 2. Client Registration with Referral Code
When a client registers with a referral code:
- The system validates the referral code against active sales persons
- If valid, a referral record is created linking the client to the sales person
- The sales person's total and monthly referral counts are automatically incremented
- The client is created normally with the referral information

### 3. Referral Tracking
Sales persons can:
- View their referral performance dashboard
- See detailed information about referred clients
- Copy their referral code for sharing
- Track both total and monthly referral counts

### 4. Monthly Reset
The system includes functionality to reset monthly referral counts:
- Can be called manually by admin
- Can be automated via cron job
- Only affects sales persons whose last reset was before the current month

## Frontend Pages

### Main Admin Panel
- **Sales Persons Page** (`/sales-persons`): Manage all sales persons, view performance, and handle CRUD operations

### Client Admin Panel
- **Track Referrals Page** (`/client-admin/track-referrals`): View referral performance and client information

## Permissions

The system includes proper permission controls:
- `view:sales_persons` - Required to access the sales persons management page
- Only admins can create, edit, and delete sales persons
- Sales persons can only view their own referral data

## Usage Instructions

### For Administrators
1. Navigate to "Sales Persons" in the main admin panel
2. Click "Add Sales Person" to create new sales person accounts
3. The system will automatically generate unique referral codes
4. Monitor referral performance through the dashboard
5. Use the "Reset Monthly Referrals" function when needed

### For Sales Persons
1. Log in to the client admin panel
2. Navigate to "Track Referrals" in the sidebar
3. View your referral performance dashboard
4. Copy your referral code to share with potential clients
5. Monitor referred clients and their status

### For Client Registration
1. When creating a new client, optionally provide a referral code
2. The system will automatically validate the code and create referral records
3. Sales person referral counts will be updated automatically

## Security Features

- Unique referral codes prevent conflicts
- Foreign key constraints ensure data integrity
- Permission-based access control
- Transaction-based operations prevent partial updates
- Input validation and sanitization

## Future Enhancements

Potential improvements for the referral system:
- Commission tracking and calculations
- Referral tiers and bonuses
- Automated email notifications for new referrals
- Referral analytics and reporting
- Integration with payment systems
- Referral expiration and renewal logic
