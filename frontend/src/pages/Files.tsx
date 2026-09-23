import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  ChevronDown,
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Grid2X2,
  List,
  MoreHorizontal,
  Move,
  Pencil,
  RefreshCw,
  Search,
  Share2,
  Shield,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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

type SortOption =
  | "updated"
  | "created"
  | "name"
  | "size";

type ViewMode = "list" | "grid";

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

  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension || "")) {
    return "IMAGE";
  }

  if (["doc", "docx"].includes(extension || "")) return "DOCX";
  if (["xls", "xlsx", "csv"].includes(extension || "")) return "XLSX";
  if (["txt", "md"].includes(extension || "")) return "TEXT";

  return "FILE";
}

function getFileIcon(file: VaultFile, size = 19) {
  const type = getFileType(file);

  if (type === "PDF" || type === "DOCX" || type === "TEXT") {
    return <FileText size={size} />;
  }

  if (type === "IMAGE") {
    return <FileImage size={size} />;
  }

  if (type === "XLSX") {
    return <FileSpreadsheet size={size} />;
  }

  return <File size={size} />;
}

export default function Files() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [sortAscending, setSortAscending] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [openMenu, setOpenMenu] = useState<number | null>(null);

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

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const closeMenu = () => setOpenMenu(null);

    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = files.filter((file) => {
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

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      }

      if (sortBy === "size") {
        comparison = a.size - b.size;
      }

      if (sortBy === "created") {
        comparison =
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime();
      }

      if (sortBy === "updated") {
        comparison =
          new Date(a.updated_at).getTime() -
          new Date(b.updated_at).getTime();
      }

      return sortAscending ? comparison : -comparison;
    });
  }, [
    files,
    search,
    selectedFolder,
    sortBy,
    sortAscending,
  ]);

  const totalStorage = useMemo(
    () =>
      files.reduce(
        (total, file) => total + Number(file.size || 0),
        0
      ),
    [files]
  );

  const starredCount = useMemo(
    () => files.filter((file) => file.is_starred).length,
    [files]
  );

  const sharedCount = useMemo(
    () => files.filter((file) => file.visibility === "shared").length,
    [files]
  );

  const getFolderName = (folderId: number | null) => {
    if (!folderId) return "Root";

    const folder = folders.find(
      (item) => item.id === folderId
    );

    return folder?.name || "Folder";
  };

  const closeAllModals = () => {
    setRenameFile(null);
    setRenameValue("");

    setMoveFile(null);
    setMoveFolder(null);

    setDeleteFile(null);

    setShareFile(null);
    setShareEmail("");
    setShareExpiry("");
    setShareError("");
    setShareSuccess("");

    setActionError("");
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
    setOpenMenu(null);

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
    setOpenMenu(null);

    try {
      const response = await api.get(
        `/files/${file.id}/preview/`,
        {
          responseType: "blob",
        }
      );

      const contentType =
        typeof response.headers?.["content-type"] === "string"
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
    setOpenMenu(null);

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
      setActionError("File name cannot be empty.");
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

      await loadData(true);
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

  const openRename = (file: VaultFile) => {
    setOpenMenu(null);
    setActionError("");
    setRenameFile(file);
    setRenameValue(file.name);
  };

  const openMove = (file: VaultFile) => {
    setOpenMenu(null);
    setActionError("");
    setMoveFile(file);
    setMoveFolder(file.folder);
  };

  const openDelete = (file: VaultFile) => {
    setOpenMenu(null);
    setActionError("");
    setDeleteFile(file);
  };

  const openShare = (file: VaultFile) => {
    setOpenMenu(null);
    setShareFile(file);
    setShareEmail("");
    setShareExpiry("");
    setShareError("");
    setShareSuccess("");
  };

  const renderActions = (file: VaultFile) => (
    <div
      className="files-actions"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={
          file.is_starred
            ? "file-icon-action is-starred"
            : "file-icon-action"
        }
        onClick={() => handleStarToggle(file)}
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

      <button
        type="button"
        className="file-icon-action"
        onClick={() => handlePreview(file)}
        title="Preview"
        aria-label={`Preview ${file.name}`}
      >
        <Eye size={16} />
      </button>

      <button
        type="button"
        className="file-icon-action"
        onClick={() => handleDownload(file)}
        disabled={actionLoading}
        title="Download"
        aria-label={`Download ${file.name}`}
      >
        <Download size={16} />
      </button>

      <div className="file-more-wrapper">
        <button
          type="button"
          className={
            openMenu === file.id
              ? "file-icon-action active"
              : "file-icon-action"
          }
          onClick={(event) => {
            event.stopPropagation();
            setOpenMenu(
              openMenu === file.id
                ? null
                : file.id
            );
          }}
          title="More actions"
          aria-label={`More actions for ${file.name}`}
        >
          <MoreHorizontal size={17} />
        </button>

        <AnimatePresence>
          {openMenu === file.id && (
            <motion.div
              className="file-action-menu"
              initial={{
                opacity: 0,
                y: -4,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -4,
                scale: 0.98,
              }}
              transition={{
                duration: 0.12,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                onClick={() => openShare(file)}
              >
                <Share2 size={15} />
                Share
              </button>

              <button
                type="button"
                onClick={() => openRename(file)}
              >
                <Pencil size={15} />
                Rename
              </button>

              <button
                type="button"
                onClick={() => openMove(file)}
              >
                <Move size={15} />
                Move
              </button>

              <div className="menu-divider" />

              <button
                type="button"
                className="danger-menu-item"
                onClick={() => openDelete(file)}
              >
                <Trash2 size={15} />
                Move to Trash
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="files-page">

      {/* =====================================================
          MODALS
      ===================================================== */}

      <AnimatePresence>
        {renameFile && (
          <div className="file-modal-backdrop">
            <motion.div
              className="file-modal"
              initial={{
                opacity: 0,
                y: 14,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
              }}
            >
              <div className="file-modal-header">
                <div>
                  <span className="section-label">
                    FILE ACTION
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
                  disabled={actionLoading}
                >
                  <X size={18} />
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
                    : "Save changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {moveFile && (
          <div className="file-modal-backdrop">
            <motion.div
              className="file-modal"
              initial={{
                opacity: 0,
                y: 14,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
              }}
            >
              <div className="file-modal-header">
                <div>
                  <span className="section-label">
                    FILE ACTION
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
                  disabled={actionLoading}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="file-modal-body">
                <div className="modal-file-preview">
                  <div className="modal-file-icon">
                    {getFileIcon(moveFile)}
                  </div>

                  <div>
                    <strong>{moveFile.name}</strong>
                    <span>
                      {formatBytes(moveFile.size)}
                    </span>
                  </div>
                </div>

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

        {deleteFile && (
          <div className="file-modal-backdrop">
            <motion.div
              className="file-modal danger-modal"
              initial={{
                opacity: 0,
                y: 14,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
              }}
            >
              <div className="file-modal-header">
                <div>
                  <span className="section-label">
                    TRASH
                  </span>
                  <h3>Move to Trash</h3>
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
                  <X size={18} />
                </button>
              </div>

              <div className="file-modal-body">
                <div className="delete-icon">
                  <Trash2 size={20} />
                </div>

                <p className="delete-title">
                  Move this file to Trash?
                </p>

                <p>
                  <strong>
                    {deleteFile.name}
                  </strong>{" "}
                  will be removed from your current
                  files. You can restore it later from
                  Trash.
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
                  className="danger-action"
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

        {shareFile && (
          <div className="file-modal-backdrop">
            <motion.div
              className="file-modal"
              initial={{
                opacity: 0,
                y: 14,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
              }}
            >
              <div className="file-modal-header">
                <div>
                  <span className="section-label">
                    SHARING
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
                  <X size={18} />
                </button>
              </div>

              <div className="file-modal-body">
                <div className="modal-file-preview">
                  <div className="modal-file-icon">
                    <Share2 size={18} />
                  </div>

                  <div>
                    <strong>{shareFile.name}</strong>
                    <span>
                      {shareFile.visibility ===
                      "private"
                        ? "Private file"
                        : "Currently shared"}
                    </span>
                  </div>
                </div>

                <p>
                  Share this file with another
                  DocVault user.
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
                  className="modal-second-label"
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
                  <div className="files-success">
                    <Check size={15} />
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
      </AnimatePresence>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <header className="files-page-header">
        <div className="files-heading">
          <div className="files-heading-label">
            <span className="section-label">
              FILE VAULT
            </span>

            <span className="secure-badge">
              <Shield size={12} />
              Private workspace
            </span>
          </div>

          <h1>Files</h1>

          <p>
            Securely manage your documents, images and
            personal files.
          </p>
        </div>

        <div className="files-header-actions">
          <button
            type="button"
            className="secondary-action refresh-button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            title="Refresh files"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "is-spinning"
                  : ""
              }
            />
            <span className="refresh-label">
              Refresh
            </span>
          </button>

          <button
            type="button"
            className="primary-action upload-button"
            onClick={() =>
              uploadInputRef.current?.click()
            }
            disabled={uploading}
          >
            <Upload size={16} />
            {uploading
              ? "Uploading..."
              : "Upload file"}
          </button>

          <input
            ref={uploadInputRef}
            type="file"
            hidden
            onChange={handleUpload}
            disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt"
          />
        </div>
      </header>

      {/* =====================================================
          ALERTS
      ===================================================== */}

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

      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      <div className="files-overview">
        <div className="files-stat-card">
          <div className="files-stat-icon">
            <File size={17} />
          </div>

          <div>
            <span>Total files</span>
            <strong>{files.length}</strong>
          </div>
        </div>

        <div className="files-stat-card">
          <div className="files-stat-icon starred">
            <Star
              size={17}
              fill="currentColor"
            />
          </div>

          <div>
            <span>Starred</span>
            <strong>{starredCount}</strong>
          </div>
        </div>

        <div className="files-stat-card">
          <div className="files-stat-icon">
            <Share2 size={17} />
          </div>

          <div>
            <span>Shared</span>
            <strong>{sharedCount}</strong>
          </div>
        </div>

        <div className="files-stat-card">
          <div className="files-stat-icon">
            <Folder size={17} />
          </div>

          <div>
            <span>Folders</span>
            <strong>{folders.length}</strong>
          </div>
        </div>

        <div className="files-stat-card storage-card">
          <div className="files-stat-icon">
            <Archive size={17} />
          </div>

          <div>
            <span>Used by files</span>
            <strong>
              {formatBytes(totalStorage)}
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="files-toolbar">
        <div className="files-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search files..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="files-filter">
          <FolderOpen size={15} />

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

          <ChevronDown
            size={14}
            className="select-chevron"
          />
        </div>

        <div className="files-sort">
          <ArrowDownAZ size={15} />

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as SortOption
              )
            }
          >
            <option value="updated">
              Recently updated
            </option>
            <option value="created">
              Recently added
            </option>
            <option value="name">
              Name A–Z
            </option>
            <option value="size">
              Largest first
            </option>
          </select>

          <button
            type="button"
            className="sort-direction"
            onClick={() =>
              setSortAscending(
                (current) => !current
              )
            }
            title={
              sortAscending
                ? "Ascending"
                : "Descending"
            }
          >
            {sortAscending ? (
              <ArrowUpAZ size={15} />
            ) : (
              <ArrowDownAZ size={15} />
            )}
          </button>
        </div>

        <div className="view-toggle">
          <button
            type="button"
            className={
              viewMode === "list"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("list")
            }
            title="List view"
          >
            <List size={16} />
          </button>

          <button
            type="button"
            className={
              viewMode === "grid"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("grid")
            }
            title="Grid view"
          >
            <Grid2X2 size={16} />
          </button>
        </div>
      </div>

      {/* =====================================================
          RESULT BAR
      ===================================================== */}

      <div className="files-result-bar">
        <div>
          <strong>
            {filteredFiles.length}
          </strong>{" "}
          {filteredFiles.length === 1
            ? "file"
            : "files"}
          {search && (
            <>
              {" "}
              matching{" "}
              <span>
                “{search}”
              </span>
            </>
          )}
        </div>

        {(search || selectedFolder) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedFolder("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* =====================================================
          FILE CONTENT
      ===================================================== */}

      <div
        className={
          viewMode === "grid"
            ? "files-container grid-view"
            : "files-container"
        }
      >
        {loading ? (
          <div className="files-loading-panel">
            <div className="loading-spinner" />
            <span>Loading your files...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="files-empty">
            <div className="files-empty-icon">
              <File size={22} />
            </div>

            <h3>
              {search || selectedFolder
                ? "No matching files"
                : "Your vault is empty"}
            </h3>

            <p>
              {search || selectedFolder
                ? "Try changing your search or folder filter."
                : "Upload your first document to start building your private vault."}
            </p>

            {!search && !selectedFolder && (
              <button
                type="button"
                className="primary-action"
                onClick={() =>
                  uploadInputRef.current?.click()
                }
              >
                <Upload size={15} />
                Upload your first file
              </button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="files-table">
            <div className="files-table-header">
              <span>FILE</span>
              <span>LOCATION</span>
              <span>UPDATED</span>
              <span>SIZE</span>
              <span />
            </div>

            <div className="files-list">
              {filteredFiles.map((file) => (
                <motion.div
                  className="files-row"
                  key={file.id}
                  initial={{
                    opacity: 0,
                    y: 4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                >
                  <div className="files-name-cell">
                    <div
                      className={`files-type-icon type-${getFileType(
                        file
                      ).toLowerCase()}`}
                    >
                      {getFileIcon(file)}
                    </div>

                    <div className="files-details">
                      <strong title={file.name}>
                        {file.name}
                      </strong>

                      <span>
                        {getFileType(file)}
                        {" · "}
                        {file.visibility ===
                        "private"
                          ? "Private"
                          : "Shared"}
                      </span>
                    </div>
                  </div>

                  <div className="files-location">
                    <Folder size={14} />
                    <span>
                      {getFolderName(
                        file.folder
                      )}
                    </span>
                  </div>

                  <div className="files-date">
                    {formatDate(
                      file.updated_at
                    )}
                  </div>

                  <div className="files-size">
                    {formatBytes(file.size)}
                  </div>

                  {renderActions(file)}
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="files-grid">
            {filteredFiles.map((file) => (
              <motion.article
                className="file-grid-card"
                key={file.id}
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.18,
                }}
              >
                <div className="file-grid-top">
                  <div
                    className={`files-type-icon large type-${getFileType(
                      file
                    ).toLowerCase()}`}
                  >
                    {getFileIcon(file, 22)}
                  </div>

                  <div className="file-grid-star">
                    <button
                      type="button"
                      className={
                        file.is_starred
                          ? "file-icon-action is-starred"
                          : "file-icon-action"
                      }
                      onClick={() =>
                        handleStarToggle(file)
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
                  </div>
                </div>

                <div className="file-grid-content">
                  <h3 title={file.name}>
                    {file.name}
                  </h3>

                  <div className="file-grid-meta">
                    <span>
                      {getFileType(file)}
                    </span>

                    <span>·</span>

                    <span>
                      {formatBytes(file.size)}
                    </span>
                  </div>

                  <div className="file-grid-location">
                    <Folder size={13} />
                    {getFolderName(
                      file.folder
                    )}
                  </div>
                </div>

                <div className="file-grid-footer">
                  <span>
                    {formatDate(
                      file.updated_at
                    )}
                  </span>

                  <div className="grid-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        handlePreview(file)
                      }
                      title="Preview"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(file)
                      }
                      title="Download"
                    >
                      <Download size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openShare(file)
                      }
                      title="Share"
                    >
                      <Share2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(
                          openMenu === file.id
                            ? null
                            : file.id
                        );
                      }}
                      title="More"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>

                {openMenu === file.id && (
                  <div
                    className="file-grid-menu"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openRename(file)
                      }
                    >
                      <Pencil size={14} />
                      Rename
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openMove(file)
                      }
                    >
                      <Move size={14} />
                      Move
                    </button>

                    <button
                      type="button"
                      className="danger-menu-item"
                      onClick={() =>
                        openDelete(file)
                      }
                    >
                      <Trash2 size={14} />
                      Move to Trash
                    </button>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      {!loading &&
        filteredFiles.length > 0 && (
          <div className="files-footer">
            <span>
              Showing{" "}
              <strong>
                {filteredFiles.length}
              </strong>{" "}
              of{" "}
              <strong>{files.length}</strong>{" "}
              files
            </span>

            <span>
              {formatBytes(totalStorage)} used
            </span>
          </div>
        )}
    </div>
  );
}