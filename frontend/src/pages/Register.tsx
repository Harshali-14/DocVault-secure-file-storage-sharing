import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register/", {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login");
    } catch (err: any) {
      const backendError = err.response?.data?.error;

      if (typeof backendError === "object") {
        const messages = Object.values(backendError)
          .flat()
          .join(" ");

        setError(messages || "Registration failed.");
      } else if (typeof backendError === "string") {
        setError(backendError);
      } else {
        setError("Registration failed. Please try again.");
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
            Build your
            <br />
            private vault.
          </h1>

          <p>
            Keep your documents organized in one secure workspace
            designed around privacy, access control and simplicity.
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
              GET STARTED
            </span>

            <h2>Create your vault</h2>

            <p>
              Create an account and start managing your documents
              securely.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="register-username">
                Username
              </label>

              <input
                id="register-username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Choose a username"
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">
                Email
              </label>

              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">
                Password
              </label>

              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
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
              {loading
                ? "Creating vault..."
                : "Create account"}
            </button>
          </form>

          <div className="register-benefits">
            <div className="register-benefit">
              Private storage
            </div>

            <div className="register-benefit">
              Secure access
            </div>

            <div className="register-benefit">
              Organized files
            </div>
          </div>

          <div className="auth-divider">
            <span>Already registered?</span>
          </div>

          <p className="auth-switch">
            Already have an account?
            <Link to="/login"> Sign in</Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}