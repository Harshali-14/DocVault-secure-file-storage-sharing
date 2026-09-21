import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";

interface Recipient {
  id: number;
  username: string;
  email: string;
}

interface FileShare {
  id: number;
  file: number;
  file_name: string;
  owner_email: string;
  recipient: Recipient;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

interface ShareListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileShare[];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getFileType(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();

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

export default function Sharing() {
  const [myShares, setMyShares] = useState<FileShare[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<FileShare[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<
    "shared-with-me" | "my-shares"
  >("shared-with-me");

  const [search, setSearch] = useState("");

  const [revokeShare, setRevokeShare] =
    useState<FileShare | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const loadShares = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        mySharesResponse,
        sharedWithMeResponse,
      ] = await Promise.all([
        api.get<ShareListResponse>(
          "/sharing/my-shares/"
        ),
        api.get<ShareListResponse>(
          "/sharing/shared-with-me/"
        ),
      ]);

      setMyShares(
        Array.isArray(mySharesResponse.data)
          ? mySharesResponse.data
          : mySharesResponse.data.results || []
      );

      setSharedWithMe(
        Array.isArray(sharedWithMeResponse.data)
          ? sharedWithMeResponse.data
          : sharedWithMeResponse.data.results || []
      );
    } catch (err: any) {
      console.error(
        "Failed to load sharing data:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to load sharing data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const currentShares =
    activeTab === "shared-with-me"
      ? sharedWithMe
      : myShares;

  const filteredShares = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return currentShares;
    }

    return currentShares.filter((share) => {
      const fileName =
        share.file_name?.toLowerCase() || "";

      const owner =
        share.owner_email?.toLowerCase() || "";

      const recipient =
        share.recipient?.email?.toLowerCase() || "";

      const username =
        share.recipient?.username?.toLowerCase() ||
        "";

      return (
        fileName.includes(query) ||
        owner.includes(query) ||
        recipient.includes(query) ||
        username.includes(query)
      );
    });
  }, [
    currentShares,
    search,
  ]);

 const handlePreview = async (share: FileShare) => {
  setActionError("");

  try {
    const response = await api.get(
      `/files/${share.file}/preview/`,
      {
        responseType: "blob",
      }
    );

    const contentType =
      typeof response.headers?.["content-type"] === "string"
        ? response.headers["content-type"]
        : "application/octet-stream";

    const blob = new Blob([response.data], {
      type: contentType,
    });

    const previewUrl = URL.createObjectURL(blob);

    window.open(
      previewUrl,
      "_blank",
      "noopener,noreferrer"
    );

    window.setTimeout(() => {
      URL.revokeObjectURL(previewUrl);
    }, 60_000);
  } catch (err: any) {
    console.error(
      "Shared file preview failed:",
      err
    );

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
        "Unable to preview the shared file."
      );
    }
  }
};
  const handleDownload = async (
    share: FileShare
  ) => {
    setActionLoading(true);
    setActionError("");

    try {
      const response = await api.get(
        `/files/${share.file}/download/`,
        {
          responseType: "blob",
        }
      );

      const contentType =
  typeof response.headers?.["content-type"] === "string"
    ? response.headers["content-type"]
    : "application/octet-stream";

const blob = new Blob([response.data], {
  type: contentType,
});

      const url =
        window.URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download = share.file_name;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(
        "Download failed:",
        err
      );

      setActionError(
        err?.response?.data?.error ||
          "Unable to download the file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeShare) {
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      await api.delete(
        `/sharing/${revokeShare.id}/revoke/`
      );

      setMyShares((current) =>
        current.filter(
          (share) =>
            share.id !== revokeShare.id
        )
      );

      setRevokeShare(null);
    } catch (err: any) {
      console.error(
        "Revoke failed:",
        err
      );

      setActionError(
        err?.response?.data?.error ||
          "Unable to revoke access."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const closeRevokeModal = () => {
    if (actionLoading) {
      return;
    }

    setRevokeShare(null);
    setActionError("");
  };

  return (
    <div className="sharing-page">
      {/* Revoke modal */}
      {revokeShare && (
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
                  SHARING
                </span>

                <h3>
                  Revoke access
                </h3>
              </div>

              <button
                className="file-modal-close"
                type="button"
                onClick={closeRevokeModal}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            <div className="file-modal-body">
              <p>
                Stop sharing{" "}
                <strong>
                  {revokeShare.file_name}
                </strong>
                ?
              </p>

              <p>
                {revokeShare.recipient?.email}
                {" "}will no longer be able to
                access this file.
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
                onClick={closeRevokeModal}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="primary-action"
                type="button"
                onClick={handleRevoke}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Revoking..."
                  : "Revoke access"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <motion.section
        className="files-page-header"
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        <div>
          <span className="section-label">
            SHARING
          </span>

          <h2>Shared files</h2>

          <p>
            Manage files shared with you and
            files you have shared with others.
          </p>
        </div>
      </motion.section>

      {/* Summary */}
      <section className="sharing-summary">
        <button
          type="button"
          className={
            activeTab === "shared-with-me"
              ? "sharing-summary-card active"
              : "sharing-summary-card"
          }
          onClick={() => {
            setActiveTab("shared-with-me");
            setSearch("");
            setActionError("");
          }}
        >
          <span className="section-label">
            RECEIVED
          </span>

          <strong>
            {sharedWithMe.length}
          </strong>

          <span>
            Shared with me
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "my-shares"
              ? "sharing-summary-card active"
              : "sharing-summary-card"
          }
          onClick={() => {
            setActiveTab("my-shares");
            setSearch("");
            setActionError("");
          }}
        >
          <span className="section-label">
            SENT
          </span>

          <strong>
            {myShares.length}
          </strong>

          <span>
            My shares
          </span>
        </button>
      </section>

      {/* Toolbar */}
      <section className="files-toolbar">
        <div className="files-search">
          <span>⌕</span>

          <input
            type="search"
            placeholder="Search shared files..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="files-count">
          {filteredShares.length}{" "}
          {filteredShares.length === 1
            ? "share"
            : "shares"}
        </div>
      </section>

      {error && (
        <div className="files-alert">
          {error}
        </div>
      )}

      {actionError &&
        !revokeShare && (
          <div className="files-alert">
            {actionError}
          </div>
        )}

      {/* Content */}
      <section className="files-table">
        {loading ? (
          <div className="files-state">
            <div className="loading-spinner" />

            <p>
              Loading shared files...
            </p>
          </div>
        ) : filteredShares.length === 0 ? (
          <div className="files-state">
            <div className="files-empty-icon">
              □
            </div>

            <h3>
              {search
                ? "No matching shares"
                : activeTab ===
                  "shared-with-me"
                ? "Nothing shared with you"
                : "You haven't shared any files"}
            </h3>

            <p>
              {search
                ? "Try another search."
                : activeTab ===
                  "shared-with-me"
                ? "Files shared with you will appear here."
                : "Files you share with other users will appear here."}
            </p>
          </div>
        ) : (
          <div className="files-list">
            {filteredShares.map(
              (share) => (
                <motion.div
                  key={share.id}
                  className="files-row"
                  initial={{
                    opacity: 0,
                    y: 6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  <div className="files-type">
                    {getFileType(
                      share.file_name
                    )}
                  </div>

                  <div className="files-details">
                    <strong>
                      {share.file_name}
                    </strong>

                    <span>
                      {activeTab ===
                      "shared-with-me"
                        ? `Shared by ${share.owner_email}`
                        : `Shared with ${share.recipient?.email}`}
                    </span>
                  </div>

                  <div className="files-date">
                    {formatDate(
                      share.created_at
                    )}
                  </div>

                  <div className="files-actions">
                    <button
                      type="button"
                      onClick={() =>
                        handlePreview(
                          share
                        )
                      }
                    >
                      Preview
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          share
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Download
                    </button>

                    {activeTab ===
                      "my-shares" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(
                            ""
                          );
                          setRevokeShare(
                            share
                          );
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            )}
          </div>
        )}
      </section>

      {!loading &&
        filteredShares.length > 0 && (
          <div className="files-footer">
            <span>
              Showing{" "}
              {filteredShares.length} of{" "}
              {currentShares.length} shares
            </span>
          </div>
        )}
    </div>
  );
}