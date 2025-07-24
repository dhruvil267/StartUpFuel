const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const database = require("../database/connection");

const router = express.Router();

// GET /api/portfolio - Get portfolio performance data
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get portfolio with assets
    const portfolioData = await database.query(
      `
      SELECT 
        p.id,
        p.name,
        p.total_value,
        p.cash_balance,
        p.created_at,
        p.updated_at,
        COUNT(pa.id) as total_assets,
        SUM(pa.shares * pa.current_price) as assets_value,
        SUM((pa.current_price - pa.purchase_price) * pa.shares) as total_gain_loss,
        ROUND(
          (SUM((pa.current_price - pa.purchase_price) * pa.shares) / 
           SUM(pa.purchase_price * pa.shares)) * 100, 2
        ) as total_return_percentage
      FROM portfolios p
      LEFT JOIN portfolio_assets pa ON p.id = pa.portfolio_id
      WHERE p.user_id = ?
      GROUP BY p.id
    `,
      [userId]
    );

    if (portfolioData.length === 0) {
      return res.status(404).json({
        error: "Portfolio not found",
        message: "No portfolio found for this user",
      });
    }

    const portfolio = portfolioData[0];

    // Get detailed asset information
    const assets = await database.query(
      `
      SELECT 
        symbol,
        shares,
        purchase_price,
        current_price,
        (current_price - purchase_price) as gain_loss_per_share,
        (shares * current_price) as current_value,
        (shares * purchase_price) as purchase_value,
        ROUND(((current_price - purchase_price) / purchase_price) * 100, 2) as return_percentage,
        purchase_date
      FROM portfolio_assets
      WHERE portfolio_id = ?
      ORDER BY current_value DESC
    `,
      [portfolio.id]
    );    // Calculate total invested value as the cost basis of current holdings
    // This represents the actual money currently invested in the market
    const totalInvestedValue = assets.reduce(
      (sum, asset) => sum + asset.purchase_value,
      0
    );
    const cashBalance = portfolio.cash_balance || 0; // Cash balance

    const dayChange = Math.random() * 2000 - 1000; // Mock daily change
    const dayChangePercentage = "0.00"; // Simplified for now    // Performance data for charts (mock data for MVP)
   
    const totalAssetsValueForAllocation = portfolio.assets_value || 1;
    const assetAllocation = assets.map((asset) => ({
      symbol: asset.symbol,
      value: asset.current_value,
      percentage: (
        (asset.current_value / totalAssetsValueForAllocation) *
        100
      ).toFixed(2),
    }));
    res.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        totalInvestedValue: totalInvestedValue, // Amount invested (purchase price basis)
        cashBalance: cashBalance, // Cash balance
        totalGainLoss: portfolio.total_gain_loss || 0,
        totalReturnPercentage: portfolio.total_return_percentage || 0,
        dayChange: parseFloat(dayChange.toFixed(2)),
        dayChangePercentage: parseFloat(dayChangePercentage),
        totalAssets: portfolio.total_assets || 0,
        createdAt: portfolio.created_at,
        updatedAt: portfolio.updated_at,
      },
      assetAllocation,
    });
  } catch (error) {
    console.error("Portfolio fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch portfolio",
      message: "An error occurred while fetching portfolio data",
    });
  }
});

// GET /api/portfolio/assets - Get detailed assets
router.get("/assets", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const assets = await database.query(
      `
      SELECT 
        pa.*,
        (pa.current_price - pa.purchase_price) * pa.shares as unrealized_gain_loss,
        ROUND(((pa.current_price - pa.purchase_price) / pa.purchase_price) * 100, 2) as return_percentage
      FROM portfolio_assets pa
      JOIN portfolios p ON pa.portfolio_id = p.id
      WHERE p.user_id = ?
      ORDER BY (pa.current_price * pa.shares) DESC
    `,
      [userId]
    );

    res.json({
      assets,
    });
  } catch (error) {
    console.error("Assets fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch assets",
      message: "An error occurred while fetching asset data",
    });
  }
});

