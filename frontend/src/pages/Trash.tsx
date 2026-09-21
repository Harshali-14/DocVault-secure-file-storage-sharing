import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";

interface TrashFile {
  id: number;
  owner: string;
  folder: number | null;
  name: string;
  file: string;
  size: number;
  mime_type: string;
  visibility: "private" | "shared";
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

interface FileListResponse {
  results: TrashFile[];
  count: number;
  next: string | null;
  previous: string | null;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatDate(date: string | null) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileType(file: TrashFile) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (extension === "pdf") return "PDF";

  if (
    ["jpg", "jpeg", "png", "webp"].includes(
      extension || ""
    )
  ) {
    return "IMAGE";
  }

  if (extension === "docx") return "DOCX";
  if (extension === "xlsx") return "XLSX";
  if (extension === "txt") return "TEXT";

  return "FILE";
}

export default function Trash() {
  const [files, setFiles] = useState<TrashFile[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [restoreFile, setRestoreFile] =
    useState<TrashFile | null>(null);

  const [permanentDeleteFile, setPermanentDeleteFile] =
    useState<TrashFile | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const loadTrash = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<
        FileListResponse | TrashFile[]
      >("/files/trash/");

      const data = response.data;

      setFiles(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (err: any) {
      console.error(
        "Unable to load Trash:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to load Trash."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const filteredFiles = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return files;

    return files.filter(
      (file) =>
        file.name
          .toLowerCase()
          .includes(query) ||
        file.mime_type
          .toLowerCase()
          .includes(query)
    );
  }, [files, search]);

  const handleRestore = async () => {
    if (!restoreFile) return;

    setActionLoading(true);
    setActionError("");

    try {
      await api.post(
        `/files/${restoreFile.id}/restore/`
      );

      setFiles((currentFiles) =>
        currentFiles.filter(
          (file) =>
            file.id !== restoreFile.id
        )
      );

      setRestoreFile(null);
    } catch (err: any) {
      console.error(
        "Restore failed:",
        err
      );

      const message =
        err?.response?.data?.error ||
        "Unable to restore the file.";

      setActionError(
        typeof message === "string"
          ? message
          : "Unable to restore the file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteFile) return;

    setActionLoading(true);
    setActionError("");

    try {
      await api.delete(
        `/files/${permanentDeleteFile.id}/permanent-delete/`
      );

      setFiles((currentFiles) =>
        currentFiles.filter(
          (file) =>
            file.id !==
            permanentDeleteFile.id
        )
      );

      setPermanentDeleteFile(null);
    } catch (err: any) {
      console.error(
        "Permanent delete failed:",
        err
      );

      const message =
        err?.response?.data?.error ||
        "Unable to permanently delete the file.";

      setActionError(
        typeof message === "string"
          ? message
          : "Unable to permanently delete the file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="files-page">

      {/* Restore modal */}
      {restoreFile && (
        <div className="file-modal-backdrop">
          <motion.div
            className="file-modal"
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
          >
            <div className="file-modal-header">
              <div>
                <span className="section-label">
                  RESTORE FILE
                </span>

                <h3>Restore file</h3>
              </div>

              <button
                className="file-modal-close"
                type="button"
                onClick={() => {
                  if (actionLoading) return;

                  setRestoreFile(null);
                  setActionError("");
                }}
              >
                ×
              </button>
            </div>

            <div className="file-modal-body">
              <p>
                Restore{" "}
                <strong>
                  {restoreFile.name}
                </strong>
                ?
              </p>

              <p>
                The file will be moved back to
                your active files.
              </p>

              {actionError && (
                <div className="files-alert">
                  {actionError}
                </div>
              )}
            </div>

            <div className="file-modal-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  setRestoreFile(null);
                  setActionError("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="primary-action"
                type="button"
                onClick={handleRestore}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Restoring..."
                  : "Restore file"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Permanent delete modal */}
      {permanentDeleteFile && (
        <div className="file-modal-backdrop">
          <motion.div
            className="file-modal"
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
          >
            <div className="file-modal-header">
              <div>
                <span className="section-label">
                  PERMANENT DELETE
                </span>

                <h3>Delete permanently</h3>
              </div>

              <button
                className="file-modal-close"
                type="button"
                onClick={() => {
                  if (actionLoading) return;

                  setPermanentDeleteFile(
                    null
                  );
                  setActionError("");
                }}
              >
                ×
              </button>
            </div>

            <div className="file-modal-body">
              <p>
                Permanently delete{" "}
                <strong>
                  {permanentDeleteFile.name}
                </strong>
                ?
              </p>

              <p>
                This action cannot be undone.
                The stored file will be permanently
                removed.
              </p>

              {actionError && (
                <div className="files-alert">
                  {actionError}
                </div>
              )}
            </div>

            <div className="file-modal-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  setPermanentDeleteFile(
                    null
                  );
                  setActionError("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="primary-action"
                type="button"
                onClick={
                  handlePermanentDelete
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Deleting..."
                  : "Delete permanently"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="files-header">
        <div>
          <span className="section-label">
            RECYCLE BIN
          </span>

          <h1>Trash</h1>

          <p>
            Restore deleted files or remove them
            permanently.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="files-alert">
          {error}
        </div>
      )}

      {actionError &&
        !restoreFile &&
        !permanentDeleteFile && (
          <div className="files-alert">
            {actionError}
          </div>
        )}

      {/* Toolbar */}
      <div className="files-toolbar">
        <input
          type="search"
          placeholder="Search deleted files..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </div>

      {/* Trash list */}
      <div className="files-table">
        <div className="files-list">
          {loading ? (
            <div className="files-empty">
              Loading Trash...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="files-empty">
              {search
                ? "No deleted files match your search."
                : "Trash is empty."}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                className="files-row"
                key={file.id}
              >
                <div className="files-type">
                  {getFileType(file)}
                </div>

                <div className="files-details">
                  <strong>
                    {file.name}
                  </strong>

                  <span>
                    {formatBytes(file.size)}
                    {" · "}
                    Deleted{" "}
                    {formatDate(
                      file.deleted_at
                    )}
                  </span>
                </div>

                <div className="files-date">
                  {formatDate(
                    file.deleted_at
                  )}
                </div>

                <div className="files-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setRestoreFile(file);
                    }}
                  >
                    Restore
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setPermanentDeleteFile(
                        file
                      );
                    }}
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      {!loading &&
        filteredFiles.length > 0 && (
          <div className="files-footer">
            <span>
              Showing{" "}
              {filteredFiles.length} of{" "}
              {files.length} deleted files
            </span>
          </div>
        )}
    </div>
  );
}