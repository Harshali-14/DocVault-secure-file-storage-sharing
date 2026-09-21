import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder as FolderIcon,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

interface Folder {
  id: number;
  name: string;
  parent: number | null;
  created_at: string;
  updated_at: string;
}

interface VaultFile {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  visibility: "private" | "shared";
  is_starred: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  folder: number | null;
}

interface FileListResponse {
  results?: VaultFile[];
  count?: number;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileIcon(file: VaultFile) {
  const mime = file.mime_type?.toLowerCase() || "";
  const name = file.name.toLowerCase();

  if (
    mime.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
  ) {
    return <FileImage size={20} />;
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    /\.(xls|xlsx|csv)$/i.test(name)
  ) {
    return <FileSpreadsheet size={20} />;
  }

  if (
    mime.includes("pdf") ||
    mime.includes("text") ||
    /\.(pdf|txt|doc|docx)$/i.test(name)
  ) {
    return <FileText size={20} />;
  }

  return <File size={20} />;
}

function FolderDetails() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const numericFolderId = Number(folderId);

  const loadFolder = async () => {
    if (!folderId || Number.isNaN(numericFolderId)) {
      setError("Invalid folder.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [folderResponse, filesResponse] = await Promise.all([
        api.get(`/folders/${numericFolderId}/`),
        api.get("/files/"),
      ]);

      setFolder(folderResponse.data);

      const data: FileListResponse | VaultFile[] = filesResponse.data;

      const allFiles = Array.isArray(data)
        ? data
        : data.results || [];

      const folderFiles = allFiles.filter(
        (file) =>
          file.folder === numericFolderId &&
          !file.is_deleted
      );

      setFiles(folderFiles);
    } catch (err: any) {
      console.error("Failed to load folder:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load this folder."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolder();
  }, [folderId]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return files;
    }

    return files.filter((file) =>
      file.name.toLowerCase().includes(query)
    );
  }, [files, search]);

  const handlePreview = async (file: VaultFile) => {
    try {
      setActionLoading(file.id);

      const response = await api.get(
        `/files/${file.id}/preview/`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = URL.createObjectURL(response.data);

      window.open(blobUrl, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      console.error("Failed to preview file:", err);
      setError("Unable to preview this file.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (file: VaultFile) => {
    try {
      setActionLoading(file.id);

      const response = await api.get(
        `/files/${file.id}/download/`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download file:", err);
      setError("Unable to download this file.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStar = async (file: VaultFile) => {
    try {
      setActionLoading(file.id);

      const response = await api.patch(
        `/files/${file.id}/star/`
      );

      setFiles((current) =>
        current.map((item) =>
          item.id === file.id
            ? {
                ...item,
                is_starred:
                  response.data.is_starred ??
                  !item.is_starred,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update star:", err);
      setError("Unable to update file.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrash = async (file: VaultFile) => {
    const confirmed = window.confirm(
      `Move "${file.name}" to trash?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(file.id);

      await api.delete(`/files/${file.id}/`);

      setFiles((current) =>
        current.filter((item) => item.id !== file.id)
      );
    } catch (err: any) {
      console.error("Failed to trash file:", err);

      setError(
        err.response?.data?.error ||
          "Unable to move this file to trash."
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="folder-details-page">
        <section className="folder-details-loading">
          Loading folder...
        </section>
      </div>
    );
  }

  if (error && !folder) {
    return (
      <div className="folder-details-page">
        <button
          className="folder-details-back"
          onClick={() => navigate("/folders")}
        >
          <ArrowLeft size={17} />
          Back to folders
        </button>

        <section className="folder-details-error">
          {error}
        </section>
      </div>
    );
  }

  return (
    <div className="folder-details-page">
      {/* HEADER */}

      <motion.section
        className="folder-details-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          className="folder-details-back"
          onClick={() => navigate("/folders")}
        >
          <ArrowLeft size={17} />
          Back to folders
        </button>

        <div className="folder-details-title-row">
          <div className="folder-details-icon">
            <FolderIcon size={23} />
          </div>

          <div className="folder-details-title">
            <span className="section-label">
              FOLDER
            </span>

            <h2>{folder?.name}</h2>

            <p>
              Created{" "}
              {folder?.created_at
                ? formatDate(folder.created_at)
                : "—"}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ERROR */}

      {error && (
        <div className="folder-details-alert">
          {error}
        </div>
      )}

      {/* TOOLBAR */}

      <section className="folder-files-toolbar">
        <div className="folder-files-count">
          <strong>{files.length}</strong>{" "}
          {files.length === 1 ? "file" : "files"}
        </div>

        <div className="folder-files-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search in this folder..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </section>

      {/* FILES */}

      {files.length === 0 ? (
        <motion.section
          className="folder-details-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="folder-empty-icon">
            <FolderIcon size={24} />
          </div>

          <h3>This folder is empty</h3>

          <p>
            Files you upload to this folder will appear here.
          </p>

          <button
            className="secondary-action"
            onClick={() => navigate("/files")}
          >
            Go to files
          </button>
        </motion.section>
      ) : filteredFiles.length === 0 ? (
        <section className="folder-details-empty folder-details-search-empty">
          <Search size={24} />

          <h3>No files found</h3>

          <p>
            No files in this folder match "{search}".
          </p>
        </section>
      ) : (
        <motion.section
          className="folder-files-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="folder-files-table">
            <div className="folder-files-table-header">
              <span>Name</span>
              <span>Size</span>
              <span>Added</span>
              <span>Actions</span>
            </div>

            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                className="folder-file-row"
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.03,
                }}
              >
                <div className="folder-file-name">
                  <div className="folder-file-type">
                    {getFileIcon(file)}
                  </div>

                  <div className="folder-file-info">
                    <span
                      className="folder-file-title"
                      title={file.name}
                    >
                      {file.name}
                    </span>

                    <span className="folder-file-visibility">
                      {file.visibility === "shared"
                        ? "Shared"
                        : "Private"}
                    </span>
                  </div>
                </div>

                <div className="folder-file-size">
                  {formatBytes(file.size)}
                </div>

                <div className="folder-file-date">
                  {formatDate(file.created_at)}
                </div>

                <div className="folder-file-actions">
                  <button
                    className="folder-file-action"
                    title="Preview"
                    disabled={actionLoading === file.id}
                    onClick={() => handlePreview(file)}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    className="folder-file-action"
                    title="Download"
                    disabled={actionLoading === file.id}
                    onClick={() => handleDownload(file)}
                  >
                    <Download size={16} />
                  </button>

                  <button
                    className={`folder-file-action ${
                      file.is_starred
                        ? "is-starred"
                        : ""
                    }`}
                    title={
                      file.is_starred
                        ? "Unstar"
                        : "Star"
                    }
                    disabled={actionLoading === file.id}
                    onClick={() => handleStar(file)}
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
                    className="folder-file-action danger"
                    title="Move to trash"
                    disabled={actionLoading === file.id}
                    onClick={() => handleTrash(file)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

export default FolderDetails;