// GET /api/portfolio/performance - Get performance metrics
router.get("/performance", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "1M" } = req.query; // 1W, 1M, 3M, 6M, 1Y, ALL

    // Get portfolio value
    const portfolio = await database.query(
      `
      SELECT 
        p.*,
        SUM(pa.shares * pa.current_price) as current_assets_value,
        SUM(pa.shares * pa.purchase_price) as purchase_assets_value
      FROM portfolios p
      LEFT JOIN portfolio_assets pa ON p.id = pa.portfolio_id
      WHERE p.user_id = ?
      GROUP BY p.id
    `,
      [userId]
    );

    if (portfolio.length === 0) {
      return res.status(404).json({
        error: "Portfolio not found",
      });
    }

    const currentPortfolio = portfolio[0];
    const totalInvestedValue =
      (currentPortfolio.purchase_assets_value || 0) +
      currentPortfolio.cash_balance;

    // Generate mock historical data based on period
    const getDaysFromPeriod = (period) => {
      switch (period) {
        case "1W":
          return 7;
        case "1M":
          return 30;
        case "3M":
          return 90;
        case "6M":
          return 180;
        case "1Y":
          return 365;
        case "ALL":
          return 365 * 2; // 2 years for demo
        default:
          return 30;
      }
    };

    const days = getDaysFromPeriod(period);
    const performanceData = [];
    const baseValue = totalInvestedValue;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate portfolio growth with some volatility
      const growthFactor = 1 + ((days - i) / days) * 0.15; // 15% growth over period
      const volatility = (Math.random() - 0.5) * 0.1; // ±5% daily volatility
      const value = Math.round(baseValue * growthFactor * (1 + volatility));

      performanceData.push({
        date: date.toISOString().split("T")[0],
        value: Math.max(value, 0), // Ensure no negative values
      });
    }

    res.json({
      period,
      performance: performanceData,
    });
  } catch (error) {
    console.error("Performance fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch performance data",
      message: "An error occurred while fetching performance metrics",
    });
  }
});

