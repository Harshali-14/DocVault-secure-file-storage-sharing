import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
}

function getFileType(name: string): string {
  const extension = name.split(".").pop()?.toUpperCase();

  if (!extension) return "FILE";

  return extension;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Dashboard() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<VaultFile[]>([]);

  const [loading, setLoading] = useState(true);
  const [storageLoading, setStorageLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [storageError, setStorageError] =
    useState("");

  const [storage, setStorage] =
    useState<StorageResponse | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setStorageLoading(true);
        setError("");
        setStorageError("");

        const [filesResponse, storageResponse] =
          await Promise.all([
            api.get<FileListResponse>("/files/"),
            api.get<StorageResponse>("/files/storage/"),
          ]);

        setFiles(filesResponse.data.results);

        setStorage(storageResponse.data);
      } catch (err) {
        console.error(
          "Failed to load dashboard:",
          err,
        );

        /*
         * If the requests fail together, keep the
         * existing dashboard error message.
         */
        setError(
          "Unable to load your vault information.",
        );
      } finally {
        setLoading(false);
        setStorageLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDownload = async (
    file: VaultFile,
  ) => {
    try {
      const response = await api.get(
        `/files/${file.id}/download/`,
        {
          responseType: "blob",
        },
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
        err,
      );
    }
  };

  const handlePreview = async (
    file: VaultFile,
  ) => {
    try {
      const response = await api.get(
        `/files/${file.id}/preview/`,
        {
          responseType: "blob",
        },
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
        "noopener,noreferrer",
      );

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err) {
      console.error(
        "Failed to preview file:",
        err,
      );
    }
  };

  /*
   * This is only used for the visible dashboard
   * file statistics.
   *
   * Storage usage itself comes from the dedicated
   * backend storage endpoint.
   */
  const privateFiles = files.filter(
    (file) => file.visibility === "private",
  ).length;

  const sharedFiles = files.filter(
    (file) => file.visibility === "shared",
  ).length;

  const storagePercentage =
    storage && storage.total > 0
      ? Math.min(
          100,
          Number(
            (
              (storage.used /
                storage.total) *
              100
            ).toFixed(2),
          ),
        )
      : 0;

  return (
    <div className="dashboard">
      {/* PAGE HEADER */}

      <motion.section
        className="dashboard-hero"
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
      >
        <div className="dashboard-hero-copy">
          <span className="dashboard-eyebrow">
            PRIVATE WORKSPACE
          </span>

          <h1>Your vault</h1>

          <p>
            Manage your documents, files and
            private digital assets from one
            secure workspace.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-upload-button"
          onClick={() => navigate("/files")}
        >
          <span className="upload-plus">
            +
          </span>

          <span>Upload file</span>
        </button>
      </motion.section>

      {/* STATISTICS */}

      <section className="dashboard-stats">
        {/* TOTAL FILES */}

        <motion.div
          className="dashboard-stat"
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
          }}
        >
          <div className="dashboard-stat-top">
            <span>Total files</span>

            <span className="dashboard-stat-index">
              01
            </span>
          </div>

          <strong>
            {loading ? "—" : files.length}
          </strong>

          <p>
            Files currently in your vault
          </p>
        </motion.div>

        {/* STORAGE */}

        <motion.div
          className="dashboard-stat"
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.04,
          }}
        >
          <div className="dashboard-stat-top">
            <span>Storage used</span>

            <span className="dashboard-stat-index">
              02
            </span>
          </div>

          <strong>
            {storageLoading
              ? "—"
              : storage
              ? formatBytes(storage.used)
              : "—"}
          </strong>

          <p>
            Total uploaded file size
          </p>
        </motion.div>

        {/* PRIVATE */}

        <motion.div
          className="dashboard-stat"
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.08,
          }}
        >
          <div className="dashboard-stat-top">
            <span>Private</span>

            <span className="dashboard-stat-index">
              03
            </span>
          </div>

          <strong>
            {loading
              ? "—"
              : privateFiles}
          </strong>

          <p>
            Visible only to you
          </p>
        </motion.div>

        {/* SHARED */}

        <motion.div
          className="dashboard-stat"
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.12,
          }}
        >
          <div className="dashboard-stat-top">
            <span>Shared</span>

            <span className="dashboard-stat-index">
              04
            </span>
          </div>

          <strong>
            {loading
              ? "—"
              : sharedFiles}
          </strong>

          <p>
            Files marked as shared
          </p>
        </motion.div>
      </section>

      {/* STORAGE SUMMARY */}

      {!storageLoading &&
        !storageError &&
        storage && (
          <motion.section
            className="dashboard-files-section"
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
              delay: 0.12,
            }}
          >
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-eyebrow">
                  VAULT STORAGE
                </span>

                <h2>Storage overview</h2>
              </div>

              <button
                type="button"
                className="dashboard-view-all"
                onClick={() =>
                  navigate("/settings")
                }
              >
                Manage storage
                <span>↗</span>
              </button>
            </div>

            <div className="dashboard-files-card">
              <div
                className="dashboard-storage-overview"
                style={{
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "20px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "24px",
                        marginBottom: "4px",
                      }}
                    >
                      {formatBytes(
                        storage.used,
                      )}
                    </strong>

                    <span>
                      of{" "}
                      {formatBytes(
                        storage.total,
                      )}{" "}
                      used
                    </span>
                  </div>

                  <strong>
                    {storagePercentage.toFixed(
                      2,
                    )}
                    %
                  </strong>
                </div>

                <div className="storage-bar">
                  <div
                    className="storage-progress"
                    style={{
                      width: `${storagePercentage}%`,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginTop: "10px",
                    fontSize: "13px",
                  }}
                >
                  <span>
                    {formatBytes(
                      storage.available,
                    )}{" "}
                    available
                  </span>

                  <span>
                    {formatBytes(
                      storage.total,
                    )}{" "}
                    total
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        )}

      {/* STORAGE ERROR */}

      {!storageLoading &&
        storageError && (
          <div className="dashboard-state">
            <div className="dashboard-state-icon">
              !
            </div>

            <h3>
              Storage information unavailable
            </h3>

            <p>{storageError}</p>
          </div>
        )}

      {/* RECENT FILES */}

      <motion.section
        className="dashboard-files-section"
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
          delay: 0.15,
        }}
      >
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow">
              FILE ACTIVITY
            </span>

            <h2>Recent files</h2>
          </div>

          <button
            type="button"
            className="dashboard-view-all"
            onClick={() =>
              navigate("/files")
            }
          >
            View all

            <span>↗</span>
          </button>
        </div>

        <div className="dashboard-files-card">
          {/* LOADING */}

          {loading && (
            <div className="dashboard-state">
              <div className="dashboard-spinner" />

              <p>
                Loading your vault...
              </p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="dashboard-state">
              <div className="dashboard-state-icon">
                !
              </div>

              <h3>
                Something went wrong
              </h3>

              <p>{error}</p>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            files.length === 0 && (
              <div className="dashboard-state">
                <div className="dashboard-state-icon">
                  +
                </div>

                <h3>
                  Your vault is empty
                </h3>

                <p>
                  Upload your first document to
                  start building your private
                  workspace.
                </p>

                <button
                  type="button"
                  className="dashboard-empty-button"
                  onClick={() =>
                    navigate("/files")
                  }
                >
                  Upload your first file
                </button>
              </div>
            )}

          {/* FILE LIST */}

          {!loading &&
            !error &&
            files.length > 0 && (
              <div className="dashboard-file-list">
                {files
                  .slice(0, 6)
                  .map((file, index) => (
                    <motion.div
                      key={file.id}
                      className="dashboard-file-row"
                      initial={{
                        opacity: 0,
                        x: -8,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        duration: 0.25,
                        delay:
                          index * 0.05,
                      }}
                    >
                      <div className="dashboard-file-icon">
                        <span>
                          {getFileType(
                            file.name,
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
                              file.size,
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
                          file.created_at,
                        )}
                      </time>

                      <div className="dashboard-file-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handlePreview(
                              file,
                            )
                          }
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              file,
                            )
                          }
                        >
                          Download
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
        </div>
      </motion.section>
    </div>
  );
}

export default Dashboard;