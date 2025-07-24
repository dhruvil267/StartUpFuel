import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { portfolioAPI, transactionsAPI, reportsAPI } from "../../services/api";
import { formatCurrency, formatPercentage } from "../../utils/helpers";
import { useApi } from "../../hooks/useCommon";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const { user } = useAuthContext();
  const [selectedPeriod, setSelectedPeriod] = useState("1M");

  // API calls
  const {
    data: portfolioData,
    loading: portfolioLoading,
    error: portfolioError,
  } = useApi(() => portfolioAPI.getPortfolio(), []);

  const { data: transactionsData, loading: transactionsLoading } = useApi(
    () => transactionsAPI.getTransactions(5),
    []
  );

  const { data: reportsData, loading: reportsLoading } = useApi(
    () => reportsAPI.getReports(),
    []
  );

  const { data: performanceData, loading: performanceLoading } = useApi(
    () => portfolioAPI.getPerformance(selectedPeriod),
    [selectedPeriod]
  );

  if (portfolioLoading) {
    return <DashboardSkeleton />;
  }

  if (portfolioError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h2>Error loading dashboard</h2>
          <p>{portfolioError}</p>
        </div>
      </div>
    );
  }

  const portfolio = portfolioData?.portfolio;
  const assetAllocation = portfolioData?.assetAllocation || [];
  const transactions = transactionsData?.transactions || [];
  const reports = reportsData?.reports || [];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h1>Dashboard</h1>
              <p>Welcome back, {user?.firstName}!</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Portfolio Overview Cards */}
        <div className={styles.summaryGrid}>
          <PortfolioCard
            title="Total Portfolio Value"
            value={formatCurrency(portfolio?.totalInvestedValue || 0)}
            change={portfolio?.totalReturnPercentage || 0}
            icon={DollarSign}
          />
          <PortfolioCard
            title="Day's Change"
            value={formatCurrency(portfolio?.dayChange || 0)}
            change={portfolio?.dayChangePercentage || 0}
            icon={portfolio?.dayChange >= 0 ? TrendingUp : TrendingDown}
          />
          <PortfolioCard
            title="Total Assets"
            value={portfolio?.totalAssets || 0}
            icon={PieChart}
          />
          <PortfolioCard
            title="Cash Balance"
            value={formatCurrency(portfolio?.cashBalance || 0)}
            icon={Activity}
          />
        </div>

        {/* Charts */}
        <div className={styles.chartsGrid}>
          {/* Performance Chart */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Portfolio Performance</h3>
              <div className={styles.periodButtons}>
                {["1W", "1M", "3M", "6M", "1Y"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`${styles.periodButton} ${
                      selectedPeriod === period
                        ? styles.periodButtonActive
                        : styles.periodButtonInactive
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.chartContainer}>
              {performanceLoading ? (
                <div className={styles.spinner}>
                  <div className={styles.spinnerIcon}></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData?.performance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        "Portfolio Value",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Asset Allocation */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Asset Allocation</h3>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  {" "}
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      formatCurrency(value),
                      props.payload.symbol || "Unknown Asset",
                    ]}
                    labelFormatter={(label, payload) =>
                      payload && payload[0]
                        ? payload[0].payload.symbol
                        : "Asset"
                    }
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.allocationList}>
              {assetAllocation.slice(0, 5).map((asset, index) => (
                <div key={asset.symbol} className={styles.allocationItem}>
                  <div className={styles.allocationLeft}>
                    <div
                      className={styles.allocationColor}
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className={styles.allocationSymbol}>
                      {asset.symbol}
                    </span>
                  </div>
                  <div className={styles.allocationRight}>
                    <span className={styles.allocationPercentage}>
                      {formatCurrency(asset.value)}
                    </span>
                    <span className={styles.allocationValue}>
                      {asset.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions and Reports */}
        <div className={styles.chartsGrid}>
          {/* Recent Transactions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Transactions</h3>
              <a href="/transactions" className={styles.cardLink}>
                View all
              </a>
            </div>
            {transactionsLoading ? (
              <div className={styles.spinner}>
                <div className={styles.spinnerIcon}></div>
              </div>
            ) : (
              <div className={styles.transactionsList}>
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className={styles.transactionItem}>
                    <div className={styles.transactionLeft}>
                      <div
                        className={`${styles.transactionIcon} ${
                          transaction.type === "buy"
                            ? styles.transactionIconBuy
                            : transaction.type === "sell"
                            ? styles.transactionIconSell
                            : styles.transactionIconDividend
                        }`}
                      >
                        <span
                          className={`${styles.transactionIconText} ${
                            transaction.type === "buy"
                              ? styles.transactionIconTextBuy
                              : transaction.type === "sell"
                              ? styles.transactionIconTextSell
                              : styles.transactionIconTextDividend
                          }`}
                        >
                          {transaction?.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.transactionDetails}>
                        <p className={styles.transactionSymbol}>
                          {transaction.symbol}
                        </p>
                        <p className={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`${styles.transactionAmount} ${
                        transaction.type === "buy"
                          ? styles.transactionAmountNegative
                          : styles.transactionAmountPositive
                      }`}
                    >
                      {transaction.formatted_amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reports */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Reports</h3>
              <a href="/reports" className={styles.cardLink}>
                View all
              </a>
            </div>
            {reportsLoading ? (
              <div className={styles.spinner}>
                <div className={styles.spinnerIcon}></div>
              </div>
            ) : (              <div className={styles.reportsList}>
                {reports.map((report) => (
                  <ReportItemDashboard key={report.id} report={report} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Report Item Component for Dashboard
const ReportItemDashboard = ({ report }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!report.download_url || report.status !== "ready") {
      return;
    }

    setDownloading(true);
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = report.download_url;
      link.download = report.filename || `${report.name}.pdf`;
      link.target = "_blank";

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleView = () => {
    if (!report.download_url || report.status !== "ready") {
      return;
    }

    // Open PDF in new tab for viewing
    window.open(report.download_url, "_blank");
  };

  return (
    <div className={styles.reportItem}>
      <div className={styles.reportLeft}>
        <FileText className={styles.reportIcon} />
        <div className={styles.reportDetails}>
          <p className={styles.reportTitle}>{report.name}</p>
          <p className={styles.reportDate}>
            Generated on{" "}
            {new Date(report.generated_date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className={styles.reportActions}>
        <button 
          className={styles.reportActionButton}
          disabled={report.status !== "ready"}
          title="View Report"
          onClick={handleView}
        >
        </button>
        <button 
          className={styles.reportActionButton}
          disabled={report.status !== "ready" || downloading}
          title={downloading ? "Downloading..." : "Download Report"}
          onClick={handleDownload}
        >
          {downloading ? (
            <div className={styles.spinner}></div>
          ) : (
            <Download className={styles.reportActionIcon} />
          )}
        </button>
      </div>
    </div>
  );
};

// Portfolio Card Component
const PortfolioCard = ({ title, value, change, icon: Icon }) => {
  const hasChange = change !== undefined;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={styles.card}>
      <div className={styles.portfolioCardContent}>
        <div className={styles.portfolioCardIcon}>
          <div className={styles.portfolioCardIconContainer}>
            <Icon className={styles.portfolioCardIconSvg} />
          </div>
        </div>
        <div className={styles.portfolioCardDetails}>
          <p className={styles.portfolioCardLabel}>{title}</p>
          <div className={styles.portfolioCardValue}>
            <p className={styles.portfolioCardMainValue}>{value}</p>
            {hasChange && (
              <span
                className={`${styles.portfolioCardChange} ${
                  isPositive
                    ? styles.portfolioCardChangePositive
                    : isNegative
                    ? styles.portfolioCardChangeNegative
                    : styles.portfolioCardChangeNeutral
                }`}
              >
                {isPositive && "+"}
                {formatPercentage(change)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Skeleton Component
const DashboardSkeleton = () => {
  return (
    <div className={styles.container}>
      {/* Header Skeleton */}
      <div className={styles.headerSection}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <div className={styles.skeletonTitle}></div>
              <div className={styles.skeletonSubtitle}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Portfolio Cards Skeleton */}
        <div className={styles.summaryGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.portfolioCardContent}>
                <div className={styles.portfolioCardIcon}>
                  <div className={styles.skeletonIconContainer}></div>
                </div>
                <div className={styles.portfolioCardDetails}>
                  <div className={styles.skeletonCardLabel}></div>
                  <div className={styles.portfolioCardValue}>
                    <div className={styles.skeletonMainValue}></div>
                    <div className={styles.skeletonChange}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className={styles.chartsGrid}>
          {/* Performance Chart Skeleton */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.skeletonChartTitle}></div>
              <div className={styles.periodButtons}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={styles.skeletonPeriodButton}></div>
                ))}
              </div>
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.skeletonChart}></div>
            </div>
          </div>

          {/* Asset Allocation Skeleton */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.skeletonChartTitle}></div>
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.skeletonPieChart}>
                <div className={styles.skeletonPieCenter}></div>
              </div>
            </div>
            <div className={styles.allocationList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.allocationItem}>
                  <div className={styles.allocationLeft}>
                    <div className={styles.skeletonAllocationColor}></div>
                    <div className={styles.skeletonAllocationSymbol}></div>
                  </div>
                  <div className={styles.allocationRight}>
                    <div className={styles.skeletonAllocationValue}></div>
                    <div className={styles.skeletonAllocationPercentage}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions and Reports Skeleton */}
        <div className={styles.chartsGrid}>
          {/* Recent Transactions Skeleton */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.skeletonChartTitle}></div>
              <div className={styles.skeletonViewAll}></div>
            </div>
            <div className={styles.transactionsList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.transactionItem}>
                  <div className={styles.transactionLeft}>
                    <div className={styles.skeletonTransactionIcon}></div>
                    <div className={styles.transactionDetails}>
                      <div className={styles.skeletonTransactionSymbol}></div>
                      <div className={styles.skeletonTransactionDate}></div>
                    </div>
                  </div>
                  <div className={styles.skeletonTransactionAmount}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports Skeleton */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.skeletonChartTitle}></div>
              <div className={styles.skeletonViewAll}></div>
            </div>
            <div className={styles.reportsList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.reportItem}>
                  <div className={styles.reportLeft}>
                    <div className={styles.skeletonReportIcon}></div>
                    <div className={styles.reportDetails}>
                      <div className={styles.skeletonReportTitle}></div>
                      <div className={styles.skeletonReportDate}></div>
                    </div>
                  </div>
                  <div className={styles.reportActions}>
                    <div className={styles.skeletonReportAction}></div>
                    <div className={styles.skeletonReportAction}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
