import React, { useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { motion } from "framer-motion";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Files from "./pages/Files";
import Folders from "./pages/Folders";
import Trash from "./pages/Trash";
import Sharing from "./pages/Sharing";
import Activity from "./pages/Activity";
import Recent from "./pages/Recent";
import Starred from "./pages/Starred";
import Settings from "./pages/Settings";
import FolderDetails from "./pages/FolderDetails";

import "./styles.css";

/* =========================================================
   TYPES
   ========================================================= */

type StorageInfo = {
  total: number;
  used: number;
  available: number;
  percentage: number;
};

const API_BASE_URL = "http://localhost:8000/api";

/* =========================================================
   HELPERS
   ========================================================= */

function getAccessToken(): string {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}

/* =========================================================
   LANDING PAGE
   ========================================================= */

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="brand">
          <div className="brand-mark">D</div>
          <span>DocVault</span>
        </div>

        <div className="landing-nav-actions">
          <button
            type="button"
            className="text-action"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>

          <button
            type="button"
            className="primary-action"
            onClick={() => navigate("/register")}
          >
            Get started
          </button>
        </div>
      </header>

      <main className="landing-content">
        <motion.section
          className="landing-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            PRIVATE FILE MANAGEMENT
          </span>

          <h1>
            Your files.
            <br />
            Your control.
          </h1>

          <p>
            Store, organize and manage your important
            documents in a private workspace built around
            security and control.
          </p>

          <div className="landing-actions">
            <button
              type="button"
              className="primary-action"
              onClick={() => navigate("/register")}
            >
              Create your vault
            </button>

            <button
              type="button"
              className="secondary-action"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </motion.section>

        <motion.section
          className="landing-vault-preview"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.15,
          }}
        >
          <div className="vault-preview-header">
            <div>
              <span className="section-label">
                YOUR VAULT
              </span>

              <h2>Private workspace</h2>
            </div>

            <div className="vault-status">
              <span className="status-dot" />
              Protected
            </div>
          </div>

          <div className="vault-storage">
            <div className="vault-storage-top">
              <span>Storage</span>
              <strong>24.8 GB</strong>
            </div>

            <div className="storage-bar">
              <div
                className="storage-progress"
                style={{ width: "72%" }}
              />
            </div>

            <span>72% used</span>
          </div>

          <div className="demo-files">
            <div className="demo-file">
              <div className="file-type">PDF</div>

              <div>
                <strong>
                  Important Document.pdf
                </strong>

                <span>2.4 MB</span>
              </div>
            </div>

            <div className="demo-file">
              <div className="file-type">DOCX</div>

              <div>
                <strong>Resume.docx</strong>
                <span>840 KB</span>
              </div>
            </div>

            <div className="demo-file">
              <div className="file-type">PNG</div>

              <div>
                <strong>Certificate.png</strong>
                <span>1.8 MB</span>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

/* =========================================================
   APPLICATION SHELL
   ========================================================= */

function AppShell() {
  const navigate = useNavigate();

  const [storage, setStorage] =
    useState<StorageInfo | null>(null);

  const [storageLoading, setStorageLoading] =
    useState(true);

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "⌂",
    },
    {
      label: "My Files",
      path: "/files",
      icon: "□",
    },
    {
      label: "Folders",
      path: "/folders",
      icon: "▱",
    },
    {
      label: "Shared",
      path: "/sharing",
      icon: "↗",
    },
    {
      label: "Activity",
      path: "/activity",
      icon: "◷",
    },
    {
      label: "Recent",
      path: "/recent",
      icon: "◴",
    },
    {
      label: "Starred",
      path: "/starred",
      icon: "☆",
    },
    {
      label: "Trash",
      path: "/trash",
      icon: "⌫",
    },
  ];

  useEffect(() => {
    loadStorage();

    /*
     * Refresh storage when the user returns to
     * the browser tab.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadStorage();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  async function loadStorage() {
    try {
      setStorageLoading(true);

      const token = getAccessToken();

      if (!token) {
        setStorage(null);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/files/storage/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setStorage(null);
          return;
        }

        throw new Error(
          "Unable to load storage information."
        );
      }

      const data = await response.json();

      setStorage({
        total: Number(data.total) || 0,
        used: Number(data.used) || 0,
        available:
          Number(data.available) ||
          Math.max(
            (Number(data.total) || 0) -
              (Number(data.used) || 0),
            0
          ),
        percentage:
          Number(data.percentage) || 0,
      });
    } catch (error) {
      console.error(
        "Sidebar storage load error:",
        error
      );

      setStorage(null);
    } finally {
      setStorageLoading(false);
    }
  }

  const storagePercentage =
    storage && storage.total > 0
      ? Math.min(
          100,
          Number(
            (
              (storage.used / storage.total) *
              100
            ).toFixed(2)
          )
        )
      : 0;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");

    navigate("/login");
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <span>DocVault</span>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-title">
            Workspace
          </p>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="nav-icon">
              ⚙
            </span>

            <span>Settings</span>
          </NavLink>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <span className="nav-icon">
              ↪
            </span>

            <span>Sign out</span>
          </button>

          {/* LIVE STORAGE */}

          <div className="storage-mini">
            <div className="storage-mini-header">
              <span>Storage</span>

              <span>
                {storageLoading
                  ? "..."
                  : `${storagePercentage.toFixed(
                      2
                    )}%`}
              </span>
            </div>

            <div className="storage-bar">
              <div
                className="storage-progress"
                style={{
                  width: `${storagePercentage}%`,
                }}
              />
            </div>

            <p>
              {storageLoading
                ? "Calculating usage..."
                : storage
                ? `${formatBytes(
                    storage.used
                  )} of ${formatBytes(
                    storage.total
                  )} used`
                : "Storage unavailable."}
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              PRIVATE WORKSPACE
            </p>

            <h1>Welcome back</h1>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              title="Notifications"
              aria-label="Notifications"
            >
              ♢
            </button>

            <div
              className="user-avatar"
              aria-label="User profile"
            >
              H
            </div>
          </div>
        </header>

        <motion.div
          className="page-container"
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
          <Routes>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/files"
              element={<Files />}
            />
<Route
  path="/folders"
  element={<Folders />}
/>
            <Route
  path="/folders/:folderId"
  element={<FolderDetails />}
/>

            <Route
              path="/sharing"
              element={<Sharing />}
            />

            <Route
              path="/activity"
              element={<Activity />}
            />

            <Route
              path="/recent"
              element={<Recent />}
            />

            <Route
              path="/starred"
              element={<Starred />}
            />

            <Route
              path="/trash"
              element={<Trash />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          </Routes>
        </motion.div>
      </main>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* APPLICATION ROUTES */}

      <Route
        path="/*"
        element={<AppShell />}
      />

      {/* FALLBACK */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;