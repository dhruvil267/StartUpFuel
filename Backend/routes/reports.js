const express = require("express");
const { authenticateToken } = require("../middleware/auth");
// Uncomment when you set up AWS SDK

const AWS = require("aws-sdk");

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const router = express.Router();

// Static reports configuration - S3 file keys (not full URLs)
const STATIC_REPORTS = [
  {
    id: 1,
    name: "Financial Performance Report 2024",
    filename: "financial-performance-2024.pdf",
    s3_key: "reports/financial-performance-2024.pdf", // S3 object key
    type: "ANNUAL",
    description: "Comprehensive annual financial performance analysis",
    generated_date: "2024-12-31",
  },
  {
    id: 2,
    name: "Quarterly Investment Summary Q4 2024",
    filename: "investment-summary-q4-2024.pdf",
    s3_key: "reports/investment-summary-q4-2024.pdf",
    type: "QUARTERLY",
    description: "Q4 2024 investment portfolio summary and insights",
    generated_date: "2024-12-31",
  },
  {
    id: 3,
    name: "Monthly Portfolio Analysis December 2024",
    filename: "portfolio-analysis-dec-2024.pdf",
    s3_key: "reports/portfolio-analysis-dec-2024.pdf",
    type: "MONTHLY",
    description: "Detailed monthly portfolio performance breakdown",
    generated_date: "2024-12-31",
  },
];
// Generate pre-signed URLs for secure downloads
async function generatePreSignedUrl(s3Key) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Expires: 3600, // 1 hour expiry
    ResponseContentDisposition: "attachment", // Forces download
  };

  return s3.getSignedUrl("getObject", params);
}

// GET /api/reports - Get list of available report download links
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Generate pre-signed URLs for each report
    const formattedReports = await Promise.all(
      STATIC_REPORTS.map(async (report) => {
        const download_url = await generatePreSignedUrl(report.s3_key);

        return {
          ...report,
          download_url, // Secure, temporary URL
          formatted_date: new Date(report.generated_date).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          status: "ready",
          is_recent: true,
        };
      })
    );

    res.json({
      reports: formattedReports,
    });
  } catch (error) {
    console.error("Reports fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch reports",
      message: "An error occurred while fetching report data",
    });
  }
});

module.exports = router;
