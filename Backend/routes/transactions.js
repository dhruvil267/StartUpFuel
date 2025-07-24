const express = require('express');
const { TransactionModel } = require('../database/models');
const { authenticateToken } = require('../middleware/auth');
const database = require('../database/connection');

const router = express.Router();

// Single endpoint: GET /api/transactions - Get all transactions with summary stats
// Also handles POST /api/transactions - Create new transaction
router.route('/')
  .get(authenticateToken, async (req, res) => {    try {
      const userId = req.user.id;
      const { symbol = null, type = null, limit = null } = req.query;

      // Build SQL query for transactions
      let sql = `
        SELECT 
          t.*,
          p.name as portfolio_name
        FROM transactions t
        JOIN portfolios p ON t.portfolio_id = p.id
        WHERE p.user_id = ?
      `;
      
      const params = [userId];

      // Add symbol filter if provided
      if (symbol) {
        sql += ` AND t.symbol LIKE ?`;
        params.push(`%${symbol}%`);
      }

      // Add type filter if provided
      if (type) {
        sql += ` AND t.transaction_type = ?`;
        params.push(type.toUpperCase());
      }

      sql += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

      // Add limit if provided
      if (limit && !isNaN(parseInt(limit))) {
        sql += ` LIMIT ?`;
        params.push(parseInt(limit));
      }
      const transactions = await database.query(sql, params);      // Get current cash balance for amount calculation
      const portfolioInfo = await database.query(`
        SELECT cash_balance FROM portfolios WHERE user_id = ? LIMIT 1
      `, [userId]);
      
      const currentCashBalance = portfolioInfo.length > 0 ? portfolioInfo[0].cash_balance : 0;

      // Format transactions for display
      const formattedTransactions = transactions.map(transaction => {
        const isNegative = transaction.transaction_type === 'BUY';
        const formattedAmount = isNegative 
          ? `-$${transaction.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `+$${transaction.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Calculate amount as cash balance +/- transaction amount
        const transactionImpact = isNegative ? -transaction.total_amount : transaction.total_amount;
        const amount = currentCashBalance + transactionImpact;

        return {
          id: transaction.id,
          date: transaction.transaction_date,
          formatted_date: new Date(transaction.transaction_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          type: transaction.transaction_type,
          type_display: transaction.transaction_type === 'BUY' ? 'B' : 'S',
          symbol: transaction.symbol,
          quantity: transaction.shares,
          price: transaction.price_per_share,
          formatted_price: `$${transaction.price_per_share.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          amount: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          formatted_amount: formattedAmount,
          status: 'Completed',
          portfolio_name: transaction.portfolio_name
        };
      });      // Calculate summary statistics
      const totalTransactions = transactions.length;
      
      // Calculate net investment: BUY orders add to investment, SELL orders reduce it
      const totalBuyAmount = transactions
        .filter(t => t.transaction_type === 'BUY')
        .reduce((sum, t) => sum + t.total_amount, 0);
      
      const totalSellAmount = transactions
        .filter(t => t.transaction_type === 'SELL')
        .reduce((sum, t) => sum + t.total_amount, 0);
      
      const totalInvestment = totalBuyAmount - totalSellAmount; // Net investment

      const buyOrders = transactions.filter(t => t.transaction_type === 'BUY').length;
      const sellOrders = transactions.filter(t => t.transaction_type === 'SELL').length;

      const summary = {
        totalTransactions,
        netInvestment: `$${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        buyOrders,
        sellOrders
      };

      res.json({
        success: true,
        summary,        transactions: formattedTransactions,
        filters: {
          symbol,
          type,
          limit
        }
      });

    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transactions',
        message: 'An error occurred while fetching transaction data'
      });
    }
  })
  .post(authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        symbol,
        transaction_type,
        shares,
        price_per_share,
        transaction_date,
        notes
      } = req.body;

      // Basic validation
      if (!symbol || !transaction_type || !shares || !price_per_share) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Symbol, transaction type, shares, and price per share are required'
        });
      }

      // Validate transaction type
      const validTypes = ['BUY', 'SELL'];
      if (!validTypes.includes(transaction_type.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid transaction type',
          message: 'Transaction type must be BUY or SELL'
        });
      }

      // Get user's portfolio
      const portfolio = await database.query(`
        SELECT id FROM portfolios WHERE user_id = ? LIMIT 1
      `, [userId]);

      if (portfolio.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found',
          message: 'No portfolio found for this user'
        });
      }

      const portfolioId = portfolio[0].id;
      const totalAmount = shares * price_per_share;
      const transactionData = {
        portfolio_id: portfolioId,
        symbol: symbol.toUpperCase(),
        transaction_type: transaction_type.toUpperCase(),
        shares: parseFloat(shares),
        price_per_share: parseFloat(price_per_share),
        total_amount: totalAmount,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        notes
      };

      const result = await TransactionModel.create(transactionData);

      // Get the created transaction with portfolio info
      const createdTransaction = await database.query(`
        SELECT 
          t.*,
          p.name as portfolio_name
        FROM transactions t
        JOIN portfolios p ON t.portfolio_id = p.id
        WHERE t.id = ?
      `, [result.id]);      const transaction = createdTransaction[0];
      const isNegative = transaction.transaction_type === 'BUY';
      const formattedAmount = isNegative 
        ? `-$${transaction.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `+$${transaction.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // Get current cash balance for amount calculation
      const portfolioInfo = await database.query(`
        SELECT cash_balance FROM portfolios WHERE user_id = ? LIMIT 1
      `, [userId]);
      
      const currentCashBalance = portfolioInfo.length > 0 ? portfolioInfo[0].cash_balance : 0;
      
      // Calculate amount as cash balance +/- transaction amount
      const transactionImpact = isNegative ? -transaction.total_amount : transaction.total_amount;
      const amount = currentCashBalance + transactionImpact;

      const formattedTransaction = {
        id: transaction.id,
        date: transaction.transaction_date,
        formatted_date: new Date(transaction.transaction_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        type: transaction.transaction_type,
        type_display: transaction.transaction_type === 'BUY' ? 'B' : 'S',
        symbol: transaction.symbol,
        quantity: transaction.shares,
        price: transaction.price_per_share,
        formatted_price: `$${transaction.price_per_share.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        amount: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        formatted_amount: formattedAmount,
        status: 'Completed',
        portfolio_name: transaction.portfolio_name
      };

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        transaction: formattedTransaction
      });

    } catch (error) {
      console.error('Transaction creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create transaction',
        message: 'An error occurred while creating the transaction'
      });
    }
  });

module.exports = router;
