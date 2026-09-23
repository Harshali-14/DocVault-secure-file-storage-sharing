import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Download,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FolderOpen,
  Lock,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import api from "../services/api";

interface VaultFile {
  id: number;
  owner: string;
  folder: number | null;
  name: string;
  size: number;
  mime_type: string;
  visibility: "private" | "shared";
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

interface FileListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: VaultFile[];
}

interface StorageResponse {
  used: number;
  total: number;
  available: number;
  percentage: number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getExtension(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();

  if (!extension || extension === name.toLowerCase()) {
    return "file";
  }

  return extension;
}

function getFileIcon(name: string) {
  const extension = getExtension(name);

  if (["pdf"].includes(extension)) {
    return FileText;
  }

  if (
    ["doc", "docx", "txt", "rtf"].includes(extension)
  ) {
    return FileType;
  }

  if (
    ["xls", "xlsx", "csv"].includes(extension)
  ) {
    return FileSpreadsheet;
  }

  if (
    ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(
      extension
    )
  ) {
    return FileImage;
  }

  if (
    ["zip", "rar", "7z", "tar", "gz"].includes(extension)
  ) {
    return FileArchive;
  }

  return File;
}

function getFileTypeLabel(name: string): string {
  const extension = getExtension(name);

  if (extension === "file") return "FILE";

  return extension.toUpperCase().slice(0, 5);
}

function Dashboard() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [storage, setStorage] =
    useState<StorageResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [storageLoading, setStorageLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [storageError, setStorageError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const fetchDashboardData = async (
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setStorageLoading(true);
      }

      setError("");
      setStorageError("");

      const [filesResult, storageResult] =
        await Promise.allSettled([
          api.get<FileListResponse>("/files/"),
          api.get<StorageResponse>("/files/storage/"),
        ]);

      if (filesResult.status === "fulfilled") {
        setFiles(filesResult.value.data.results || []);
      } else {
        console.error(
          "Failed to load files:",
          filesResult.reason
        );

        setError(
          "Unable to load your recent files."
        );
      }

      if (storageResult.status === "fulfilled") {
        setStorage(storageResult.value.data);
      } else {
        console.error(
          "Failed to load storage:",
          storageResult.reason
        );

        setStorageError(
          "Storage information is temporarily unavailable."
        );
      }
    } catch (err) {
      console.error(
        "Failed to load dashboard:",
        err
      );

      setError(
        "Unable to load your vault information."
      );
    } finally {
      setLoading(false);
      setStorageLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = async (
    file: VaultFile
  ) => {
    try {
      const response = await api.get(
        `/files/${file.id}/download/`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type:
          file.mime_type ||
          "application/octet-stream",
      });

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error(
        "Failed to download file:",
        err
      );
    }
  };

  const handlePreview = async (
    file: VaultFile
  ) => {
    try {
      const response = await api.get(
        `/files/${file.id}/preview/`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type:
          file.mime_type ||
          "application/octet-stream",
      });

      const url =
        window.URL.createObjectURL(blob);

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err) {
      console.error(
        "Failed to preview file:",
        err
      );
    }
  };

