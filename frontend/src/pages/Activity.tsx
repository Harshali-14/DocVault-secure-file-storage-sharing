import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  ArrowUpToLine,
  Clock3,
  Download,
  Eye,
  FilePenLine,
  Folder,
  FolderPlus,
  LogIn,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  X,
  ShieldCheck,
  Filter,
  CalendarDays,
  ChevronDown,
  RefreshCw,
  FileText,
  Users,
} from "lucide-react";

import api from "../services/api";

/* =========================================================
   TYPES
   ========================================================= */

type ActivityItem = {
  id: number;
  action: string;
  description: string;
  created_at: string;
};

type ActionConfig = {
  label: string;
  icon: React.ElementType;
  tone: string;
};

/* =========================================================
   ACTION CONFIG
   ========================================================= */

const ACTION_CONFIG: Record<string, ActionConfig> = {
  login: {
    label: "Login",
    icon: LogIn,
    tone: "login",
  },
  upload: {
    label: "File uploaded",
    icon: ArrowUpToLine,
    tone: "upload",
  },
  preview: {
    label: "File previewed",
    icon: Eye,
    tone: "preview",
  },
  download: {
    label: "File downloaded",
    icon: Download,
    tone: "download",
  },
  share: {
    label: "File shared",
    icon: Share2,
    tone: "share",
  },
  revoke_share: {
    label: "Share revoked",
    icon: X,
    tone: "revoke",
  },
  rename: {
    label: "File renamed",
    icon: FilePenLine,
    tone: "rename",
  },
  move: {
    label: "File moved",
    icon: Folder,
    tone: "move",
  },
  trash: {
    label: "Moved to trash",
    icon: Trash2,
    tone: "trash",
  },
  restore: {
    label: "File restored",
    icon: RotateCcw,
    tone: "restore",
  },
  permanent_delete: {
    label: "Permanently deleted",
    icon: Trash2,
    tone: "delete",
  },
  create_folder: {
    label: "Folder created",
    icon: FolderPlus,
    tone: "folder",
  },
  delete_folder: {
    label: "Folder deleted",
    icon: Trash2,
    tone: "delete",
  },
};

const getActionConfig = (action: string): ActionConfig => {
  return (
    ACTION_CONFIG[action] || {
      label: action
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character: string) => character.toUpperCase()),    
  icon: ActivityIcon,
      tone: "default",
    }
  );
};

/* =========================================================
   DATE HELPERS
   ========================================================= */

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  const difference = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (difference < 0 || difference < 10) {
    return "Just now";
  }

  if (difference < 60) {
    return `${difference}s ago`;
  }

  const minutes = Math.floor(difference / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateGroup = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return "Today";
  }

  if (date >= yesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatFullDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const isWithinDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString).getTime();
  const now = Date.now();
  const difference = now - date;

  return difference >= 0 && difference <= days * 24 * 60 * 60 * 1000;
};

/* =========================================================
   ACTIVITY PAGE
   ========================================================= */

