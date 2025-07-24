const database = require('./connection');

class UserModel {
  // Create user
  static async create(userData) {
    const { email, password_hash, first_name, last_name, role = 'investor' } = userData;
    
    const sql = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    return await database.insert(sql, [email, password_hash, first_name, last_name, role]);
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    return await database.get(sql, [email]);
  }

  // Find user by ID
  static async findById(id) {
    const sql = `SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?`;
    return await database.get(sql, [id]);
  }

  // Update user
  static async update(id, userData) {
    const { first_name, last_name, email } = userData;
    const sql = `
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    return await database.insert(sql, [first_name, last_name, email, id]);
  }
}

class PortfolioModel {
  // Get portfolio for user
  static async getByUserId(userId) {
    const sql = `
      SELECT p.*, pa.symbol, pa.shares, pa.purchase_price, pa.purchase_date
      FROM portfolios p
      LEFT JOIN portfolio_assets pa ON p.id = pa.portfolio_id
      WHERE p.user_id = ?
    `;
    return await database.query(sql, [userId]);
  }
  // Create portfolio
  static async create(userId, portfolioData) {
    const { 
      name, 
      total_value = 0, 
      cash_balance = 100000.00  // Default to 100k if not specified
    } = portfolioData;
    
    const sql = `
      INSERT INTO portfolios (user_id, name, total_value, cash_balance, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    return await database.insert(sql, [userId, name, total_value, cash_balance]);
  }

  // Update portfolio value
  static async updateValue(portfolioId, totalValue) {
    const sql = `
      UPDATE portfolios 
      SET total_value = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    return await database.insert(sql, [totalValue, portfolioId]);
  }
}

class TransactionModel {
  // Get recent transactions
  static async getRecent(userId, limit = 10) {
    const sql = `
      SELECT t.*, p.name as portfolio_name
      FROM transactions t
      JOIN portfolios p ON t.portfolio_id = p.id
      WHERE p.user_id = ?
      ORDER BY t.transaction_date DESC
      LIMIT ?
    `;
    return await database.query(sql, [userId, limit]);
  }

  // Create transaction
  static async create(transactionData) {
    const { 
      portfolio_id, 
      symbol, 
      transaction_type, 
      shares, 
      price_per_share, 
      total_amount, 
      transaction_date,
      notes = null 
    } = transactionData;

    const sql = `
      INSERT INTO transactions (
        portfolio_id, symbol, transaction_type, shares, 
        price_per_share, total_amount, transaction_date, notes, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    
    return await database.insert(sql, [
      portfolio_id, symbol, transaction_type, shares, 
      price_per_share, total_amount, transaction_date, notes
    ]);
  }
}

class ReportModel {
  // Get reports for user
  static async getByUserId(userId, limit = 20) {
    const sql = `
      SELECT * FROM reports 
      WHERE user_id = ? 
      ORDER BY generated_date DESC 
      LIMIT ?
    `;
    return await database.query(sql, [userId, limit]);
  }

  // Create report
  static async create(reportData) {
    const { user_id, title, file_url, report_type, generated_date } = reportData;
    
    const sql = `
      INSERT INTO reports (user_id, title, file_url, report_type, generated_date, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    
    return await database.insert(sql, [user_id, title, file_url, report_type, generated_date]);
  }
}

module.exports = {
  UserModel,
  PortfolioModel,
  TransactionModel,
  ReportModel
};