  const privateFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          file.visibility === "private"
      ).length,
    [files]
  );

  const sharedFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          file.visibility === "shared"
      ).length,
    [files]
  );

  const storagePercentage =
    storage && storage.total > 0
      ? Math.min(
          100,
          Number(
            (
              (storage.used /
                storage.total) *
              100
            ).toFixed(2)
          )
        )
      : 0;

  const storageWarning =
    storagePercentage >= 80;

  const recentFiles = files
    .filter((file) => !file.is_deleted)
    .slice(0, 6);

  return (
    <div className="dashboard">
      {/* =====================================================
          HERO
         ===================================================== */}

      <motion.section
        className="dashboard-hero"
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
        }}
      >
        <div className="dashboard-hero-grid" />

        <div className="dashboard-hero-copy">
          <div className="dashboard-eyebrow-row">
            <span className="dashboard-eyebrow">
              PRIVATE WORKSPACE
            </span>

            <span className="dashboard-live-status">
              <span className="live-dot" />
              Protected
            </span>
          </div>

          <h1>
            Your vault,
            <br />
            <span>under your control.</span>
          </h1>

          <p>
            Store, organize and manage your important
            documents from one secure private workspace.
          </p>

          <div className="dashboard-hero-actions">
            <motion.button
              type="button"
              className="dashboard-primary-button"
              onClick={() => navigate("/files")}
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              <Upload size={16} />
              Upload file
              <ArrowUpRight size={14} />
            </motion.button>

            <motion.button
              type="button"
              className="dashboard-secondary-button"
              onClick={() => navigate("/files")}
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              <Search size={15} />
              Browse vault
            </motion.button>
          </div>
        </div>

        <div className="dashboard-hero-visual">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />

          <motion.div
            className="hero-security-card"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="hero-security-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <strong>Vault protected</strong>
              <span>
                Private access enabled
              </span>
            </div>

            <div className="hero-check">
              ✓
            </div>
          </motion.div>

          <div className="hero-mini-card hero-mini-card-top">
            <Lock size={14} />
            <span>Private by default</span>
          </div>

          <div className="hero-mini-card hero-mini-card-bottom">
            <Activity size={14} />
            <span>Activity tracked</span>
          </div>
        </div>
      </motion.section>

      {/* =====================================================
          QUICK ACTIONS
         ===================================================== */}

      <section className="dashboard-quick-actions">
        <motion.button
          type="button"
          className="quick-action-card"
          onClick={() => navigate("/files")}
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.08,
          }}
          whileHover={{
            y: -3,
          }}
        >
          <span className="quick-action-icon">
            <Upload size={17} />
          </span>

          <span className="quick-action-content">
            <strong>Upload files</strong>
            <small>
              Add documents to your vault
            </small>
          </span>

          <ArrowUpRight size={15} />
        </motion.button>

        <motion.button
          type="button"
          className="quick-action-card"
          onClick={() => navigate("/folders")}
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.12,
          }}
          whileHover={{
            y: -3,
          }}
        >
          <span className="quick-action-icon">
            <FolderOpen size={17} />
          </span>

          <span className="quick-action-content">
            <strong>Organize files</strong>
            <small>
              Browse your folders
            </small>
          </span>

          <ArrowUpRight size={15} />
        </motion.button>

        <motion.button
          type="button"
          className="quick-action-card"
          onClick={() => navigate("/sharing")}
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.16,
          }}
          whileHover={{
            y: -3,
          }}
        >
          <span className="quick-action-icon">
            <Share2 size={17} />
          </span>

          <span className="quick-action-content">
            <strong>Shared access</strong>
            <small>
              Manage shared documents
            </small>
          </span>

          <ArrowUpRight size={15} />
        </motion.button>

        <motion.button
          type="button"
          className="quick-action-card"
          onClick={() => navigate("/activity")}
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
          }}
          whileHover={{
            y: -3,
          }}
        >
          <span className="quick-action-icon">
            <Activity size={17} />
          </span>

          <span className="quick-action-content">
            <strong>Activity log</strong>
            <small>
              Review vault activity
            </small>
          </span>

          <ArrowUpRight size={15} />
        </motion.button>
      </section>

      {/* =====================================================
          STATS
         ===================================================== */}

      <section className="dashboard-stats">
        {[
          {
            number: "01",
            label: "Total files",
            value: loading
              ? "—"
              : files.length,
            description:
              "Files currently in your vault",
            icon: File,
          },
          {
            number: "02",
            label: "Storage used",
            value: storageLoading
              ? "—"
              : storage
              ? formatBytes(storage.used)
              : "—",
            description:
              "Total uploaded file size",
            icon: Zap,
          },
          {
            number: "03",
            label: "Private",
            value: loading
              ? "—"
              : privateFiles,
            description:
              "Visible only to you",
            icon: Lock,
          },
          {
            number: "04",
            label: "Shared",
            value: loading
              ? "—"
              : sharedFiles,
            description:
              "Files marked as shared",
            icon: Users,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.number}
              className="dashboard-stat"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.35,
                delay:
                  0.08 + index * 0.04,
              }}
              whileHover={{
                y: -3,
              }}
            >
              <div className="dashboard-stat-top">
                <div className="dashboard-stat-label">
                  <Icon size={14} />
                  <span>{stat.label}</span>
                </div>

                <span className="dashboard-stat-index">
                  {stat.number}
                </span>
              </div>

              <strong>{stat.value}</strong>

              <p>{stat.description}</p>
            </motion.div>
          );
        })}
      </section>

      {/* =====================================================
          STORAGE
         ===================================================== */}

      <motion.section
        className="dashboard-storage-section"
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.18,
        }}
      >
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow">
              VAULT STORAGE
            </span>

            <h2>Storage overview</h2>

            <p>
              Monitor the capacity of your private
              workspace.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-view-all"
            onClick={() => navigate("/settings")}
          >
            Manage storage
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="dashboard-storage-card">
          {storageLoading ? (
            <div className="storage-loading">
              <div className="storage-skeleton-ring" />

              <div className="storage-skeleton-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : storageError ? (
            <div className="dashboard-inline-error">
              <span>!</span>
              <div>
                <strong>
                  Storage unavailable
                </strong>
                <p>{storageError}</p>
              </div>
            </div>
          ) : storage ? (
            <>
              <div className="storage-main">
                <div
                  className="storage-ring"
                  style={{
                    background: `conic-gradient(
                      #17191d ${storagePercentage}%,
                      #eceef1 ${storagePercentage}% 100%
                    )`,
                  }}
                >
                  <div className="storage-ring-inner">
                    <strong>
                      {storagePercentage.toFixed(1)}
                      <small>%</small>
                    </strong>

                    <span>used</span>
                  </div>
                </div>

                <div className="storage-main-copy">
                  <span className="storage-label">
                    CURRENT USAGE
                  </span>

                  <strong>
                    {formatBytes(storage.used)}
                  </strong>

                  <p>
                    of {formatBytes(storage.total)}{" "}
                    total capacity
                  </p>

                  <div
                    className={`storage-status ${
                      storageWarning
                        ? "warning"
                        : ""
                    }`}
                  >
                    <span />
                    {storageWarning
                      ? "Storage is getting full"
                      : "Storage capacity is healthy"}
                  </div>
                </div>
              </div>

              <div className="storage-details">
                <div>
                  <span>Used</span>
                  <strong>
                    {formatBytes(storage.used)}
                  </strong>
                </div>

                <div>
                  <span>Available</span>
                  <strong>
                    {formatBytes(
                      storage.available
                    )}
                  </strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>
                    {formatBytes(storage.total)}
                  </strong>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </motion.section>

      {/* =====================================================
          RECENT FILES
         ===================================================== */}

      <motion.section
        className="dashboard-files-section"
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.24,
        }}
      >
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow">
              FILE ACTIVITY
            </span>

            <h2>Recent files</h2>

            <p>
              Your latest documents and vault activity.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-view-all"
            onClick={() => navigate("/files")}
          >
            View all
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="dashboard-files-card">
          {/* LOADING */}

          {loading && (
            <div className="dashboard-loading-list">
              {[1, 2, 3, 4].map((item) => (
                <div
                  className="file-skeleton-row"
                  key={item}
                >
                  <div className="file-skeleton-icon" />

                  <div className="file-skeleton-content">
                    <span />
                    <span />
                  </div>

                  <div className="file-skeleton-date" />
                </div>
              ))}
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="dashboard-state">
              <div className="dashboard-state-icon error">
                !
              </div>

              <h3>
                Something went wrong
              </h3>

              <p>{error}</p>

              <button
                type="button"
                className="dashboard-empty-button"
                onClick={() =>
                  fetchDashboardData()
                }
              >
                Try again
              </button>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            recentFiles.length === 0 && (
              <div className="dashboard-empty-state">
                <motion.div
                  className="empty-vault-icon"
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles size={23} />
                </motion.div>

                <span className="dashboard-eyebrow">
                  YOUR VAULT IS READY
                </span>

                <h3>
                  Start building your private
                  workspace
                </h3>

                <p>
                  Upload your first document and
                  keep everything important in one
                  secure place.
                </p>

                <button
                  type="button"
                  className="dashboard-primary-button"
                  onClick={() =>
                    navigate("/files")
                  }
                >
                  <Upload size={15} />
                  Upload your first file
                </button>
              </div>
            )}

          {/* FILE LIST */}

          {!loading &&
            !error &&
            recentFiles.length > 0 && (
              <div className="dashboard-file-list">
                <AnimatePresence>
                  {recentFiles.map(
                    (file, index) => {
                      const FileIcon =
                        getFileIcon(file.name);

                      return (
                        <motion.div
                          key={file.id}
                          className="dashboard-file-row"
                          initial={{
                            opacity: 0,
                            x: -10,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            duration: 0.28,
                            delay:
                              index * 0.045,
                          }}
                        >
                          <div className="dashboard-file-icon">
                            <FileIcon size={17} />

                            <span>
                              {getFileTypeLabel(
                                file.name
                              )}
                            </span>
                          </div>

                          <div className="dashboard-file-details">
                            <strong
                              title={file.name}
                            >
                              {file.name}
                            </strong>

                            <div className="dashboard-file-meta">
                              <span>
                                {formatBytes(
                                  file.size
                                )}
                              </span>

                              <span className="meta-separator">
                                •
                              </span>

                              <span
                                className={
                                  file.visibility ===
                                  "shared"
                                    ? "visibility-shared"
                                    : "visibility-private"
                                }
                              >
                                {file.visibility ===
                                "shared"
                                  ? "Shared"
                                  : "Private"}
                              </span>
                            </div>
                          </div>

                          <time
                            className="dashboard-file-date"
                            dateTime={
                              file.created_at
                            }
                          >
                            {formatDate(
                              file.created_at
                            )}
                          </time>

                          <div className="dashboard-file-actions">
                            <button
                              type="button"
                              onClick={() =>
                                handlePreview(
                                  file
                                )
                              }
                            >
                              Preview
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(
                                  file
                                )
                              }
                            >
                              <Download size={13} />
                              Download
                            </button>
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </AnimatePresence>
              </div>
            )}
        </div>
      </motion.section>

      {/* =====================================================
          BOTTOM SECURITY STRIP
         ===================================================== */}

      <motion.section
        className="dashboard-security-strip"
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
          delay: 0.3,
        }}
      >
        <div className="security-strip-icon">
          <ShieldCheck size={19} />
        </div>

        <div className="security-strip-copy">
          <span>Your data stays private</span>

          <p>
            Files in your vault are protected by
            authenticated access unless you explicitly
            share them.
          </p>
        </div>

        <div className="security-strip-status">
          <span className="live-dot" />
          Protected workspace
        </div>
      </motion.section>

      {/* =====================================================
          REFRESH
         ===================================================== */}

      <button
        type="button"
        className={`dashboard-refresh ${
          refreshing ? "is-refreshing" : ""
        }`}
        onClick={() =>
          fetchDashboardData(true)
        }
        disabled={refreshing}
        title="Refresh dashboard"
        aria-label="Refresh dashboard"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
}

export default Dashboard;