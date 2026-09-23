
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        username: username.trim(),
        password,
      });

      const accessToken = response.data?.access;
      const refreshToken = response.data?.refresh;

      if (!accessToken || !refreshToken) {
        setError(
          "Login succeeded, but authentication tokens were not returned."
        );
        return;
      }

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const responseData = err.response?.data;

      if (responseData?.error) {
        setError(
          typeof responseData.error === "string"
            ? responseData.error
            : "Login failed. Please check your credentials."
        );
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else {
        setError(
          "Unable to sign in. Please check your username and password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dv-auth-page">
      {/* Background atmosphere */}
      <div className="dv-auth-grid" />
      <div className="dv-auth-glow dv-auth-glow-one" />
      <div className="dv-auth-glow dv-auth-glow-two" />

      {/* Brand */}
      <Link to="/" className="dv-auth-brand">
        <span className="dv-auth-brand-icon">
          <Shield size={15} />
        </span>
        <span>DocVault</span>
      </Link>

      {/* Back */}
      <motion.button
        type="button"
        className="dv-auth-back"
        onClick={() => navigate("/")}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
      >
        <ArrowRight size={14} className="dv-auth-back-icon" />
        Back to home
      </motion.button>

      <div className="dv-auth-layout">
        {/* =====================================================
            LEFT VISUAL
           ===================================================== */}

        <motion.section
          className="dv-auth-visual"
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div className="dv-auth-eyebrow">
            <span className="dv-status-dot" />
            PRIVATE FILE MANAGEMENT
          </div>

          <h1>
            Your files.
            <br />
            <span>Your control.</span>
          </h1>

          <p className="dv-auth-description">
            A private workspace for storing, organizing and managing
            important documents with security built into every layer.
          </p>

          {/* Floating vault */}
          <div className="dv-vault-scene">
            <motion.div
              className="dv-vault-orbit orbit-one"
              animate={{ rotate: 360 }}
              transition={{
                duration: 24,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            <motion.div
              className="dv-vault-orbit orbit-two"
              animate={{ rotate: -360 }}
              transition={{
                duration: 32,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            <motion.div
              className="dv-floating-file file-one"
              animate={{
                y: [0, -9, 0],
                rotate: [-2, 1, -2],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <FileText size={17} />
              <span>resume.pdf</span>
            </motion.div>

            <motion.div
              className="dv-floating-file file-two"
              animate={{
                y: [0, 8, 0],
                rotate: [2, -1, 2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.7,
              }}
            >
              <FileText size={17} />
              <span>projects.pdf</span>
            </motion.div>

            <motion.div
              className="dv-vault-card"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="dv-vault-top">
                <div className="dv-vault-lock">
                  <Lock size={18} />
                </div>

                <div>
                  <span>PRIVATE VAULT</span>
                  <strong>Protected</strong>
                </div>

                <Sparkles size={16} />
              </div>

              <div className="dv-vault-divider" />

              <div className="dv-vault-files">
                <div>
                  <span>Documents</span>
                  <strong>24</strong>
                </div>

                <div>
                  <span>Storage</span>
                  <strong>8.7 MB</strong>
                </div>
              </div>

              <div className="dv-vault-progress">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "24%" }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5,
                    ease: "easeOut",
                  }}
                />
              </div>

              <div className="dv-vault-footer">
                <span>
                  <Check size={11} />
                  End-to-end private workspace
                </span>

                <span>0.17%</span>
              </div>
            </motion.div>
          </div>

          <div className="dv-auth-points">
            <span>
              <Check size={13} />
              Private by default
            </span>

            <span>
              <Check size={13} />
              Secure sharing
            </span>

            <span>
              <Check size={13} />
              Activity tracking
            </span>
          </div>
        </motion.section>

        {/* =====================================================
            RIGHT FORM
           ===================================================== */}

        <motion.section
          className="dv-auth-card"
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.55,
            delay: 0.12,
          }}
        >
          <div className="dv-auth-card-top">
            <div className="dv-auth-card-icon">
              <Lock size={17} />
            </div>

            <span>SECURE ACCESS</span>

            <div className="dv-auth-live">
              <span />
              Online
            </div>
          </div>

          <div className="dv-auth-heading">
            <h2>Welcome back</h2>

            <p>
              Sign in to continue to your private workspace.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="dv-auth-form"
          >
            <div className="dv-auth-field">
              <label htmlFor="username">
                Username
              </label>

              <div className="dv-auth-input-wrap">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="dv-auth-field">
              <div className="dv-auth-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <span>Protected</span>
              </div>

              <div className="dv-auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="dv-password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                className="dv-auth-error"
                role="alert"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="dv-auth-submit"
              disabled={loading}
              whileHover={!loading ? { y: -2 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
            >
              <span>
                {loading ? "Authenticating..." : "Sign in"}
              </span>

              {!loading && <ArrowRight size={16} />}
            </motion.button>
          </form>

          <div className="dv-auth-security">
            <Shield size={14} />

            <span>
              Your workspace is private and protected by
              authenticated access.
            </span>
          </div>

          <div className="dv-auth-divider">
            <span>NEW TO DOCVAULT?</span>
          </div>

          <div className="dv-auth-register">
            <div>
              <strong>Create your vault</strong>
              <span>
                Start with 5 GB of private storage.
              </span>
            </div>

            <Link to="/register">
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.section>
      </div>

      <div className="dv-auth-footer">
        <span>DOCVAULT</span>
        <span>Secure private document management.</span>
      </div>
    </main>
  );
}

export default Login;
