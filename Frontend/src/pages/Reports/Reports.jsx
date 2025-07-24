import React, { useState } from "react";
import { reportsAPI } from "../../services/api";
import { useApi } from "../../hooks/useCommon";
import {
  FileText,
  Calendar,
  Download,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import styles from "./Reports.module.css";

const Reports = () => {
  // API calls
  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
  } = useApi(() => reportsAPI.getReports(), []);

  if (reportsLoading) {
    return <ReportsSkeleton />;
  }

  if (reportsError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h2>Error loading reports</h2>
          <p>{reportsError}</p>
        </div>
      </div>
    );
  }

  const reports = reportsData?.reports || [];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1>Reports</h1>
            <p>Generate and manage your portfolio reports</p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className={styles.reportsGrid}>
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {reports.length === 0 && (
          <div className={styles.emptyState}>
            <FileText className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No reports found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

// Report Card Component
const ReportCard = ({ report }) => {
  const [downloading, setDownloading] = useState(false);

  const getReportIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "monthly":
        return styles.reportIconMonthly;
      case "quarterly":
        return styles.reportIconQuarterly;
      case "annual":
        return styles.reportIconAnnual;
      default:
        return styles.reportIconOther;
    }
  };

  const getReportType = (type) => {
    switch (type?.toLowerCase()) {
      case "monthly":
        return styles.reportTypeMonthly;
      case "quarterly":
        return styles.reportTypeQuarterly;
      case "annual":
        return styles.reportTypeAnnual;
      default:
        return styles.reportTypeOther;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "ready":
        return <CheckCircle className={styles.statusIcon} />;
      case "processing":
        return <Clock className={styles.statusIcon} />;
      case "error":
        return <XCircle className={styles.statusIcon} />;
      default:
        return <Clock className={styles.statusIcon} />;
    }
  };
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "ready":
        return styles.statusReady;
      case "processing":
        return styles.statusProcessing;
      case "error":
        return styles.statusError;
      default:
        return styles.statusProcessing;
    }
  };

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
    <div className={styles.reportCard}>
      <div className={styles.reportHeader}>
        <div className={`${styles.reportIcon} ${getReportIcon(report.type)}`}>
          <FileText />
        </div>
        <div className={`${styles.reportType} ${getReportType(report.type)}`}>
          {report.type || "Custom"}
        </div>
      </div>{" "}
      <div className={styles.reportContent}>
        <h3 className={styles.reportTitle}>{report.name || report.title}</h3>
        <div className={styles.reportMeta}>
          <Calendar className={styles.reportMetaIcon} />
          <span>
            {report.formatted_date ||
              new Date(
                report.generated_date || report.created_at
              ).toLocaleDateString()}
          </span>
        </div>
        {report.description && (
          <p className={styles.reportDescription}>{report.description}</p>
        )}
      </div>
      <div className={styles.reportFooter}>
        <div className={styles.reportStatus}>
          <div
            className={`${styles.statusIndicator} ${getStatusClass(
              report.status
            )}`}
          ></div>
          {getStatusIcon(report.status)}
          <span className={styles.statusText}>
            {report.status === "ready"
              ? "Ready"
              : report.status === "processing"
              ? "Processing"
              : report.status === "error"
              ? "Error"
              : "Unknown"}
          </span>
        </div>{" "}
        <div className={styles.reportActions}>
          <button
            className={styles.reportActionButton}
            disabled={report.status !== "ready"}
            title="View Report"
            onClick={handleView}
          ></button>
          <button
            className={styles.reportActionButton}
            disabled={report.status !== "ready" || downloading}
            title={downloading ? "Downloading..." : "Download Report"}
            onClick={handleDownload}
          >
            {" "}
            {downloading ? (
              <div className={styles.spinner}></div>
            ) : (
              <Download />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reports Skeleton Component
const ReportsSkeleton = () => {
  return (
    <div className={styles.loadingSkeleton}>
      <div className={styles.content}>
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonSubtitle}></div>
        </div>

        <div className={styles.reportsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.reportCard}>
              <div className={styles.skeletonCard}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
