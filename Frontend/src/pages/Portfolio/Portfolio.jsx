import { useState } from "react";
import { portfolioAPI } from "../../services/api";
import { useApi } from "../../hooks/useCommon";
import {
  formatCurrency,
  formatPercentage,
  getValueColor,
} from "../../utils/helpers";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import AddAssetModal from "../../components/AddAssetModal/AddAssetModal";
import styles from "./Portfolio.module.css";

const Portfolio = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("1M");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // API calls
  const {
    data: portfolioData,
    loading: portfolioLoading,
    error: portfolioError,
  } = useApi(() => portfolioAPI.getPortfolio(), [refreshKey]);

  const { data: assetsData, loading: assetsLoading } = useApi(
    () => portfolioAPI.getAssets(),
    [refreshKey]
  );

  const { data: performanceData, loading: performanceLoading } = useApi(
    () => portfolioAPI.getPerformance(selectedPeriod),
    [selectedPeriod]
  );

  if (portfolioLoading) {
    return <PortfolioSkeleton />;
  }

  if (portfolioError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h2 className={styles.errorTitle}>Error loading portfolio</h2>
          <p className={styles.errorMessage}>{portfolioError}</p>
        </div>
      </div>
    );
  }

  const portfolio = portfolioData?.portfolio;
  const assets = assetsData?.assets || [];
  const assetAllocation = portfolioData?.assetAllocation || [];

  // Handle asset addition
  const handleAssetAdded = () => {
    setRefreshKey((prev) => prev + 1);
    setIsAddAssetModalOpen(false);
  };

  // Filter and sort assets
  const filteredAssets = assets
    .filter((asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1>Portfolio Overview</h1>
            <p>Track your investments and performance</p>
          </div>{" "}
          <div className={styles.headerActions}>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => setIsAddAssetModalOpen(true)}
            >
              Buy Or Sell Asset
            </button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className={styles.summaryGrid}>
          <SummaryCard
            title="Total Invested Value"
            value={formatCurrency(portfolio?.totalInvestedValue || 0)}
            change={portfolio?.totalReturnPercentage || 0}
            icon={DollarSign}
          />
          <SummaryCard
            title="Day's Change"
            value={formatCurrency(portfolio?.dayChange || 0)}
            change={portfolio?.dayChangePercentage || 0}
            icon={portfolio?.dayChange >= 0 ? TrendingUp : TrendingDown}
          />
          <SummaryCard
            title="Total Assets"
            value={portfolio?.totalAssets || 0}
            icon={PieChart}
          />
          <SummaryCard
            title="Cash Balance"
            value={formatCurrency(portfolio?.cashBalance || 0)}
            icon={Activity}
          />
        </div>

        <div className={styles.chartsGrid}>
          {/* Performance Chart */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Performance</h3>
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
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
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

          {/* Asset Allocation */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Asset Allocation</h3>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
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
                      props.payload.symbol || 'Unknown Asset'
                    ]}
                    labelFormatter={(label, payload) => 
                      payload && payload[0] ? payload[0].payload.symbol : 'Asset'
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
                  <span className={styles.allocationPercentage}>
                    {asset.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Holdings</h3>
            <div className={styles.tableActions}>
              {/* Search */}
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>
          </div>

          {assetsLoading ? (
            <div className={styles.loadingContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.loadingRow}>
                  <div className={styles.loadingLeft}>
                    <div className={styles.loadingAvatar}></div>
                    <div>
                      <div className={styles.loadingTextLarge}></div>
                      <div className={styles.loadingTextSmall}></div>
                    </div>
                  </div>
                  <div className={styles.loadingTextMedium}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                {" "}
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeader}>Asset</th>
                    <th className={styles.tableHeader}>Price</th>
                    <th className={styles.tableHeader}>Shares</th>
                    <th className={styles.tableHeader}>Return</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.symbol} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.assetInfo}>
                          <div className={styles.assetAvatar}>
                            <span className={styles.assetAvatarText}>
                              {asset.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className={styles.assetSymbol}>
                              {asset.symbol}
                            </div>
                            <div className={styles.assetType}>Stock</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.priceInfo}>
                          <div className={styles.currentPrice}>
                            {formatCurrency(asset.current_price)}
                          </div>
                          <div className={styles.purchasePrice}>
                            vs {formatCurrency(asset.purchase_price)}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`${styles.tableCell} ${styles.sharesCell}`}
                      >
                        {asset.shares}
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.returnInfo}>
                          <div
                            className={`${styles.returnValue} ${
                              getValueColor(asset.unrealized_gain_loss) ===
                              "text-green-600"
                                ? styles.positive
                                : getValueColor(asset.unrealized_gain_loss) ===
                                  "text-red-600"
                                ? styles.negative
                                : styles.neutral
                            }`}
                          >
                            {formatCurrency(asset.unrealized_gain_loss)}
                          </div>
                          <div
                            className={`${styles.returnPercentage} ${
                              asset.return_percentage > 0
                                ? styles.positive
                                : asset.return_percentage < 0
                                ? styles.negative
                                : styles.neutral
                            }`}
                          >
                            {asset.return_percentage > 0 ? "+" : ""}
                            {formatPercentage(asset.return_percentage)}{" "}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredAssets.length === 0 && !assetsLoading && (
            <div className={styles.emptyState}>
              <PieChart className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No assets found</h3>
              <p className={styles.emptyMessage}>
                {searchQuery
                  ? "Try a different search term"
                  : "Add your first asset to get started"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onAssetAdded={handleAssetAdded}
      />
    </div>
  );
};

const SummaryCard = ({ title, value, change, icon: Icon }) => {
  const hasChange = change !== undefined;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={styles.card}>
      <div className={styles.summaryCardContent}>
        <div className={styles.summaryCardIcon}>
          <div className={styles.iconContainer}>
            <Icon className={styles.icon} />
          </div>
        </div>
        <div className={styles.summaryCardInfo}>
          <p className={styles.summaryCardTitle}>{title}</p>
          <div className={styles.summaryCardValueRow}>
            <p className={styles.summaryCardValue}>{value}</p>
            {hasChange && (
              <span
                className={`${styles.summaryCardChange} ${
                  isPositive
                    ? styles.positive
                    : isNegative
                    ? styles.negative
                    : styles.neutral
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

const PortfolioSkeleton = () => {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.content}>
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonSubtitle}></div>
        </div>

        <div className={styles.summaryGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.skeletonCard}></div>
            </div>
          ))}
        </div>

        <div className={styles.skeletonCharts}>
          <div className={`${styles.card} ${styles.skeletonChartLarge}`}>
            <div className={styles.skeletonContent}></div>
          </div>
          <div className={styles.card}>
            <div className={styles.skeletonContent}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
