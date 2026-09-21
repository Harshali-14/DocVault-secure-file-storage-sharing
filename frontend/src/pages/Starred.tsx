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
  Star,
  X,
} from "lucide-react";
import api from "../services/api";

interface StarredFile {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  visibility: "private" | "shared";
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  folder?: {
    id: number;
    name: string;
  } | null;
}

interface StarredResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: StarredFile[];
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

const Starred = () => {
  const [files, setFiles] = useState<StarredFile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStarredFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<StarredResponse>("/files/starred/");

      setFiles(response.data.results || []);
    } catch (err: any) {
      console.error(
        "Failed to load starred files:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to load starred files."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarredFiles();
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

  const handlePreview = async (
    file: StarredFile
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

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err: any) {
      console.error("Preview failed:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to preview this file."
      );
    }
  };

  const handleDownload = async (
    file: StarredFile
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

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to download this file."
      );
    }
  };

  const handleUnstar = async (
    file: StarredFile
  ) => {
    try {
      await api.patch(
        `/files/${file.id}/star/`
      );

      setFiles((currentFiles) =>
        currentFiles.filter(
          (currentFile) =>
            currentFile.id !== file.id
        )
      );
    } catch (err: any) {
      console.error(
        "Failed to unstar file:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to remove this file from Starred."
      );
    }
  };

  return (
    <motion.main
      className="activity-page starred-page"
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
            SAVED FILES
          </div>

          <h1>Starred</h1>

          <p>
            Quick access to the files you've
            marked as important.
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
            placeholder="Search starred files..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search starred files"
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
            Loading starred files...
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
            Couldn't load starred files
          </h3>

          <p>{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        filteredFiles.length === 0 && (
          <div className="activity-state">
            <div className="activity-state-icon">
              <Star size={22} />
            </div>

            <h3>
              {search
                ? "No matching files"
                : "No starred files"}
            </h3>

            <p>
              {search
                ? "Try a different search term."
                : "Files you star will appear here for quick access."}
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
                    className="recent-item starred-item"
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
                      delay:
                        index * 0.035,
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
                          handleUnstar(file)
                        }
                        title="Remove from Starred"
                        aria-label={`Remove ${file.name} from Starred`}
                        className="starred-active-button"
                      >
                        <Star
                          size={17}
                          fill="currentColor"
                        />
                      </button>

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

export default Starred;