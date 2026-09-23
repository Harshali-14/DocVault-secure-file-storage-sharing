import React, { useEffect, useState, createContext, useContext } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Files,
  FolderOpen,
  Share2,
  Activity,
  Clock,
  Star,
  Trash2,
  Settings,
  LogOut,
  Shield,
  HardDrive,
  Lock,
  ChevronRight,
  Upload,
  X,
  Menu,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FilesPage from "./pages/Files";
import Folders from "./pages/Folders";
import Trash from "./pages/Trash";
import Sharing from "./pages/Sharing";
import ActivityPage from "./pages/Activity";
import Recent from "./pages/Recent";
import Starred from "./pages/Starred";
import SettingsPage from "./pages/Settings";
import FolderDetails from "./pages/FolderDetails";

import "./styles.css";

/* =========================================================
   TYPES & CONTEXT
   ========================================================= */

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
};

export type StorageInfo = {
  total: number;
  used: number;
  available: number;
  percentage: number;
};

type AppContextType = {
  user: UserProfile | null;
  storage: StorageInfo | null;
  refreshStorage: () => void;
  refreshUser: () => void;
};

export const AppContext = createContext<AppContextType>({
  user: null,
  storage: null,
  refreshStorage: () => {},
  refreshUser: () => {},
});

export const useAppContext = () => useContext(AppContext);

const API_BASE_URL = "http://localhost:8000/api";

/* =========================================================
   HELPERS
   ========================================================= */

