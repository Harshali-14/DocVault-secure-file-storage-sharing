import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <main className="auth-page">
      {/* LEFT PANEL */}
      <section className="auth-brand-panel">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark">D</span>
          <span>DocVault</span>
        </Link>

        <motion.div
          className="auth-brand-content"
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
            A private workspace for storing, organizing and managing
            your important documents with security built into every
            layer.
          </p>
        </motion.div>

        <div className="auth-brand-footer">
          Secure workspace · DocVault
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="auth-form-panel">
        <motion.div
          className="auth-form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <button
            type="button"
            className="auth-back-home"
            onClick={() => navigate("/")}
          >
            ← Back to home
          </button>

          <div className="auth-form-header">
            <span className="section-label">
              SECURE ACCESS
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in to access your private vault.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="username">
                Username
              </label>

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

            <div className="auth-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="auth-password-wrapper">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="auth-divider">
            <span>New to DocVault?</span>
          </div>

          <p className="auth-switch">
            Don't have an account?
            <Link to="/register"> Create your vault</Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}

export default Login;