const Activity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     FETCH ACTIVITY
     ========================================================= */

  const fetchActivity = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get<ActivityItem[]>("/activity/");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setActivities(sorted);
    } catch (err: any) {
      console.error("Failed to load activity:", err);

      if (err?.response?.status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else {
        setError("Unable to load your activity.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<ActivityItem[]>("/activity/");

        if (!isMounted) {
          return;
        }

        const data = Array.isArray(response.data)
          ? response.data
          : [];

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        setActivities(sorted);
      } catch (err: any) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load activity:", err);

        if (err?.response?.status === 401) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else {
          setError("Unable to load your activity.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =========================================================
     FILTER OPTIONS
     ========================================================= */

  const availableActions = useMemo(() => {
    const uniqueActions = Array.from(
      new Set(activities.map((activity) => activity.action))
    );

    return uniqueActions.sort((a, b) => {
      const labelA = getActionConfig(a).label;
      const labelB = getActionConfig(b).label;

      return labelA.localeCompare(labelB);
    });
  }, [activities]);

  /* =========================================================
     FILTERED ACTIVITIES
     ========================================================= */

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch =
        !query ||
        activity.description.toLowerCase().includes(query) ||
        activity.action.toLowerCase().includes(query) ||
        getActionConfig(activity.action)
          .label.toLowerCase()
          .includes(query);

      const matchesAction =
        actionFilter === "all" ||
        activity.action === actionFilter;

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = isToday(activity.created_at);
      }

      if (dateFilter === "7days") {
        matchesDate = isWithinDays(activity.created_at, 7);
      }

      if (dateFilter === "30days") {
        matchesDate = isWithinDays(activity.created_at, 30);
      }

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [
    activities,
    searchQuery,
    actionFilter,
    dateFilter,
  ]);

  /* =========================================================
     SUMMARY STATS
     ========================================================= */

  const stats = useMemo(() => {
    const today = activities.filter((activity) =>
      isToday(activity.created_at)
    ).length;

    const uploads = activities.filter(
      (activity) => activity.action === "upload"
    ).length;

    const shares = activities.filter(
      (activity) =>
        activity.action === "share" ||
        activity.action === "revoke_share"
    ).length;

    return {
      total: activities.length,
      today,
      uploads,
      shares,
    };
  }, [activities]);

  /* =========================================================
     GROUP ACTIVITIES
     ========================================================= */

  const groupedActivities = useMemo(() => {
    return filteredActivities.reduce<Record<string, ActivityItem[]>>(
      (groups, activity) => {
        const group = getDateGroup(activity.created_at);

        if (!groups[group]) {
          groups[group] = [];
        }

        groups[group].push(activity);

        return groups;
      },
      {}
    );
  }, [filteredActivities]);

  /* =========================================================
     FILTER RESET
     ========================================================= */

  const hasActiveFilters =
    Boolean(searchQuery) ||
    actionFilter !== "all" ||
    dateFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setDateFilter("all");
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main className="activity-page">
      {/* =====================================================
          HEADER
         ===================================================== */}

      <header className="activity-header">
        <div className="activity-heading-content">
          <div className="activity-kicker">
            <span className="activity-kicker-icon">
              <ShieldCheck size={14} />
            </span>
            <span>Security audit trail</span>
          </div>

          <h1>Activity</h1>

          <p>
            Review recent actions and keep track of what&apos;s
            happening across your DocVault workspace.
          </p>
        </div>

        <button
          type="button"
          className="activity-refresh"
          onClick={() => fetchActivity(true)}
          disabled={refreshing}
          aria-label="Refresh activity"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "activity-spin" : ""}
          />
          <span>{refreshing ? "Refreshing" : "Refresh"}</span>
        </button>
      </header>

      {/* =====================================================
          SUMMARY
         ===================================================== */}

      <section className="activity-summary">
        <div className="activity-stat-card">
          <div className="activity-stat-icon">
            <ActivityIcon size={17} />
          </div>

          <div>
            <span className="activity-stat-label">
              Total events
            </span>
            <strong>
              {loading ? "—" : stats.total}
            </strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon today">
            <Clock3 size={17} />
          </div>

          <div>
            <span className="activity-stat-label">
              Today
            </span>
            <strong>
              {loading ? "—" : stats.today}
            </strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon upload">
            <FileText size={17} />
          </div>

          <div>
            <span className="activity-stat-label">
              Uploads
            </span>
            <strong>
              {loading ? "—" : stats.uploads}
            </strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon share">
            <Users size={17} />
          </div>

          <div>
            <span className="activity-stat-label">
              Sharing events
            </span>
            <strong>
              {loading ? "—" : stats.shares}
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          TOOLBAR
         ===================================================== */}

      <section className="activity-toolbar">
        <div className="activity-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            aria-label="Search activity"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="activity-search-clear"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`activity-filter-toggle${
            showFilters ? " active" : ""
          }`}
          onClick={() => setShowFilters((value) => !value)}
        >
          <Filter size={15} />
          <span>Filters</span>

          {hasActiveFilters && (
            <span className="activity-filter-count">
              {[
                actionFilter !== "all",
                dateFilter !== "all",
                Boolean(searchQuery),
              ].filter(Boolean).length}
            </span>
          )}

          <ChevronDown
            size={14}
            className={
              showFilters ? "filter-chevron open" : "filter-chevron"
            }
          />
        </button>
      </section>

      {/* =====================================================
          FILTER PANEL
         ===================================================== */}

      {showFilters && (
        <motion.section
          className="activity-filter-panel"
          initial={{ opacity: 0, height: 0, y: -5 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="activity-filter-group">
            <label>
              <ActivityIcon size={14} />
              Action
            </label>

            <div className="activity-select-wrap">
              <select
                value={actionFilter}
                onChange={(event) =>
                  setActionFilter(event.target.value)
                }
              >
                <option value="all">All actions</option>

                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {getActionConfig(action).label}
                  </option>
                ))}
              </select>

              <ChevronDown size={14} />
            </div>
          </div>

          <div className="activity-filter-group">
            <label>
              <CalendarDays size={14} />
              Time range
            </label>

            <div className="activity-select-wrap">
              <select
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
              </select>

              <ChevronDown size={14} />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="activity-clear-filters"
              onClick={clearFilters}
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </motion.section>
      )}

      {/* =====================================================
          RESULT META
         ===================================================== */}

      {!loading && !error && (
        <div className="activity-result-meta">
          <span>
            {filteredActivities.length}{" "}
            {filteredActivities.length === 1
              ? "event"
              : "events"}
          </span>

          {hasActiveFilters && (
            <span className="activity-filtered-label">
              Filtered results
            </span>
          )}
        </div>
      )}

      {/* =====================================================
          LOADING
         ===================================================== */}

      {loading && (
        <section className="activity-loading-list">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="activity-skeleton"
              key={index}
            >
              <div className="activity-skeleton-icon" />

              <div className="activity-skeleton-content">
                <div className="activity-skeleton-line short" />
                <div className="activity-skeleton-line" />
              </div>

              <div className="activity-skeleton-time" />
            </div>
          ))}
        </section>
      )}

      {/* =====================================================
          ERROR
         ===================================================== */}

      {!loading && error && (
        <section className="activity-state activity-error">
          <div className="activity-state-icon">
            <ActivityIcon size={24} />
          </div>

          <h3>Unable to load activity</h3>

          <p>{error}</p>

          <button
            type="button"
            className="activity-retry"
            onClick={() => fetchActivity()}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </section>
      )}

      {/* =====================================================
          EMPTY
         ===================================================== */}

      {!loading &&
        !error &&
        filteredActivities.length === 0 && (
          <section className="activity-state">
            <div className="activity-state-icon">
              {hasActiveFilters ? (
                <Search size={24} />
              ) : (
                <ActivityIcon size={24} />
              )}
            </div>

            <h3>
              {hasActiveFilters
                ? "No matching activity"
                : "No activity yet"}
            </h3>

            <p>
              {hasActiveFilters
                ? "Try changing your search or filters."
                : "Your DocVault actions will appear here as you use your vault."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="activity-retry"
                onClick={clearFilters}
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </section>
        )}

      {/* =====================================================
          TIMELINE
         ===================================================== */}

      {!loading &&
        !error &&
        filteredActivities.length > 0 && (
          <section className="activity-timeline">
            {Object.entries(groupedActivities).map(
              ([group, groupActivities]) => (
                <div
                  className="activity-group"
                  key={group}
                >
                  <div className="activity-group-title">
                    <span>{group}</span>
                    <div className="activity-group-line" />
                    <span className="activity-group-count">
                      {groupActivities.length}
                    </span>
                  </div>

                  <div className="activity-items">
                    {groupActivities.map(
                      (activity, index) => {
                        const config = getActionConfig(
                          activity.action
                        );

                        const Icon = config.icon;

                        return (
                          <motion.article
                            key={activity.id}
                            className="activity-item"
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              duration: 0.22,
                              delay: Math.min(
                                index * 0.035,
                                0.2
                              ),
                            }}
                          >
                            <div
                              className={`activity-timeline-marker ${config.tone}`}
                            >
                              <div className="activity-icon">
                                <Icon
                                  size={16}
                                  strokeWidth={1.9}
                                />
                              </div>
                            </div>

                            <div className="activity-card">
                              <div className="activity-content">
                                <div className="activity-main">
                                  <div className="activity-action-wrap">
                                    <span
                                      className={`activity-action-badge ${config.tone}`}
                                    >
                                      {config.label}
                                    </span>
                                  </div>

                                  <time
                                    dateTime={
                                      activity.created_at
                                    }
                                    title={formatFullDate(
                                      activity.created_at
                                    )}
                                  >
                                    {getRelativeTime(
                                      activity.created_at
                                    )}
                                  </time>
                                </div>

                                <p>
                                  {activity.description}
                                </p>

                                <div className="activity-timestamp">
                                  <Clock3 size={12} />
                                  <span>
                                    {formatFullDate(
                                      activity.created_at
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        );
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </section>
        )}
    </main>
  );
};

export default Activity;
