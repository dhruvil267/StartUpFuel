import React, { useState, useEffect } from "react";
import { transactionsAPI } from "../../services/api";
import { useApi } from "../../hooks/useCommon";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
} from "lucide-react";
import styles from "./Transactions.module.css";

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // API calls
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
  } = useApi(
    () =>
      transactionsAPI.getTransactions(
        10,
        filterType === "all" ? null : filterType
      ),
    [filterType]
  );

  if (transactionsLoading) {
    return <TransactionsSkeleton />;
  }

  if (transactionsError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h2>Error loading transactions</h2>
          <p>{transactionsError}</p>
        </div>
      </div>
    );
  }
  const transactions = transactionsData?.transactions || [];
  // Filter and sort transactions
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1>Transactions</h1>
            <p>Track your trading history and activity</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <StatsCard
            title="Total Transactions"
            value={transactionsData.summary.totalTransactions || 0}
            icon={Activity}
          />{" "}
          <StatsCard
            title="Net Investment(BUY - SELL)"
            value={transactionsData.summary.netInvestment || "$0.00"}
            icon={DollarSign}
          />
          <StatsCard
            title="Buy Orders"
            value={transactionsData.summary.buyOrders || 0}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Sell Orders"
            value={transactionsData.summary.sellOrders || 0}
            icon={TrendingDown}
            color="red"
          />
        </div>

        {/* Filters and Search */}
        <div className={styles.filtersSection}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchField}
            />
          </div>

          <div className={styles.filterContainer}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              {" "}
              <option value="all">All Transactions</option>
              <option value="BUY">Buy Orders</option>
              <option value="SELL">Sell Orders</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className={styles.card}>
          <div className={styles.transactionsTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Date</th>
                  <th className={styles.tableHeader}>Type</th>
                  <th className={styles.tableHeader}>Symbol</th>
                  <th className={styles.tableHeader}>Quantity</th>
                  <th className={styles.tableHeader}>Price</th>
                  <th className={styles.tableHeader}>Amount</th>
                  <th className={styles.tableHeader}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className={styles.tableRow}>
                    {" "}
                    <td className={styles.tableCell}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className={styles.tableCell}>
                      {" "}
                      <div className={styles.transactionInfo}>
                        <div
                          className={`${styles.transactionIcon} ${
                            transaction.type.toLowerCase() === "buy"
                              ? styles.transactionIconBuy
                              : transaction.type.toLowerCase() === "sell"
                              ? styles.transactionIconSell
                              : styles.transactionIconDividend
                          }`}
                        >
                          {transaction.type_display}
                        </div>
                        <span
                          className={`${styles.transactionType} ${
                            transaction.type.toLowerCase() === "buy"
                              ? styles.transactionTypeBuy
                              : transaction.type.toLowerCase() === "sell"
                              ? styles.transactionTypeSell
                              : styles.transactionTypeDividend
                          }`}
                        >
                          {transaction.type.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`${styles.tableCell} ${styles.transactionSymbol}`}
                    >
                      {transaction.symbol}
                    </td>{" "}
                    <td className={styles.tableCell}>
                      {transaction.quantity || "-"}
                    </td>{" "}
                    <td className={styles.tableCell}>
                      {transaction.formatted_price}
                    </td>{" "}
                    <td className={styles.tableCell}>
                      <span
                        className={`${
                          transaction.type.toLowerCase() === "buy"
                            ? styles.amountNegative
                            : styles.amountPositive
                        }`}
                      >
                        {transaction.formatted_amount}
                      </span>
                    </td>{" "}
                    <td className={styles.tableCell}>
                      <span className={styles.statusCompleted}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className={styles.emptyState}>
                <Activity className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No transactions found</h3>
                <p className={styles.emptyMessage}>
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start trading to see your transaction history here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color = "blue" }) => {
  return (
    <div className={styles.card}>
      <div className={styles.statsCardContent}>
        <div className={styles.statsCardIcon}>
          <div
            className={`${styles.statsIconContainer} ${
              styles[
                `statsIcon${color.charAt(0).toUpperCase() + color.slice(1)}`
              ]
            }`}
          >
            <Icon className={styles.statsIcon} />
          </div>
        </div>
        <div className={styles.statsCardInfo}>
          <p className={styles.statsCardTitle}>{title}</p>
          <p className={styles.statsCardValue}>{value}</p>
        </div>
      </div>
    </div>
  );
};

// Transactions Skeleton Component
const TransactionsSkeleton = () => {
  return (
    <div className={styles.loadingSkeleton}>
      <div className={styles.content}>
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonSubtitle}></div>
        </div>

        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.skeletonCard}></div>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.skeletonTable}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className={styles.skeletonRow}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
