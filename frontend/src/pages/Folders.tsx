import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Folder as FolderIcon, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Folder {
  id: number;
  name: string;
  parent: number | null;
  created_at: string;
  updated_at: string;
}

interface FileItem {
  id: number;
  folder: number | null;
  name: string;
  size: number;
  mime_type: string;
  visibility: "private" | "shared";
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

interface FileListResponse {
  results: FileItem[];
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

function getFileType(file: FileItem) {
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

function Folders() {
  const navigate = useNavigate();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError("");

      const [foldersResponse, filesResponse] = await Promise.all([
        api.get("/folders/"),
        api.get<FileListResponse | FileItem[]>("/files/"),
      ]);

      const folderData =
        foldersResponse.data.results || foldersResponse.data;

      const fileData = filesResponse.data;

      const allFiles = Array.isArray(fileData)
        ? fileData
        : fileData.results || [];

      setFolders(folderData);

      const counts: Record<number, number> = {};

      allFiles.forEach((file) => {
        if (
          file.folder !== null &&
          !file.is_deleted
        ) {
          counts[file.folder] =
            (counts[file.folder] || 0) + 1;
        }
      });

      setFileCounts(counts);
    } catch (err: any) {
      console.error("Failed to load folders:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to load your folders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedName = folderName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await api.post("/folders/", {
        name: trimmedName,
        parent: null,
      });

      setFolders((current) => [
        response.data,
        ...current,
      ]);

      setFolderName("");
      setShowCreate(false);
    } catch (err: any) {
      console.error("Failed to create folder:", err);

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.name?.[0] ||
          "Unable to create folder."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    const confirmed = window.confirm(
      `Delete "${folder.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/folders/${folder.id}/`);

      setFolders((current) =>
        current.filter(
          (item) => item.id !== folder.id
        )
      );

      setFileCounts((current) => {
        const updated = { ...current };
        delete updated[folder.id];
        return updated;
      });
    } catch (err: any) {
      console.error("Failed to delete folder:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to delete this folder."
      );
    }
  };

  const openFolder = (folderId: number) => {
    navigate(`/folders/${folderId}`);
  };

  return (
    <div className="folders-page">
      <motion.section
        className="folders-page-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <span className="section-label">
            ORGANIZATION
          </span>

          <h2>Folders</h2>

          <p>
            Organize your documents into private folders
            and keep your vault structured.
          </p>
        </div>

        <button
          className="primary-action"
          type="button"
          onClick={() => setShowCreate(true)}
        >
          + New folder
        </button>
      </motion.section>

      {error && (
        <div className="folders-error">
          {error}
        </div>
      )}

      {loading ? (
        <section className="folders-panel folders-loading">
          Loading folders...
        </section>
      ) : folders.length === 0 ? (
        <motion.section
          className="folders-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="folders-empty-icon">
            <FolderIcon size={19} />
          </div>

          <h3>No folders yet</h3>

          <p>
            Create your first folder to start organizing
            your documents.
          </p>

          <button
            className="secondary-action"
            type="button"
            onClick={() => setShowCreate(true)}
          >
            Create folder
          </button>
        </motion.section>
      ) : (
        <motion.section
          className="folders-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {folders.map((folder, index) => {
            const count = fileCounts[folder.id] || 0;

            return (
              <motion.article
                key={folder.id}
                className="folder-card"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.04,
                }}
                onClick={() =>
                  openFolder(folder.id)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    openFolder(folder.id);
                  }
                }}
              >
                <div className="folder-card-top">
                  <div className="folder-icon">
                    <FolderIcon size={20} />
                  </div>

                  <button
                    className="folder-menu-button"
                    type="button"
                    title="Delete folder"
                    aria-label={`Delete ${folder.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteFolder(folder);
                    }}
                  >
                    <MoreHorizontal size={17} />
                  </button>
                </div>

                <h3>{folder.name}</h3>

                <p>
                  {count}{" "}
                  {count === 1 ? "file" : "files"}
                  {" · "}
                  Created{" "}
                  {new Date(
                    folder.created_at
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </motion.article>
            );
          })}
        </motion.section>
      )}

      {showCreate && (
        <div
          className="folder-modal-backdrop"
          onMouseDown={() =>
            setShowCreate(false)
          }
        >
          <motion.div
            className="folder-modal"
            initial={{
              opacity: 0,
              scale: 0.97,
              y: 8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="folder-modal-header">
              <div>
                <span className="section-label">
                  NEW FOLDER
                </span>

                <h3>Create folder</h3>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateFolder}>
              <label htmlFor="folder-name">
                Folder name
              </label>

              <input
                id="folder-name"
                type="text"
                value={folderName}
                onChange={(event) =>
                  setFolderName(
                    event.target.value
                  )
                }
                placeholder="e.g. Documents"
                maxLength={100}
                autoFocus
              />

              <div className="folder-modal-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={
                    creating ||
                    !folderName.trim()
                  }
                >
                  {creating
                    ? "Creating..."
                    : "Create folder"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Folders;