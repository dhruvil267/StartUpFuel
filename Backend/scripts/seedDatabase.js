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
        
        // Clear existing data for fresh seeding
        await database.query('DELETE FROM portfolio_assets WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ?)', [userId]);
        await database.query('DELETE FROM transactions WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ?)', [userId]);
        await database.query('DELETE FROM reports WHERE user_id = ?', [userId]);
        console.log('🗑️ Cleared existing data for fresh seeding');
      } else {
        throw error;
      }
    }

    // Create portfolio with initial cash balance
    let portfolioId;
    const initialCashBalance = 100000.00; // $100,000 starting cash
    
    try {
      const portfolio = await PortfolioModel.create(userId, {
        name: 'Primary Investment Portfolio',
        total_value: 0, // Will be calculated based on actual investments
        cash_balance: initialCashBalance
      });
      portfolioId = portfolio.id;
      console.log('💼 Portfolio created with ID:', portfolioId);
    } catch (error) {
      // Get existing portfolio and reset it
      const existingPortfolios = await PortfolioModel.getByUserId(userId);
      if (existingPortfolios.length > 0) {
        portfolioId = existingPortfolios[0].id;
        // Reset portfolio cash balance
        await database.query(`
          UPDATE portfolios 
          SET cash_balance = ?, total_value = 0, updated_at = datetime('now')
          WHERE id = ?
        `, [initialCashBalance, portfolioId]);
        console.log('💼 Reset existing portfolio with ID:', portfolioId);
      } else {
        throw error;
      }
    }    // Define transactions that will create our portfolio assets
    // Total investment budget: ~$80,000 (keeping $20,000+ in cash)
    const transactions = [
      // Initial investments
      {
        symbol: 'AAPL',
        transaction_type: 'BUY',
        shares: 50, // $7,512.50
        price_per_share: 150.25,
        transaction_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Initial Apple investment'
      },
      {
        symbol: 'GOOGL',
        transaction_type: 'BUY',
        shares: 5, // $14,000
        price_per_share: 2800.00,
        transaction_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Google stock purchase'
      },
      {
        symbol: 'TSLA',
        transaction_type: 'BUY',
        shares: 20, // $16,010
        price_per_share: 800.50,
        transaction_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Tesla investment'
      },
      {
        symbol: 'MSFT',
        transaction_type: 'BUY',
        shares: 40, // $12,000
        price_per_share: 300.00,
        transaction_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Microsoft shares'
      },
      {
        symbol: 'AMZN',
        transaction_type: 'BUY',
        shares: 8, // $25,600
        price_per_share: 3200.00,
        transaction_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Amazon investment'
      },
      // Recent transactions
      {
        symbol: 'AAPL',
        transaction_type: 'BUY',
        shares: 10, // $1,753
        price_per_share: 175.30,
        transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Additional Apple shares'
      },
      {
        symbol: 'GOOGL',
        transaction_type: 'SELL',
        shares: 1, // +$2,950.75
        price_per_share: 2950.75,
        transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Profit taking on Google'
      },
      {
        symbol: 'MSFT',
        transaction_type: 'BUY',
        shares: 5, // $1,677.50
        price_per_share: 335.50,
        transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Dollar cost averaging Microsoft'
      },
      {
        symbol: 'TSLA',
        transaction_type: 'SELL',
        shares: 3, // +$2,250.75
        price_per_share: 750.25,
        transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Risk management - partial Tesla sale'
      },
    ];

    // Track portfolio state for realistic simulation
    let currentCashBalance = initialCashBalance;
    const portfolioAssets = new Map(); // symbol -> {shares, avgPrice}

    // Process transactions in chronological order and update portfolio state
    for (const transaction of transactions) {
      const totalAmount = transaction.shares * transaction.price_per_share;
      
      try {
        // Create transaction record
        await TransactionModel.create({
          portfolio_id: portfolioId,
          ...transaction,
          total_amount: totalAmount
        });

        // Update portfolio state
        if (transaction.transaction_type === 'BUY') {
          currentCashBalance -= totalAmount;
          
          if (portfolioAssets.has(transaction.symbol)) {
            const existing = portfolioAssets.get(transaction.symbol);
            const newTotalShares = existing.shares + transaction.shares;
            const newAvgPrice = (existing.shares * existing.avgPrice + transaction.shares * transaction.price_per_share) / newTotalShares;
            portfolioAssets.set(transaction.symbol, { shares: newTotalShares, avgPrice: newAvgPrice });
          } else {
            portfolioAssets.set(transaction.symbol, { shares: transaction.shares, avgPrice: transaction.price_per_share });
          }
        } else if (transaction.transaction_type === 'SELL') {
          currentCashBalance += totalAmount;
          
          if (portfolioAssets.has(transaction.symbol)) {
            const existing = portfolioAssets.get(transaction.symbol);
            const newShares = existing.shares - transaction.shares;
            if (newShares > 0) {
              portfolioAssets.set(transaction.symbol, { shares: newShares, avgPrice: existing.avgPrice });
            } else {
              portfolioAssets.delete(transaction.symbol);
            }
          }
        } else if (transaction.transaction_type === 'DIVIDEND') {
          currentCashBalance += totalAmount;
        }
        
      } catch (error) {
        console.log(`Error processing transaction for ${transaction.symbol}, skipping...`);
      }
    }
    console.log('💸 Sample transactions processed');

    // Create portfolio assets based on final state with current market prices
    const currentPrices = {
      'AAPL': 175.30,
      'GOOGL': 2950.75,
      'TSLA': 750.25,
      'MSFT': 335.50,
      'AMZN': 3100.25
    };

    for (const [symbol, asset] of portfolioAssets) {
      try {
        await database.insert(`
          INSERT INTO portfolio_assets 
          (portfolio_id, symbol, shares, purchase_price, current_price, purchase_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          portfolioId, 
          symbol, 
          asset.shares, 
          asset.avgPrice, 
          currentPrices[symbol] || asset.avgPrice,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days ago
        ]);
      } catch (error) {
        console.log(`Asset ${symbol} might already exist, skipping...`);
      }
    }
    console.log('📈 Portfolio assets created');

    // Calculate total invested value (cost basis)
    let totalInvestedValue = 0;
    for (const [symbol, asset] of portfolioAssets) {
      totalInvestedValue += asset.shares * asset.avgPrice;
    }

    // Update portfolio with final values
    await database.query(`
      UPDATE portfolios 
      SET 
        total_value = ?,
        cash_balance = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [totalInvestedValue, currentCashBalance, portfolioId]);

    console.log(`💰 Portfolio updated - Invested: $${totalInvestedValue.toFixed(2)}, Cash: $${currentCashBalance.toFixed(2)}`);

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
    console.log('\n📊 Portfolio Summary:');
    console.log(`   Total Invested: $${totalInvestedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`   Cash Balance: $${currentCashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`   Total Portfolio: $${(totalInvestedValue + currentCashBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log('\n🔐 Demo login credentials:');
    console.log('   Email: demo@startupfuel.com');
    console.log('   Password: demo123');
    
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