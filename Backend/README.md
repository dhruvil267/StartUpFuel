# StartupFuel Investor Dashboard - Backend API

A comprehensive backend API for an investor dashboard platform built with Node.js, Express, and SQLite.

## 🚀 Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Portfolio Management**: Track portfolio performance, assets, and valuations
- **Transaction Tracking**: Record and analyze investment transactions
- **Report Generation**: Generate and manage investment reports
- **RESTful API**: Clean, well-documented API endpoints
- **SQLite Database**: Lightweight, file-based database perfect for MVP
- **Security**: Rate limiting, CORS, helmet security middleware
- **AWS Ready**: Configured for easy AWS deployment

## 📁 Project Structure

```
Backend/
├── database/
│   ├── connection.js      # Database connection and query methods
│   └── models.js          # Data models for Users, Portfolio, Transactions, Reports
├── middleware/
│   └── auth.js           # Authentication and authorization middleware
├── routes/
│   ├── auth.js           # Authentication routes (login, register, etc.)
│   ├── portfolio.js      # Portfolio management routes
│   ├── transactions.js   # Transaction management routes
│   └── reports.js        # Report generation and management routes
├── scripts/
│   ├── initDatabase.js   # Database schema initialization
│   └── seedDatabase.js   # Sample data seeding
├── public/
│   └── reports/          # Static report files
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── server.js            # Main server file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

The `.env` file is already configured with development defaults:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_key_here_change_in_production
DB_PATH=./database/investor_dashboard.db
AWS_REGION=us-east-1
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Seed Sample Data

```bash
npm run seed-db
```

### 5. Start the Server

```bash
# Development mode (with nodemon)
npm run dev


The server will start on `http://localhost:3000`

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Portfolio

- `GET /api/portfolio` - Get portfolio performance data
- `GET /api/portfolio/assets` - Get detailed portfolio assets
- `GET /api/portfolio/performance` - Get performance metrics with historical data

### Transactions

- `GET /api/transactions` - Get recent transactions (last 10 by default)
- `POST /api/transactions` - Create new transaction

### Reports

- `GET /api/reports` - Get list of available reports

### Health Check

- `GET /health` - Server health status

## 🗄️ Database Schema

### Users

- `id` (Primary Key)
- `email` (Unique)
- `password_hash`
- `first_name`
- `last_name`
- `role` (investor/admin)
- `created_at`, `updated_at`

### Portfolios

- `id` (Primary Key)
- `user_id` (Foreign Key)
- `name`
- `total_value`
- `cash_balance`
- `created_at`, `updated_at`

### Portfolio Assets

- `id` (Primary Key)
- `portfolio_id` (Foreign Key)
- `symbol`
- `shares`
- `purchase_price`
- `current_price`
- `purchase_date`

### Transactions

- `id` (Primary Key)
- `portfolio_id` (Foreign Key)
- `symbol`
- `transaction_type` (BUY/SELL/DIVIDEND)
- `shares`
- `price_per_share`
- `total_amount`
- `transaction_date`
- `notes`

### Reports

- `id` (Primary Key)
- `user_id` (Foreign Key)
- `title`
- `file_url`
- `report_type` (MONTHLY/QUARTERLY/ANNUAL/CUSTOM)
- `generated_date`

## 🧪 Sample Data

The seed script creates:

- Demo user: `demo@startupfuel.com` / `demo123`
- Sample portfolio with 5 major stocks (AAPL, GOOGL, TSLA, MSFT, AMZN)
- 5 sample transactions
- 3 sample reports