export function getAccessToken(): string {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

async function apiFetch(path: string) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* =========================================================
   LANDING PAGE
   ========================================================= */

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Lock size={18} />,
      number: "01",
      title: "Private by default",
      description:
        "Your files stay private until you explicitly choose to share them.",
    },
    {
      icon: <Share2 size={18} />,
      number: "02",
      title: "Controlled sharing",
      description:
        "Share specific files with expiry controls and revoke access whenever you need.",
    },
    {
      icon: <Activity size={18} />,
      number: "03",
      title: "Complete activity",
      description:
        "Keep track of uploads, downloads, previews and sharing activity.",
    },
    {
      icon: <HardDrive size={18} />,
      number: "04",
      title: "5 GB workspace",
      description:
        "A private storage space for documents, images and important files.",
    },
  ];

  const fileTypes = ["PDF", "DOCX", "XLSX", "PNG", "JPG", "WEBP"];

  return (
    <div className="landing-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="landing-nav">
        <div className="brand">
          <div className="brand-mark">
            <Shield size={15} />
          </div>

          <span>DocVault</span>
        </div>

        <div className="landing-nav-center">
          <span>Private storage</span>
          <span>Secure sharing</span>
          <span>Activity tracking</span>
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
            className="primary-action nav-cta"
            onClick={() => navigate("/register")}
          >
            Get started
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main className="landing-content">

        <section className="landing-hero-new">

          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >

            <div className="hero-badge">
              <span className="hero-status-dot" />
              Private file management
            </div>

            <h1>
              Private storage
              <br />
              for the files
              <br />
              <span>that matter.</span>
            </h1>

            <p className="hero-sub">
              Store, organize and share your important documents
              inside a private workspace designed around control,
              security and simplicity.
            </p>

            <div className="landing-actions">
              <button
                type="button"
                className="primary-action large"
                onClick={() => navigate("/register")}
              >
                Create your vault
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                className="secondary-action large-secondary"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </div>

            <div className="hero-trust-row">
              <div>
                <Lock size={14} />
                <span>Private by default</span>
              </div>

              <div>
                <Shield size={14} />
                <span>Authenticated access</span>
              </div>

              <div>
                <Activity size={14} />
                <span>Activity tracking</span>
              </div>
            </div>

          </motion.div>

          {/* =================================================
              PRODUCT PREVIEW
          ================================================= */}

          <motion.div
            className="hero-product-area"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.65,
              delay: 0.15,
            }}
          >

            <div className="vault-glow" />

            {/* Floating file card */}

            <motion.div
              className="floating-file floating-file-one"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="floating-file-icon pdf">
                PDF
              </div>

              <div>
                <strong>Resume.pdf</strong>
                <span>2.4 MB</span>
              </div>
            </motion.div>

            <motion.div
              className="floating-file floating-file-two"
              animate={{
                y: [0, 7, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="floating-file-icon image">
                IMG
              </div>

              <div>
                <strong>certificate.png</strong>
                <span>840 KB</span>
              </div>
            </motion.div>

            {/* Main dashboard preview */}

            <div className="landing-product">

              <div className="product-window-top">
                <div className="window-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="product-url">
                  docvault / workspace
                </div>

                <div className="product-secure">
                  <Lock size={11} />
                  Private
                </div>
              </div>

              <div className="product-body">

                <aside className="product-sidebar">

                  <div className="product-logo">
                    <div className="product-logo-mark">
                      <Shield size={11} />
                    </div>
                    DocVault
                  </div>

                  <div className="product-nav">

                    <div className="product-nav-title">
                      Workspace
                    </div>

                    <div className="product-nav-item active">
                      <LayoutDashboard size={13} />
                      Overview
                    </div>

                    <div className="product-nav-item">
                      <Files size={13} />
                      My Files
                    </div>

                    <div className="product-nav-item">
                      <FolderOpen size={13} />
                      Folders
                    </div>

                    <div className="product-nav-item">
                      <Share2 size={13} />
                      Shared
                    </div>

                    <div className="product-nav-title second">
                      System
                    </div>

                    <div className="product-nav-item">
                      <Activity size={13} />
                      Activity
                    </div>

                    <div className="product-nav-item">
                      <Settings size={13} />
                      Settings
                    </div>

                  </div>

                  <div className="product-sidebar-storage">

                    <div className="storage-mini-header">
                      <span>
                        <HardDrive size={11} />
                        Storage
                      </span>

                      <strong>24%</strong>
                    </div>

                    <div className="storage-mini-track">
                      <div
                        className="storage-mini-fill"
                        style={{ width: "24%" }}
                      />
                    </div>

                    <small>
                      1.2 GB of 5 GB
                    </small>

                  </div>

                </aside>

                <div className="product-main">

                  <div className="product-heading">

                    <div>
                      <span>WORKSPACE</span>

                      <h3>
                        Good afternoon, Harshali
                      </h3>

                      <p>
                        Here's what's happening with your vault.
                      </p>
                    </div>

                    <button className="product-upload">
                      <Upload size={12} />
                      Upload
                    </button>

                  </div>

                  <div className="product-stats">

                    <div className="product-stat">
                      <span>Total files</span>
                      <strong>24</strong>
                      <small>+4 this week</small>
                    </div>

                    <div className="product-stat">
                      <span>Storage used</span>
                      <strong>1.2 GB</strong>
                      <small>24% of 5 GB</small>
                    </div>

                    <div className="product-stat">
                      <span>Shared</span>
                      <strong>6</strong>
                      <small>2 expiring soon</small>
                    </div>

                  </div>

                  <div className="product-section-head">
                    <div>
                      <strong>Recent files</strong>
                      <span>Latest activity</span>
                    </div>

                    <span className="product-view">
                      View all
                    </span>
                  </div>

                  <div className="product-files">

                    <div className="product-file">
                      <div className="product-file-type pdf">
                        PDF
                      </div>

                      <div className="product-file-info">
                        <strong>Project_Report.pdf</strong>
                        <span>
                          4.8 MB · Updated today
                        </span>
                      </div>

                      <Lock size={12} />
                    </div>

                    <div className="product-file">
                      <div className="product-file-type doc">
                        DOC
                      </div>

                      <div className="product-file-info">
                        <strong>Resume_2026.docx</strong>
                        <span>
                          1.2 MB · Updated yesterday
                        </span>
                      </div>

                      <Lock size={12} />
                    </div>

                    <div className="product-file">
                      <div className="product-file-type image">
                        IMG
                      </div>

                      <div className="product-file-info">
                        <strong>Certificate.png</strong>
                        <span>
                          840 KB · Updated Sep 18
                        </span>
                      </div>

                      <Share2 size={12} />
                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* Security badge */}

            <motion.div
              className="security-floating-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="security-card-icon">
                <Shield size={14} />
              </div>

              <div>
                <strong>Workspace protected</strong>
                <span>Authenticated access enabled</span>
              </div>

              <div className="security-check">
                ✓
              </div>
            </motion.div>

          </motion.div>

        </section>

        {/* =================================================
            FILE TYPES
        ================================================= */}

        <motion.section
          className="supported-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span>
            STORE THE FILES YOU ACTUALLY USE
          </span>

          <div className="supported-types">
            {fileTypes.map((type) => (
              <div
                className="supported-type"
                key={type}
              >
                {type}
              </div>
            ))}
          </div>
        </motion.section>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section className="landing-features-new">

          <div className="features-intro">

            <div>
              <span className="section-label">
                THE DOCVAULT APPROACH
              </span>

              <h2>
                Less file management.
                <br />
                More control.
              </h2>
            </div>

            <p>
              DocVault keeps the experience simple while
              putting privacy and control at the center of
              your workspace.
            </p>

          </div>

          <div className="features-grid-new">

            {features.map((feature, index) => (

              <motion.div
                key={feature.title}
                className="feature-card-new"
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  margin: "-60px",
                }}
                transition={{
                  delay: index * 0.08,
                }}
              >

                <div className="feature-card-top">
                  <span>{feature.number}</span>

                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                </div>

                <h3>{feature.title}</h3>

                <p>
                  {feature.description}
                </p>

              </motion.div>

            ))}

          </div>

        </section>

        {/* =================================================
            SECURITY STRIP
        ================================================= */}

        <section className="landing-security">

          <div className="security-copy">

            <span className="section-label">
              CONTROL BY DESIGN
            </span>

            <h2>
              Your files shouldn't
              <br />
              feel public.
            </h2>

            <p>
              Every DocVault workspace starts private.
              Sharing is an intentional action — not the
              default.
            </p>

            <div className="security-points">

              <div>
                <Lock size={15} />
                <span>
                  Private files by default
                </span>
              </div>

              <div>
                <Share2 size={15} />
                <span>
                  Explicit sharing controls
                </span>
              </div>

              <div>
                <Activity size={15} />
                <span>
                  Activity visibility
                </span>
              </div>

            </div>

          </div>

          <div className="security-visual">

            <div className="security-visual-card">

              <div className="security-visual-header">
                <span>ACCESS CONTROL</span>
                <Shield size={15} />
              </div>

              <div className="access-row">

                <div className="access-avatar">
                  HK
                </div>

                <div>
                  <strong>
                    Harshali Kulkarni
                  </strong>

                  <span>
                    Workspace owner
                  </span>
                </div>

                <div className="access-status">
                  Owner
                </div>

              </div>

              <div className="access-row muted">

                <div className="access-avatar">
                  PS
                </div>

                <div>
                  <strong>
                    Project collaborator
                  </strong>

                  <span>
                    Limited file access
                  </span>
                </div>

                <div className="access-status">
                  Shared
                </div>

              </div>

              <div className="access-footer">
                <Lock size={13} />
                Files remain private until shared.
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            CTA
        ================================================= */}

        <motion.section
          className="landing-cta-new"
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
        >

          <div className="cta-mark">
            <Shield size={20} />
          </div>

          <span className="section-label">
            YOUR PRIVATE WORKSPACE
          </span>

          <h2>
            Ready to take control
            <br />
            of your files?
          </h2>

          <p>
            Create your DocVault workspace and start
            organizing your files privately.
          </p>

          <button
            type="button"
            className="primary-action large"
            onClick={() => navigate("/register")}
          >
            Create your vault
            <ChevronRight size={16} />
          </button>

        </motion.section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="landing-footer-new">

        <div className="brand">
          <div className="brand-mark small">
            <Shield size={12} />
          </div>

          <span>DocVault</span>
        </div>

        <p>
          Private document management.
        </p>

        <span>
          © 2026 DocVault
        </span>

      </footer>

    </div>
  );
}


