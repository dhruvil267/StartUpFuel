import { useState, useEffect } from "react";
import { portfolioAPI } from "../../services/api";
import { X, Plus, Minus } from "lucide-react";
import styles from "./AddAssetModal.module.css";

const AddAssetModal = ({ isOpen, onClose, onAssetAdded }) => {
  const [formData, setFormData] = useState({
    symbol: "",
    shares: "",
    purchasePrice: "",
    currentPrice: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stockAllocations, setStockAllocations] = useState({});
  const [loadingAllocations, setLoadingAllocations] = useState(false);

  // Supported stocks - symbols defined in frontend
  const supportedStocks = [
    { symbol: "GOOGL", name: "Alphabet Inc" },
    { symbol: "AMZN", name: "Amazon.com Inc" },
    { symbol: "TSLA", name: "Tesla Inc" },
    { symbol: "MSFT", name: "Microsoft Corp" },
    { symbol: "AAPL", name: "Apple Inc" }
  ];
  // Fetch stock allocations from backend when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStockAllocations();
    } else {
      // Reset allocations when modal closes
      setStockAllocations({});
      setLoadingAllocations(false);
    }
  }, [isOpen]);  const fetchStockAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const allocations = await portfolioAPI.getStockAllocations();
      
      // Convert array response to object format for easier lookup
      if (Array.isArray(allocations)) {
        const allocationsObj = {};
        allocations.forEach(allocation => {
          allocationsObj[allocation.symbol] = `${allocation.percentage}%`;
        });
        setStockAllocations(allocationsObj);
      } else if (allocations && Array.isArray(allocations.allocations)) {
        // Handle case where data is nested under 'allocations' property
        const allocationsObj = {};
        allocations.allocations.forEach(allocation => {
          allocationsObj[allocation.symbol] = `${allocation.percentage}%`;
        });
        setStockAllocations(allocationsObj);
      } else {
        // Handle legacy object format if backend sometimes returns object
        setStockAllocations(allocations);
      }
    } catch (err) {
      console.error('Failed to fetch stock allocations:', err);
      // Set default allocations if backend call fails
      setStockAllocations({
        GOOGL: "44.72%",
        AMZN: "28.19%",
        TSLA: "13.64%",
        MSFT: "8.14%",
        AAPL: "5.31%"
      });
    } finally {
      setLoadingAllocations(false);
    }
  };

  const getStockAllocation = (symbol) => {
    if (loadingAllocations) return 'Loading...';
    return stockAllocations[symbol] || 'N/A';
  };
  const handleSubmit = async (type) => {
    setError("");
    setLoading(true);    try {
      const { symbol, shares, purchasePrice, currentPrice } = formData;
      
      // Validation
      if (!symbol || !shares || !purchasePrice || !currentPrice) {
        throw new Error("All fields are required");
      }

      const sharesNum = parseFloat(shares);
      const purchasePriceNum = parseFloat(purchasePrice);
      const currentPriceNum = parseFloat(currentPrice);

      if (sharesNum <= 0) {
        throw new Error("Shares must be greater than 0");
      }

      if (purchasePriceNum <= 0) {
        throw new Error("Purchase price must be greater than 0");
      }

      if (currentPriceNum <= 0) {
        throw new Error("Current price must be greater than 0");
      }

      // Add asset with transaction type
      const response = await portfolioAPI.addAsset(symbol, sharesNum, purchasePriceNum, currentPriceNum, type);
      
      // Reset form
      setFormData({
        symbol: "",
        shares: "",
        purchasePrice: "",
        currentPrice: ""
      });

      // Notify parent component
      onAssetAdded && onAssetAdded(response);
      onClose();

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add asset");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStockSelect = (symbol) => {
    setFormData(prev => ({
      ...prev,
      symbol
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Manage Portfolio Assets</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            disabled={loading}
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.form}>
          {/* Supported Stocks Selection */}          <div className={styles.section}>
            <label className={styles.label}>Select Stock</label>
            <div className={styles.stockGrid}>
              {supportedStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => handleStockSelect(stock.symbol)}
                  className={`${styles.stockCard} ${
                    formData.symbol === stock.symbol ? styles.selected : ""
                  }`}
                  disabled={loading || loadingAllocations}
                >                  <div className={styles.stockInfo}>
                    <div className={styles.stockSymbol}>{stock.symbol}</div>
                    <div className={styles.stockName}>{stock.name}</div>
                    <div className={styles.stockAllocation}>
                      {getStockAllocation(stock.symbol)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className={styles.formFields}>
            <div className={styles.field}>
              <label htmlFor="shares" className={styles.label}>
                Number of Shares
              </label>
              <input
                type="number"
                id="shares"
                name="shares"
                value={formData.shares}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                placeholder="e.g., 10"
                className={styles.input}
                disabled={loading}
                required
              />
            </div>            <div className={styles.field}>              <label htmlFor="purchasePrice" className={styles.label}>
                Transaction Price per Share ($)
              </label>
              <input
                type="number"
                id="purchasePrice"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                placeholder="e.g., 180.00 (price per share)"
                className={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="currentPrice" className={styles.label}>
                Current Market Price per Share ($)
              </label>
              <input
                type="number"
                id="currentPrice"
                name="currentPrice"
                value={formData.currentPrice}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                placeholder="e.g., 175.50 (current market price)"
                className={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>          {/* Summary */}
          {formData.shares && formData.purchasePrice && formData.currentPrice && (
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Purchase Cost (What you paid):</span>
                <span className={styles.summaryValue}>
                  ${(parseFloat(formData.shares || 0) * parseFloat(formData.purchasePrice || 0)).toFixed(2)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Current Market Value:</span>
                <span className={styles.summaryValue}>
                  ${(parseFloat(formData.shares || 0) * parseFloat(formData.currentPrice || 0)).toFixed(2)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Unrealized Gain/Loss:</span>
                <span className={`${styles.summaryValue} ${
                  (parseFloat(formData.shares || 0) * (parseFloat(formData.currentPrice || 0) - parseFloat(formData.purchasePrice || 0))) >= 0
                    ? styles.positive 
                    : styles.negative
                }`}>
                  {(parseFloat(formData.shares || 0) * (parseFloat(formData.currentPrice || 0) - parseFloat(formData.purchasePrice || 0))) >= 0 ? '+' : ''}${(parseFloat(formData.shares || 0) * (parseFloat(formData.currentPrice || 0) - parseFloat(formData.purchasePrice || 0))).toFixed(2)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Return %:</span>
                <span className={`${styles.summaryValue} ${
                  ((parseFloat(formData.currentPrice || 0) - parseFloat(formData.purchasePrice || 0)) / parseFloat(formData.purchasePrice || 0) * 100) >= 0
                    ? styles.positive 
                    : styles.negative
                }`}>
                  {((parseFloat(formData.currentPrice || 0) - parseFloat(formData.purchasePrice || 0)) / parseFloat(formData.purchasePrice || 0) * 100) >= 0 ? '+' : ''}{((parseFloat(formData.currentPrice || 0) - parseFloat(formData.purchasePrice || 0)) / parseFloat(formData.purchasePrice || 0) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>            <button
              type="button"
              onClick={() => handleSubmit("buy")}
              className={styles.buyButton}
              disabled={loading || !formData.symbol || !formData.shares || !formData.purchasePrice || !formData.currentPrice}
            >
              {loading ? (
                <span className={styles.loadingText}>Processing...</span>
              ) : (
                <>
                  <Plus className={styles.buttonIcon} />
                  Buy
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit("sell")}
              className={styles.sellButton}
              disabled={loading || !formData.symbol || !formData.shares || !formData.purchasePrice || !formData.currentPrice}
            >
              {loading ? (
                <span className={styles.loadingText}>Processing...</span>
              ) : (
                <>
                  <Minus className={styles.buttonIcon} />
                  Sell
                </>
              )}
            </button></div>
        </div>
      </div>
    </div>
  );
};

export default AddAssetModal;
