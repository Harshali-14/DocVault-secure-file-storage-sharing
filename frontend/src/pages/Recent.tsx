import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Search,
  X,
} from "lucide-react";
import api from "../services/api";

interface RecentFile {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  visibility: "private" | "shared";
  created_at: string;
  updated_at: string;
  folder?: {
    id: number;
    name: string;
  } | null;
}

interface RecentResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: RecentFile[];
}

const getFileIcon = (mimeType: string) => {
  if (mimeType === "application/pdf") {
    return FileType;
  }

  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return FileSpreadsheet;
  }

  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType === "text/plain"
  ) {
    return FileText;
  }

  return File;
};

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes < 1) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Recent = () => {
  const [files, setFiles] = useState<RecentFile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecentFiles = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<RecentResponse>("/files/recent/");

        setFiles(response.data.results || []);
      } catch (err: any) {
        console.error(
          "Failed to load recent files:",
          err
        );

        setError(
          err?.response?.data?.error ||
            "Unable to load recent files."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecentFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return files;
    }

    return files.filter((file) => {
      const name = file.name.toLowerCase();

      const folder =
        file.folder?.name?.toLowerCase() || "";

      return (
        name.includes(query) ||
        folder.includes(query)
      );
    });
  }, [files, search]);

  /*
   * Preview a file through the authenticated API.
   *
   * We cannot use window.open() directly on the API URL
   * because the browser navigation would not include the
   * JWT Authorization header.
   */
  const handlePreview = async (file: RecentFile) => {
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

      const url = window.URL.createObjectURL(blob);

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      /*
       * Keep the blob URL alive long enough for the
       * preview tab to load it.
       */
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err: any) {
      console.error("Preview failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to preview this file.";

      setError(message);
    }
  };

  const handleDownload = async (file: RecentFile) => {
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

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = file.name;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to download this file.";

      setError(message);
    }
  };

  return (
    <motion.main
      className="activity-page recent-page"
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
    >
      {/* Header */}
      <div className="activity-header">
        <div>
          <div className="activity-kicker">
            FILE ACTIVITY
          </div>

          <h1>Recent</h1>

          <p>
            Files you've recently accessed in your
            vault.
          </p>
        </div>

        <div className="activity-count">
          {files.length}{" "}
          {files.length === 1 ? "file" : "files"}
        </div>
      </div>

      {/* Search */}
      <div className="activity-toolbar">
        <div className="activity-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search recent files..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search recent files"
          />

          {search && (
            <button
              type="button"
              className="activity-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="activity-state">
          <div className="activity-loader" />

          <p>
            Loading recent files...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="activity-state activity-error">
          <div className="activity-state-icon">
            !
          </div>

          <h3>
            Couldn't load recent files
          </h3>

          <p>{error}</p>
        </div>
      )}

      {/* Empty / Search Empty */}
      {!loading &&
        !error &&
        filteredFiles.length === 0 && (
          <div className="activity-state">
            <div className="activity-state-icon">
              <File size={22} />
            </div>

            <h3>
              {search
                ? "No matching files"
                : "No recent files"}
            </h3>

            <p>
              {search
                ? "Try a different search term."
                : "Files you preview or download will appear here."}
            </p>
          </div>
        )}

      {/* Files */}
      {!loading &&
        !error &&
        filteredFiles.length > 0 && (
          <div className="recent-list">
            {filteredFiles.map(
              (file, index) => {
                const Icon = getFileIcon(
                  file.mime_type
                );

                return (
                  <motion.article
                    key={file.id}
                    className="recent-item"
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.25,
                      delay: index * 0.035,
                    }}
                  >
                    {/* File icon */}
                    <div className="recent-file-icon">
                      <Icon
                        size={20}
                        strokeWidth={1.8}
                      />
                    </div>

                    {/* File information */}
                    <div className="recent-file-info">
                      <div className="recent-file-name">
                        {file.name}
                      </div>

                      <div className="recent-file-meta">
                        <span>
                          {file.folder?.name ||
                            "My Vault"}
                        </span>

                        <span className="recent-meta-dot">
                          •
                        </span>

                        <span>
                          {formatFileSize(
                            file.size
                          )}
                        </span>

                        <span className="recent-meta-dot">
                          •
                        </span>

                        <span>
                          {formatDate(
                            file.updated_at
                          )}
                        </span>

                        {file.visibility ===
                          "shared" && (
                          <>
                            <span className="recent-meta-dot">
                              •
                            </span>

                            <span>
                              Shared
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="recent-file-actions">
                      <button
                        type="button"
                        onClick={() =>
                          handlePreview(file)
                        }
                        title="Preview"
                        aria-label={`Preview ${file.name}`}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(file)
                        }
                        title="Download"
                        aria-label={`Download ${file.name}`}
                      >
                        <Download size={17} />
                      </button>
                    </div>
                  </motion.article>
                );
              }
            )}
          </div>
        )}
    </motion.main>
  );
};

export default Recent;
