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
} from "lucide-react";

import api from "../services/api";

type ActivityItem = {
  id: number;
  action: string;
  description: string;
  created_at: string;
};

type ActionConfig = {
  label: string;
  icon: React.ElementType;
};

const ACTION_CONFIG: Record<string, ActionConfig> = {
  login: {
    label: "Login",
    icon: LogIn,
  },
  upload: {
    label: "File uploaded",
    icon: ArrowUpToLine,
  },
  preview: {
    label: "File previewed",
    icon: Eye,
  },
  download: {
    label: "File downloaded",
    icon: Download,
  },
  share: {
    label: "File shared",
    icon: Share2,
  },
  revoke_share: {
    label: "Share revoked",
    icon: X,
  },
  rename: {
    label: "File renamed",
    icon: FilePenLine,
  },
  move: {
    label: "File moved",
    icon: Folder,
  },
  trash: {
    label: "Moved to trash",
    icon: Trash2,
  },
  restore: {
    label: "File restored",
    icon: RotateCcw,
  },
  permanent_delete: {
    label: "Permanently deleted",
    icon: Trash2,
  },
  create_folder: {
    label: "Folder created",
    icon: FolderPlus,
  },
  delete_folder: {
    label: "Folder deleted",
    icon: Trash2,
  },
};

const getActionConfig = (action: string): ActionConfig => {
  return (
    ACTION_CONFIG[action] || {
      label: action
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
      icon: ActivityIcon,
    }
  );
};

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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Activity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<ActivityItem[]>("/activity/");

        if (!isMounted) {
          return;
        }

        setActivities(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (err: any) {
        console.error("Failed to load activity:", err);

        if (!isMounted) {
          return;
        }

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

    fetchActivity();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return activities;
    }

    return activities.filter((activity) => {
      return (
        activity.description.toLowerCase().includes(query) ||
        activity.action.toLowerCase().includes(query)
      );
    });
  }, [activities, searchQuery]);

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

  return (
    <main className="activity-page">
      <header className="activity-header">
        <div>
          <div className="activity-kicker">
            <ActivityIcon size={14} />
            <span>Audit trail</span>
          </div>

          <h1>Activity</h1>

          <p>
            Keep track of everything happening across your
            DocVault account.
          </p>
        </div>

        <div className="activity-count">
          <Clock3 size={15} />

          <span>
            {activities.length}{" "}
            {activities.length === 1 ? "event" : "events"}
          </span>
        </div>
      </header>

      <div className="activity-toolbar">
        <div className="activity-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search activity"
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
              aria-label="Clear activity search"
              className="activity-search-clear"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {loading && (
        <section className="activity-state">
          <div className="activity-loader" />
          <p>Loading activity...</p>
        </section>
      )}

      {!loading && error && (
        <section className="activity-state activity-error">
          <div className="activity-state-icon">
            <ActivityIcon size={24} />
          </div>

          <h3>Unable to load activity</h3>

          <p>{error}</p>
        </section>
      )}

      {!loading &&
        !error &&
        filteredActivities.length === 0 && (
          <section className="activity-state">
            <div className="activity-state-icon">
              {searchQuery ? (
                <Search size={24} />
              ) : (
                <ActivityIcon size={24} />
              )}
            </div>

            <h3>
              {searchQuery
                ? "No matching activity"
                : "No activity yet"}
            </h3>

            <p>
              {searchQuery
                ? "Try searching for a different action or file."
                : "Your DocVault actions will appear here."}
            </p>
          </section>
        )}

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
                              duration: 0.2,
                              delay: Math.min(
                                index * 0.035,
                                0.2
                              ),
                            }}
                          >
                            <div className="activity-icon">
                              <Icon
                                size={17}
                                strokeWidth={1.8}
                              />
                            </div>

                            <div className="activity-content">
                              <div className="activity-main">
                                <span className="activity-action">
                                  {config.label}
                                </span>

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

