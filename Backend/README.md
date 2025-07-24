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

# Production mode
npm start
```

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
- `GET /api/transactions/:id` - Get specific transaction details
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/summary/stats` - Get transaction statistics

### Reports
- `GET /api/reports` - Get list of available reports
- `GET /api/reports/:id` - Get specific report details
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/download/:filename` - Download report file

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

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Register or login to receive a JWT token
2. Include the token in the Authorization header: `Bearer <your_token>`
3. Tokens expire after 24 hours

## 📊 Sample API Usage

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@startupfuel.com", "password": "demo123"}'
```

### Get Portfolio
```bash
curl -X GET http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer <your_token>"
```

### Get Transactions
```bash
curl -X GET "http://localhost:3000/api/transactions?limit=5" \
  -H "Authorization: Bearer <your_token>"
```

## 🚀 AWS Deployment Ready

The application is configured for AWS deployment with:
- Environment variables for AWS configuration
- SQLite database (can be migrated to RDS)
- Static file serving (ready for S3 integration)
- Health check endpoint for load balancers
- Security middleware for production

### Deployment Steps:
1. **EC2 Instance**: Deploy on EC2 with PM2 for process management
2. **RDS Migration**: Migrate from SQLite to PostgreSQL/MySQL on RDS
3. **S3 Integration**: Move static files and reports to S3
4. **Load Balancer**: Use ALB with health checks
5. **CloudWatch**: Add logging and monitoring

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers middleware
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: SQL injection prevention
- **Error Handling**: Sanitized error responses

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database schema
- `npm run seed-db` - Seed database with sample data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Important Notes

- Change JWT_SECRET in production
- SQLite is perfect for MVP but consider PostgreSQL for production
- Sample reports are placeholders - implement actual PDF generation
- Add comprehensive error logging in production
- Implement proper file upload/download for reports
- Add unit and integration tests
- Consider implementing real-time price updates
- Add data validation middleware
