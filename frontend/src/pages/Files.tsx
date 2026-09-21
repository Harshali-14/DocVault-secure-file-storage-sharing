import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import api from "../services/api";

interface VaultFile {
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
  results: VaultFile[];
  count: number;
  next: string | null;
  previous: string | null;
}

interface Folder {
  id: number;
  name: string;
  parent: number | null;
  created_at: string;
  updated_at: string;
}

interface FolderListResponse {
  results: Folder[];
  count: number;
  next: string | null;
  previous: string | null;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileType(file: VaultFile) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "PDF";

  if (["jpg", "jpeg", "png", "webp"].includes(extension || "")) {
    return "IMAGE";
  }

  if (extension === "docx") return "DOCX";
  if (extension === "xlsx") return "XLSX";
  if (extension === "txt") return "TEXT";

  return "FILE";
}

export default function Files() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  const [renameFile, setRenameFile] = useState<VaultFile | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [moveFile, setMoveFile] = useState<VaultFile | null>(null);
  const [moveFolder, setMoveFolder] = useState<number | null>(null);

  const [deleteFile, setDeleteFile] = useState<VaultFile | null>(null);

  const [shareFile, setShareFile] = useState<VaultFile | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [filesResponse, foldersResponse] = await Promise.all([
        api.get<FileListResponse | VaultFile[]>("/files/"),
        api.get<FolderListResponse | Folder[]>("/folders/"),
      ]);

      const fileData = filesResponse.data;
      const folderData = foldersResponse.data;

      setFiles(
        Array.isArray(fileData)
          ? fileData
          : fileData.results || []
      );

      setFolders(
        Array.isArray(folderData)
          ? folderData
          : folderData.results || []
      );
    } catch (err: any) {
      console.error("Unable to load files:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to load your files."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !query ||
        file.name.toLowerCase().includes(query) ||
        file.mime_type.toLowerCase().includes(query);

      const matchesFolder =
        !selectedFolder ||
        (selectedFolder === "root"
          ? file.folder === null
          : file.folder === Number(selectedFolder));

      return matchesSearch && matchesFolder;
    });
  }, [files, search, selectedFolder]);

  const getFolderName = (folderId: number | null) => {
    if (!folderId) return "Root";

    const folder = folders.find(
      (item) => item.id === folderId
    );

    return folder?.name || "Folder";
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("name", selectedFile.name);

      if (
        selectedFolder &&
        selectedFolder !== "root"
      ) {
        formData.append("folder", selectedFolder);
      }

      const response = await api.post<VaultFile>(
        "/files/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFiles((currentFiles) => [
        response.data,
        ...currentFiles,
      ]);
    } catch (err: any) {
      console.error("Upload failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to upload the file.";

      setUploadError(
        typeof message === "string"
          ? message
          : "Unable to upload the file."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleStarToggle = async (file: VaultFile) => {
    setActionError("");

    try {
      const response = await api.patch<VaultFile>(
        `/files/${file.id}/star/`
      );

      setFiles((currentFiles) =>
        currentFiles.map((currentFile) =>
          currentFile.id === response.data.id
            ? {
                ...currentFile,
                is_starred: response.data.is_starred,
                updated_at: response.data.updated_at,
              }
            : currentFile
        )
      );
    } catch (err: any) {
      console.error("Star toggle failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to update starred status.";

      setActionError(
        typeof message === "string"
          ? message
          : "Unable to update starred status."
      );
    }
  };

  const handlePreview = async (file: VaultFile) => {
    setActionError("");

    try {
      const response = await api.get(
        `/files/${file.id}/preview/`,
        {
          responseType: "blob",
        }
      );

      const contentType =
        typeof response.headers?.["content-type"] ===
        "string"
          ? response.headers["content-type"]
          : file.mime_type ||
            "application/octet-stream";

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const previewUrl =
        URL.createObjectURL(blob);

      window.open(
        previewUrl,
        "_blank",
        "noopener,noreferrer"
      );

      window.setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
      }, 60_000);
    } catch (err: any) {
      console.error("Preview failed:", err);

      if (err?.response?.status === 401) {
        setActionError(
          "Your session has expired. Please log in again."
        );
      } else if (err?.response?.status === 403) {
        setActionError(
          "You do not have permission to preview this file."
        );
      } else if (err?.response?.status === 404) {
        setActionError("File not found.");
      } else {
        setActionError(
          "Unable to preview this file."
        );
      }
    }
  };

  const handleDownload = async (file: VaultFile) => {
    setActionLoading(true);
    setActionError("");

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

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download = file.name;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to download the file.";

      setActionError(
        typeof message === "string"
          ? message
          : "Unable to download the file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRename = async () => {
    if (!renameFile) return;

    const name = renameValue.trim();

    if (!name) {
      setActionError(
        "File name cannot be empty."
      );
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const response =
        await api.patch<VaultFile>(
          `/files/${renameFile.id}/rename/`,
          {
            name,
          }
        );

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file.id === response.data.id
            ? response.data
            : file
        )
      );

      setRenameFile(null);
      setRenameValue("");
      setActionError("");
    } catch (err: any) {
      console.error("Rename failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to rename the file.";

      setActionError(
        typeof message === "string"
          ? message
          : "Unable to rename the file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async () => {
    if (!moveFile) return;

    if (moveFolder === moveFile.folder) {
      setActionError(
        "The file is already in this folder."
      );
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const response =
        await api.patch<VaultFile>(
          `/files/${moveFile.id}/move/`,
          {
            folder: moveFolder,
          }
        );

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file.id === response.data.id
            ? {
                ...file,
                folder: response.data.folder,
                updated_at:
                  response.data.updated_at,
              }
            : file
        )
      );

      setMoveFile(null);
      setMoveFolder(null);
      setActionError("");

      await loadData();
    } catch (err: any) {
      console.error("Move failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to move the file.";

      setActionError(
        typeof message === "string"
          ? message
          : "Unable to move the file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;

    setActionLoading(true);
    setActionError("");

    try {
      await api.delete(
        `/files/${deleteFile.id}/`
      );

      setFiles((currentFiles) =>
        currentFiles.filter(
          (file) =>
            file.id !== deleteFile.id
        )
      );

      setDeleteFile(null);
      setActionError("");
    } catch (err: any) {
      console.error("Delete failed:", err);

      const message =
        err?.response?.data?.error ||
        "Unable to move the file to Trash.";

      setActionError(
        typeof message === "string"
          ? message
          : "Unable to move the file to Trash."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    if (!shareFile) return;

    const email =
      shareEmail.trim().toLowerCase();

    if (!email) {
      setShareError(
        "Enter the recipient's email address."
      );
      return;
    }

    setSharing(true);
    setShareError("");
    setShareSuccess("");

    try {
      let expiresAt: string | null = null;

      if (shareExpiry) {
        const days = Number(shareExpiry);
        const date = new Date();

        date.setDate(
          date.getDate() + days
        );

        expiresAt = date.toISOString();
      }

      await api.post(
        `/sharing/files/${shareFile.id}/`,
        {
          shared_with_email: email,
          expires_at: expiresAt,
        }
      );

      setShareSuccess(
        `"${shareFile.name}" was shared successfully.`
      );

      setShareEmail("");
      setShareExpiry("");
    } catch (err: any) {
      console.error("Share failed:", err);

      const message =
        err?.response?.data?.error ||
        err?.response?.data
          ?.shared_with_email?.[0] ||
        "Unable to share the file.";

      setShareError(
        typeof message === "string"
          ? message
          : "Unable to share the file."
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="files-page">

      {/* Rename modal */}
      {renameFile && (
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
                  RENAME FILE
                </span>

                <h3>Rename file</h3>
              </div>

              <button
                className="file-modal-close"
                type="button"
                onClick={() => {
                  setRenameFile(null);
                  setRenameValue("");
                  setActionError("");
                }}
              >
                ×
              </button>
            </div>

            <div className="file-modal-body">
              <label htmlFor="rename-file">
                File name
              </label>

              <input
                id="rename-file"
                value={renameValue}
                onChange={(event) =>
                  setRenameValue(
                    event.target.value
                  )
                }
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleRename();
                  }
                }}
              />

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
                  setRenameFile(null);
                  setRenameValue("");
                  setActionError("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="primary-action"
                type="button"
                onClick={handleRename}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Saving..."
                  : "Save name"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Move modal */}
      {moveFile && (
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
                  MOVE FILE
                </span>

                <h3>Move file</h3>
              </div>

              <button
                className="file-modal-close"
                type="button"
                onClick={() => {
                  setMoveFile(null);
                  setMoveFolder(null);
                  setActionError("");
                }}
              >
                ×
              </button>
            </div>

            <div className="file-modal-body">
              <label htmlFor="move-file">
                Destination folder
              </label>

              <select
                id="move-file"
                value={moveFolder ?? ""}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setMoveFolder(
                    value === ""
                      ? null
                      : Number(value)
                  );

                  setActionError("");
                }}
              >
                <option value="">
                  Root / No folder
                </option>

                {folders.map((folder) => (
                  <option
                    key={folder.id}
                    value={folder.id}
                  >
                    {folder.name}
                  </option>
                ))}
              </select>

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
                  setMoveFile(null);
                  setMoveFolder(null);
                  setActionError("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="primary-action"
                type="button"
                onClick={handleMove}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Moving..."
                  : "Move file"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete modal */}
      {deleteFile && (
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
                  MOVE TO TRASH
                </span>

                <h3>Delete file</h3>
              </div>

              <button
                className="file-modal-close"
                type="button"
                onClick={() => {
                  setDeleteFile(null);
                  setActionError("");
                }}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            <div className="file-modal-body">
              <p>
                Move{" "}
                <strong>
                  {deleteFile.name}
                </strong>{" "}
                to Trash?
              </p>

              <p>
                You can restore this file later
                from Trash.
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
                  setDeleteFile(null);
                  setActionError("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="primary-action"
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Moving..."
                  : "Move to Trash"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Share modal */}
      {shareFile && (
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
                  SHARE FILE
                </span>

                <h3>Share file</h3>
              </div>

              <button
                className="file-modal-close"
                type="button"
                onClick={() => {
                  if (sharing) return;

                  setShareFile(null);
                  setShareEmail("");
                  setShareExpiry("");
                  setShareError("");
                  setShareSuccess("");
                }}
              >
                ×
              </button>
            </div>

            <div className="file-modal-body">
              <p>
                Share{" "}
                <strong>
                  {shareFile.name}
                </strong>{" "}
                with another DocVault user.
              </p>

              <label htmlFor="share-email">
                Recipient email
              </label>

              <input
                id="share-email"
                type="email"
                value={shareEmail}
                onChange={(event) =>
                  setShareEmail(
                    event.target.value
                  )
                }
                placeholder="user@example.com"
                disabled={sharing}
                autoFocus
              />

              <label
                htmlFor="share-expiry"
                style={{ marginTop: 18 }}
              >
                Expiration
              </label>

              <select
                id="share-expiry"
                value={shareExpiry}
                onChange={(event) =>
                  setShareExpiry(
                    event.target.value
                  )
                }
                disabled={sharing}
              >
                <option value="">
                  Never
                </option>

                <option value="1">
                  1 day
                </option>

                <option value="7">
                  7 days
                </option>

                <option value="30">
                  30 days
                </option>
              </select>

              {shareError && (
                <div className="files-alert">
                  {shareError}
                </div>
              )}

              {shareSuccess && (
                <div className="files-alert">
                  {shareSuccess}
                </div>
              )}
            </div>

            <div className="file-modal-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  if (sharing) return;

                  setShareFile(null);
                  setShareEmail("");
                  setShareExpiry("");
                  setShareError("");
                  setShareSuccess("");
                }}
                disabled={sharing}
              >
                Cancel
              </button>

              <button
                className="primary-action"
                type="button"
                onClick={handleShare}
                disabled={sharing}
              >
                {sharing
                  ? "Sharing..."
                  : "Share file"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Page header */}
      <div className="files-page-header">
        <div>
          <span className="section-label">
            FILE VAULT
          </span>

          <h1>Files</h1>

          <p>
            Manage your uploaded documents and files.
          </p>
        </div>

        <label
          className="primary-action"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: uploading
              ? "not-allowed"
              : "pointer",
          }}
        >
          {uploading
            ? "Uploading..."
            : "Upload file"}

          <input
            type="file"
            hidden
            onChange={handleUpload}
            disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt"
          />
        </label>
      </div>

      {/* Alerts */}
      {error && (
        <div className="files-alert">
          {error}
        </div>
      )}

      {uploadError && (
        <div className="files-alert">
          {uploadError}
        </div>
      )}

      {actionError &&
        !renameFile &&
        !moveFile &&
        !deleteFile &&
        !shareFile && (
          <div className="files-alert">
            {actionError}
          </div>
        )}

      {/* Toolbar */}
      <div className="files-toolbar">
        <input
          type="search"
          placeholder="Search files..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={selectedFolder}
          onChange={(event) =>
            setSelectedFolder(
              event.target.value
            )
          }
        >
          <option value="">
            All folders
          </option>

          <option value="root">
            Root / No folder
          </option>

          {folders.map((folder) => (
            <option
              key={folder.id}
              value={folder.id}
            >
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Files */}
      <div className="files-table">
        <div className="files-list">
          {loading ? (
            <div className="files-empty">
              Loading files...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="files-empty">
              {search || selectedFolder
                ? "No files match your current filters."
                : "No files uploaded yet."}
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
                    {getFolderName(
                      file.folder
                    )}
                    {" · "}
                    {formatBytes(file.size)}
                    {" · "}
                    {file.visibility ===
                    "private"
                      ? "Private"
                      : "Shared"}
                  </span>
                </div>

                <div className="files-date">
                  {formatDate(
                    file.updated_at
                  )}
                </div>

                <div className="files-actions">

                  {/* Star */}
                  <button
                    type="button"
                    onClick={() =>
                      handleStarToggle(file)
                    }
                    title={
                      file.is_starred
                        ? "Remove from Starred"
                        : "Add to Starred"
                    }
                    aria-label={
                      file.is_starred
                        ? `Remove ${file.name} from Starred`
                        : `Add ${file.name} to Starred`
                    }
                    className={
                      file.is_starred
                        ? "file-star-button starred"
                        : "file-star-button"
                    }
                  >
                    <Star
                      size={16}
                      fill={
                        file.is_starred
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() =>
                      handlePreview(file)
                    }
                  >
                    Preview
                  </button>

                  {/* Download */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(file)
                    }
                    disabled={actionLoading}
                  >
                    Download
                  </button>

                  {/* Share */}
                  <button
                    type="button"
                    onClick={() => {
                      setShareFile(file);
                      setShareEmail("");
                      setShareExpiry("");
                      setShareError("");
                      setShareSuccess("");
                    }}
                  >
                    Share
                  </button>

                  {/* Rename */}
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setRenameFile(file);
                      setRenameValue(
                        file.name
                      );
                    }}
                  >
                    Rename
                  </button>

                  {/* Move */}
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setMoveFile(file);
                      setMoveFolder(
                        file.folder
                      );
                    }}
                  >
                    Move
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setDeleteFile(file);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom information */}
      {!loading &&
        filteredFiles.length > 0 && (
          <div className="files-footer">
            <span>
              Showing{" "}
              {filteredFiles.length} of{" "}
              {files.length} files
            </span>
          </div>
        )}
    </div>
  );
}