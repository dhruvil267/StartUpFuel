require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Import routes
const authRoutes = require("./routes/auth");
const portfolioRoutes = require("./routes/portfolio");
const transactionsRoutes = require("./routes/transactions");
const reportsRoutes = require("./routes/reports");
const database = require("./database/connection");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? [
        "http://startupfuel-frontend.s3-website.ca-central-1.amazonaws.com",
        "http://ec2-35-182-23-242.ca-central-1.compute.amazonaws.com"
      ]
    : ["http://localhost:5173", "http://localhost:3000", "http://localhost:80"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "StartupFuel Backend API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/reports", reportsRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

app.listen(PORT, async () => {
  try {
    await database.connect();
    console.log(`🚀 StartupFuel Backend API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️ Database: ${process.env.DB_PATH}`);
    console.log(`\n🔗 API Endpoints:`);
    console.log(`   Auth: http://localhost:${PORT}/api/auth/*`);
    console.log(`   Portfolio: http://localhost:${PORT}/api/portfolio`);
    console.log(`   Transactions: http://localhost:${PORT}/api/transactions`);
    console.log(`   Reports: http://localhost:${PORT}/api/reports`);
    console.log(`\n👤 Demo Credentials:`);
    console.log(`   Email: demo@startupfuel.com`);
    console.log(`   Password: demo123`);
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
});

module.exports = app;