// POST /api/portfolio/assets - Buy or Sell asset in portfolio
router.post("/assets", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      symbol,
      shares,
      purchasePrice,
      currentPrice,
      type = "buy",
    } = req.body;

    // Supported stocks
    const supportedStocks = {
      GOOGL: { name: "Alphabet Inc" },
      AMZN: { name: "Amazon.com Inc" },
      TSLA: { name: "Tesla Inc" },
      MSFT: { name: "Microsoft Corp" },
      AAPL: { name: "Apple Inc" },
    };

    // Validation
    if (!symbol || !shares || !purchasePrice || !currentPrice || !type) {
      return res.status(400).json({
        error: "Missing required fields",
        message:
          "Symbol, shares, purchase price, current price, and type are required",
      });
    }

    if (!["buy", "sell"].includes(type.toLowerCase())) {
      return res.status(400).json({
        error: "Invalid transaction type",
        message: "Type must be either 'buy' or 'sell'",
      });
    }

    if (!supportedStocks[symbol.toUpperCase()]) {
      return res.status(400).json({
        error: "Unsupported stock",
        message: `Only these stocks are supported: ${Object.keys(
          supportedStocks
        ).join(", ")}`,
      });
    }

    if (shares <= 0 || purchasePrice <= 0 || currentPrice <= 0) {
      return res.status(400).json({
        error: "Invalid values",
        message:
          "Shares, purchase price, and current price must be positive numbers",
      });
    }
    const normalizedSymbol = symbol.toUpperCase();
    const transactionType = type.toLowerCase();
    const totalAmount = shares * purchasePrice; // Use purchase price for transaction amount
    const transactionDate = new Date().toISOString().split("T")[0];

    // Get user's portfolio with current cash balance
    const portfolioData = await database.query(
      `
      SELECT id, cash_balance FROM portfolios WHERE user_id = ? LIMIT 1
    `,
      [userId]
    );

    if (portfolioData.length === 0) {
      return res.status(404).json({
        error: "Portfolio not found",
        message: "No portfolio found for this user",
      });
    }

    const portfolioId = portfolioData[0].id;
    const currentCashBalance = portfolioData[0].cash_balance;

    // Check if user already owns this stock
    const existingAsset = await database.query(
      `
      SELECT * FROM portfolio_assets 
      WHERE portfolio_id = ? AND symbol = ?
    `,
      [portfolioId, normalizedSymbol]
    );

    if (transactionType === "buy") {
      // BUY LOGIC

      // Check if user has enough cash
      if (currentCashBalance < totalAmount) {
        return res.status(400).json({
          error: "Insufficient funds",
          message: `You need $${totalAmount.toFixed(
            2
          )} but only have $${currentCashBalance.toFixed(2)} available`,
          required: totalAmount,
          available: currentCashBalance,
        });
      }

      if (existingAsset.length > 0) {
        // Update existing asset - add to shares and recalculate average purchase price
        const existing = existingAsset[0];
        const newTotalShares = existing.shares + shares;
        const newAveragePurchasePrice =
          (existing.shares * existing.purchase_price + shares * purchasePrice) /
          newTotalShares;

        await database.query(
          `
          UPDATE portfolio_assets 
          SET 
            shares = ?,
            purchase_price = ?,
            current_price = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `,
          [newTotalShares, newAveragePurchasePrice, currentPrice, existing.id]
        );

        console.log(
          `Updated existing asset: ${normalizedSymbol}, New shares: ${newTotalShares}, Avg price: ${newAveragePurchasePrice}`
        );
      } else {
        // Add new asset to portfolio
        await database.query(
          `
          INSERT INTO portfolio_assets (
            portfolio_id, symbol, shares, purchase_price, 
            current_price, purchase_date, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `,
          [
            portfolioId,
            normalizedSymbol,
            shares,
            purchasePrice,
            currentPrice,
            transactionDate,
          ]
        );

        console.log(
          `Added new asset: ${normalizedSymbol}, Shares: ${shares}, Purchase price: ${purchasePrice}`
        );
      }

      // Deduct cash from portfolio balance
      const newCashBalance = currentCashBalance - totalAmount;
      await database.query(
        `
        UPDATE portfolios 
        SET 
          cash_balance = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `,
        [newCashBalance, portfolioId]
      );

      console.log(
        `Buy: Updated cash balance: $${currentCashBalance} -> $${newCashBalance} (deducted $${totalAmount})`
      );
    } else if (transactionType === "sell") {
      // SELL LOGIC

      if (existingAsset.length === 0) {
        return res.status(400).json({
          error: "Asset not found",
          message: `You don't own any shares of ${normalizedSymbol}`,
        });
      }

      const existing = existingAsset[0];

      // Check if user has enough shares to sell
      if (existing.shares < shares) {
        return res.status(400).json({
          error: "Insufficient shares",
          message: `You only have ${existing.shares} shares but trying to sell ${shares} shares`,
          available: existing.shares,
          requested: shares,
        });
      }

      const newTotalShares = existing.shares - shares;

      if (newTotalShares === 0) {
        // Remove asset completely if all shares are sold
        await database.query(
          `
          DELETE FROM portfolio_assets 
          WHERE id = ?
        `,
          [existing.id]
        );

        console.log(`Removed asset completely: ${normalizedSymbol}`);
      } else {
        // Update asset with reduced shares (keep same average purchase price)
        await database.query(
          `
          UPDATE portfolio_assets 
          SET 
            shares = ?,
            current_price = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `,
          [newTotalShares, currentPrice, existing.id]
        );

        console.log(
          `Updated existing asset: ${normalizedSymbol}, New shares: ${newTotalShares}`
        );
      }

      // Add cash to portfolio balance
      const newCashBalance = currentCashBalance + totalAmount;
      await database.query(
        `
        UPDATE portfolios 
        SET 
          cash_balance = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `,
        [newCashBalance, portfolioId]
      );

      console.log(
        `Sell: Updated cash balance: $${currentCashBalance} -> $${newCashBalance} (added $${totalAmount})`
      );
    }    // Record transaction
    await database.query(
      `
      INSERT INTO transactions (
        portfolio_id, symbol, transaction_type, shares, 
        price_per_share, total_amount, transaction_date, 
        notes, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        portfolioId,
        normalizedSymbol,
        transactionType.toUpperCase(),
        shares,
        purchasePrice, // Use purchase price for consistency with total_amount calculation
        totalAmount,
        transactionDate,
        `${transactionType === "buy" ? "Bought" : "Sold"} ${shares} shares of ${
          supportedStocks[normalizedSymbol].name
        }`,
      ]
    );

    // Update portfolio total value based on current holdings (invested amount)
    const updatedAssets = await database.query(
      `
      SELECT SUM(shares * purchase_price) as total_invested_value
      FROM portfolio_assets 
      WHERE portfolio_id = ?
    `,
      [portfolioId]
    );

    const totalInvestedValue = updatedAssets[0].total_invested_value || 0;    await database.query(
      `
      UPDATE portfolios 
      SET 
        total_value = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
      [totalInvestedValue, portfolioId]
    );res.status(201).json({
      success: true,
      message: "Asset added/removed successfully"
    });
  } catch (error) {
    console.error("Transaction error:", error);
    res.status(500).json({
      error: "Failed to process transaction",
      message: "An error occurred while processing the buy/sell transaction",
    });
  }
});

// GET /api/portfolio/allocations - Get asset allocation percentages
router.get("/allocations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get portfolio assets with current values
    const assets = await database.query(
      `
      SELECT 
        pa.symbol,
        pa.shares,
        pa.current_price,
        (pa.shares * pa.current_price) as current_value
      FROM portfolio_assets pa
      JOIN portfolios p ON pa.portfolio_id = p.id
      WHERE p.user_id = ?
      ORDER BY current_value DESC
    `,
      [userId]
    );

    if (assets.length === 0) {
      return res.json({
        allocations: [],
        totalValue: 0,
        message: "No assets found in portfolio",
      });
    }

    // Calculate total portfolio value (excluding cash)
    const totalValue = assets.reduce(
      (sum, asset) => sum + asset.current_value,
      0
    );

    // Calculate allocation percentages
    const allocations = assets.map((asset) => ({
      symbol: asset.symbol,
      shares: asset.shares,
      currentPrice: asset.current_price,
      currentValue: asset.current_value,
      percentage: ((asset.current_value / totalValue) * 100).toFixed(2),
    }));

    res.json({
      allocations,
    });
  } catch (error) {
    console.error("Allocations fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch allocations",
      message: "An error occurred while calculating asset allocations",
    });
  }
});

module.exports = router;
