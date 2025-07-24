require('dotenv').config();
const bcrypt = require('bcryptjs');
const database = require('../database/connection');
const { UserModel, PortfolioModel, TransactionModel, ReportModel } = require('../database/models');

async function seedDatabase() {
  try {
    await database.connect();
    
    console.log('🌱 Seeding database with sample data...');
    
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    let userId;
    
    try {
      const user = await UserModel.create({
        email: 'demo@startupfuel.com',
        password_hash: hashedPassword,
        first_name: 'Demo',
        last_name: 'Investor',
        role: 'investor'
      });
      userId = user.id;
      console.log('👤 Demo user created with ID:', userId);
    } catch (error) {
      // User might already exist, get the existing user
      const existingUser = await UserModel.findByEmail('demo@startupfuel.com');
      if (existingUser) {
        userId = existingUser.id;
        console.log('👤 Using existing demo user with ID:', userId);
      } else {
        throw error;
      }
    }

    // Create portfolio
    let portfolioId;
    try {      const portfolio = await PortfolioModel.create(userId, {
        name: 'Primary Investment Portfolio',
        total_value: 125000.50,
        cash_balance: 100000.00
      });
      portfolioId = portfolio.id;
      console.log('💼 Portfolio created with ID:', portfolioId);
    } catch (error) {
      // Get existing portfolio
      const existingPortfolios = await PortfolioModel.getByUserId(userId);
      if (existingPortfolios.length > 0) {
        portfolioId = existingPortfolios[0].id;
        console.log('💼 Using existing portfolio with ID:', portfolioId);
      } else {
        throw error;
      }
    }

    // Add portfolio assets
    const assets = [
      { symbol: 'AAPL', shares: 50, purchase_price: 150.25, current_price: 175.30 },
      { symbol: 'GOOGL', shares: 25, purchase_price: 2800.00, current_price: 2950.75 },
      { symbol: 'TSLA', shares: 30, purchase_price: 800.50, current_price: 750.25 },
      { symbol: 'MSFT', shares: 40, purchase_price: 300.00, current_price: 335.50 },
      { symbol: 'AMZN', shares: 15, purchase_price: 3200.00, current_price: 3100.25 }
    ];

    for (const asset of assets) {
      try {
        await database.insert(`
          INSERT OR IGNORE INTO portfolio_assets 
          (portfolio_id, symbol, shares, purchase_price, current_price, purchase_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, date('now', '-' || (ABS(RANDOM()) % 365) || ' days'), datetime('now'), datetime('now'))
        `, [portfolioId, asset.symbol, asset.shares, asset.purchase_price, asset.current_price]);
      } catch (error) {
        console.log(`Asset ${asset.symbol} might already exist, skipping...`);
      }
    }
    console.log('📈 Portfolio assets added');

    // Add sample transactions
    const transactions = [
      {
        symbol: 'AAPL',
        transaction_type: 'BUY',
        shares: 25,
        price_per_share: 175.30,
        transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Quarterly investment'
      },
      {
        symbol: 'GOOGL',
        transaction_type: 'SELL',
        shares: 5,
        price_per_share: 2950.75,
        transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Profit taking'
      },
      {
        symbol: 'MSFT',
        transaction_type: 'BUY',
        shares: 10,
        price_per_share: 335.50,
        transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Dollar cost averaging'
      },
      {
        symbol: 'TSLA',
        transaction_type: 'SELL',
        shares: 10,
        price_per_share: 750.25,
        transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Risk management'
      },
      {
        symbol: 'AMZN',
        transaction_type: 'DIVIDEND',
        shares: 15,
        price_per_share: 2.50,
        transaction_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Quarterly dividend payment'
      }
    ];

    for (const transaction of transactions) {
      const totalAmount = transaction.shares * transaction.price_per_share;
      try {
        await TransactionModel.create({
          portfolio_id: portfolioId,
          ...transaction,
          total_amount: totalAmount
        });
      } catch (error) {
        console.log(`Transaction might already exist, skipping...`);
      }
    }
    console.log('💸 Sample transactions added');

    // Add sample reports
    const reports = [
      {
        title: 'Q4 2024 Performance Report',
        file_url: '/reports/q4-2024-performance.pdf',
        report_type: 'QUARTERLY',
        generated_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'Annual Investment Summary 2024',
        file_url: '/reports/annual-2024-summary.pdf',
        report_type: 'ANNUAL',
        generated_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'Monthly Report - December 2024',
        file_url: '/reports/monthly-dec-2024.pdf',
        report_type: 'MONTHLY',
        generated_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    for (const report of reports) {
      try {
        await ReportModel.create({
          user_id: userId,
          ...report
        });
      } catch (error) {
        console.log(`Report might already exist, skipping...`);
      }
    }
    console.log('📄 Sample reports added');

    console.log('✅ Database seeded successfully!');
    console.log('\n🔐 Demo login credentials:');
    console.log('Email: demo@startupfuel.com');
    console.log('Password: demo123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔐 Database connection closed');
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