/* =========================================================
   APPLICATION SHELL
   ========================================================= */

const navItems = [
  { label: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
  { label: "My Files", path: "/files", Icon: Files },
  { label: "Folders", path: "/folders", Icon: FolderOpen },
  { label: "Shared", path: "/sharing", Icon: Share2 },
  { label: "Recent", path: "/recent", Icon: Clock },
  { label: "Starred", path: "/starred", Icon: Star },
  { label: "Trash", path: "/trash", Icon: Trash2 },
];
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
function AppShell() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadUser();
    loadStorage();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadStorage();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  async function loadUser() {
    try {
      const data = await apiFetch("/auth/profile/");
      setUser(data);
    } catch {
      // Silent — not critical for shell
    }
  }

  async function loadStorage() {
    try {
      setStorageLoading(true);
      const token = getAccessToken();
      if (!token) { setStorage(null); return; }
      const data = await apiFetch("/files/storage/");
      setStorage({
        total: Number(data.total) || 0,
        used: Number(data.used) || 0,
        available: Number(data.available) || 0,
        percentage: Number(data.percentage) || 0,
      });
    } catch {
      setStorage(null);
    } finally {
      setStorageLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const storagePercent =
    storage && storage.total > 0
      ? Math.min(100, (storage.used / storage.total) * 100)
      : 0;

  const userInitial =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    "U";

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.username || "Account";

  const contextValue: AppContextType = {
    user,
    storage,
    refreshStorage: loadStorage,
    refreshUser: loadUser,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-shell">
        {/* MOBILE TOPBAR */}
        <div className="mobile-topbar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="brand">
            <div className="brand-mark small">
              <Shield size={12} />
            </div>
            <span>DocVault</span>
          </div>
          <div className="user-avatar" aria-label="User profile">
            {userInitial}
          </div>
        </div>

        {/* MOBILE OVERLAY */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* SIDEBAR */}
        <aside className={`sidebar${mobileSidebarOpen ? " sidebar-open" : ""}`}>
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="brand">
              <div className="brand-mark">
                <Shield size={14} />
              </div>
              <span>DocVault</span>
            </div>
            <button
              type="button"
              className="icon-button mobile-close"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav" aria-label="Main navigation">
            <p className="nav-section-title">Workspace</p>
            {navItems.map(({ label, path, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `nav-item${isActive ? " active" : ""}`
                }
                onClick={() => setMobileSidebarOpen(false)}
              >
                <Icon size={16} className="nav-icon" />
                <span>{label}</span>
              </NavLink>
            ))}

            <p className="nav-section-title" style={{ marginTop: 24 }}>System</p>
            <NavLink
              to="/activity"
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Activity size={16} className="nav-icon" />
              <span>Activity</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Settings size={16} className="nav-icon" />
              <span>Settings</span>
            </NavLink>
          </nav>

          {/* Sidebar bottom */}
          <div className="sidebar-bottom">
            {/* Storage indicator */}
            <div className="storage-mini">
              <div className="storage-mini-header">
                <div className="storage-mini-label">
                  <HardDrive size={13} />
                  <span>Storage</span>
                </div>
                <span className="storage-pct">
                  {storageLoading ? "—" : `${storagePercent.toFixed(0)}%`}
                </span>
              </div>
              <div className="storage-bar" role="progressbar"
                aria-valuenow={storagePercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="storage-progress"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="storage-detail">
                {storageLoading
                  ? "Calculating…"
                  : storage
                  ? `${formatBytes(storage.used)} of ${formatBytes(storage.total)}`
                  : "Storage unavailable"}
              </p>
            </div>

            {/* User + logout */}
            <div className="sidebar-user">
              <div className="sidebar-user-info">
                <div className="user-avatar small">{userInitial}</div>
                <div className="sidebar-user-text">
                  <p className="sidebar-user-name">{displayName}</p>
                  <p className="sidebar-user-email">{user?.email || ""}</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button logout-btn"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <motion.div
            className="page-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/folders/:folderId" element={<FolderDetails />} />
              <Route path="/sharing" element={<Sharing />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/recent" element={<Recent />} />
              <Route path="/starred" element={<Starred />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </AppContext.Provider>
  );
}

/* =========================================================
   APP ROOT
   ========================================================= */

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
<Route
  path="/*"
  element={
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  }
/>      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;