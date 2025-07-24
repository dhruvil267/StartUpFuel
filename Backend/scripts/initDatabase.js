require('dotenv').config();
const database = require('../database/connection');

async function initializeDatabase() {
  try {
    await database.connect();
    
    console.log('🏗️ Creating database tables...');
    
    // Users table
    await database.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'investor' CHECK(role IN ('investor', 'admin')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Portfolios table
    await database.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        total_value REAL DEFAULT 0,
        cash_balance REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Portfolio assets table
    await database.query(`
      CREATE TABLE IF NOT EXISTS portfolio_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        portfolio_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        shares REAL NOT NULL,
        purchase_price REAL NOT NULL,
        purchase_date TEXT NOT NULL,
        current_price REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (portfolio_id) REFERENCES portfolios (id)
      )
    `);

    // Transactions table
    await database.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        portfolio_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('BUY', 'SELL', 'DIVIDEND')),
        shares REAL NOT NULL,
        price_per_share REAL NOT NULL,
        total_amount REAL NOT NULL,
        transaction_date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (portfolio_id) REFERENCES portfolios (id)
      )
    `);

    // Reports table
    await database.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        file_url TEXT NOT NULL,
        report_type TEXT NOT NULL CHECK(report_type IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM')),
        generated_date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create indexes for better performance
    await database.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await database.query(`CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id)`);
    await database.query(`CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON transactions(portfolio_id)`);
    await database.query(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC)`);
    await database.query(`CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id)`);

    console.log('✅ Database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔐 Database connection closed');
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
