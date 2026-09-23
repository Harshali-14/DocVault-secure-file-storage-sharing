
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  HardDrive,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     PASSWORD STRENGTH
     ========================================================= */

  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        label: "",
      };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ["", "Weak", "Fair", "Good", "Strong"];

    return {
      score,
      label: labels[score],
    };
  }, [password]);

  /* =========================================================
     REGISTER
     ========================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
    <main className="auth-page register-page">
      {/* =====================================================
          BACKGROUND DECORATION
          ===================================================== */}

      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />

      <div className="auth-floating-file auth-file-one">
        <FileText size={15} />
        <span>documents.pdf</span>
      </div>

      <div className="auth-floating-file auth-file-two">
        <FileText size={15} />
        <span>projects.pdf</span>
      </div>

      {/* =====================================================
          BRAND
          ===================================================== */}

      <Link to="/" className="auth-brand">
        <span className="auth-brand-mark">D</span>

        <span>DocVault</span>
      </Link>

      {/* =====================================================
          LEFT VISUAL PANEL
          ===================================================== */}

      <section className="auth-brand-panel">
        <motion.div
          className="auth-brand-content"
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.55,
            ease: "easeOut",
          }}
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

        {/* ===================================================
            VAULT VISUAL
            =================================================== */}

        <motion.div
          className="auth-vault-visual"
          initial={{
            opacity: 0,
            scale: 0.92,
            y: 25,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: "easeOut",
          }}
        >
          <div className="vault-glow" />

          <motion.div
            className="vault-document document-back"
            animate={{
              y: [0, -6, 0],
              rotate: [-3, -2, -3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="vault-document-top">
              <FileText size={17} />
              <span>PROJECTS</span>
            </div>

            <div className="document-lines">
              <span />
              <span />
              <span />
            </div>
          </motion.div>

          <motion.div
            className="vault-document document-front"
            animate={{
              y: [0, 5, 0],
              rotate: [2, 1, 2],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="vault-document-top">
              <FileText size={17} />
              <span>RESUME</span>
            </div>

            <div className="document-lines">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="document-protected">
              <ShieldCheck size={12} />
              <span>Protected</span>
            </div>
          </motion.div>

          <motion.div
            className="vault-status"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="status-dot" />
            <span>PRIVATE VAULT</span>
          </motion.div>
        </motion.div>

        {/* ===================================================
            FEATURES
            =================================================== */}

        <motion.div
          className="auth-feature-row"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.35,
          }}
        >
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Lock size={14} />
            </div>

            <div>
              <strong>Private by default</strong>
              <span>Your files stay yours.</span>
            </div>
          </div>

          <div className="auth-feature">
            <div className="auth-feature-icon">
              <HardDrive size={14} />
            </div>

            <div>
              <strong>5 GB storage</strong>
              <span>Start with your private vault.</span>
            </div>
          </div>
        </motion.div>

        <div className="auth-brand-footer">
          Secure workspace · DocVault
        </div>
      </section>

      {/* =====================================================
          FORM PANEL
          ===================================================== */}

      <section className="auth-form-panel">
        <motion.div
          className="auth-form-container register-form-container"
          initial={{
            opacity: 0,
            y: 24,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
        >
          {/* TOP META */}

          <div className="auth-card-top">
            <button
              type="button"
              className="auth-back-home"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={14} />
              Back to home
            </button>

            <div className="auth-online-status">
              <span />
              Secure
            </div>
          </div>

          {/* HEADER */}

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

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            {/* USERNAME */}

            <div className="auth-field">
              <label htmlFor="register-username">
                Username
              </label>

              <div className="auth-input-wrapper">
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

                {username.trim() && (
                  <motion.span
                    className="input-valid"
                    initial={{
                      opacity: 0,
                      scale: 0.7,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                  >
                    <Check size={13} />
                  </motion.span>
                )}
              </div>
            </div>

            {/* EMAIL */}

            <div className="auth-field">
              <label htmlFor="register-email">
                Email address
              </label>

              <div className="auth-input-wrapper">
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

                {email.includes("@") && (
                  <motion.span
                    className="input-valid"
                    initial={{
                      opacity: 0,
                      scale: 0.7,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                  >
                    <Check size={13} />
                  </motion.span>
                )}
              </div>
            </div>

            {/* PASSWORD */}

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="register-password">
                  Password
                </label>

                {passwordStrength.label && (
                  <motion.span
                    className={`password-strength strength-${passwordStrength.score}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {passwordStrength.label}
                  </motion.span>
                )}
              </div>

              <div className="auth-password-wrapper">
                <input
                  id="register-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
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
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>

              {/* PASSWORD STRENGTH */}

              {password && (
                <motion.div
                  className="password-meter"
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                  }}
                >
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={
                        level <= passwordStrength.score
                          ? "filled"
                          : ""
                      }
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* CONFIRM PASSWORD */}

            <div className="auth-field">
              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="auth-password-wrapper">
                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <motion.div
                  className={`password-match ${
                    password === confirmPassword
                      ? "matched"
                      : "not-matched"
                  }`}
                  initial={{
                    opacity: 0,
                    y: -3,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  {password === confirmPassword ? (
                    <>
                      <Check size={12} />
                      Passwords match
                    </>
                  ) : (
                    "Passwords do not match"
                  )}
                </motion.div>
              )}
            </div>

            {/* ERROR */}

            {error && (
              <motion.div
                className="auth-error"
                role="alert"
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                {error}
              </motion.div>
            )}

            {/* SUBMIT */}

            <motion.button
              type="submit"
              className="auth-submit"
              disabled={loading}
              whileHover={
                !loading
                  ? {
                      y: -2,
                    }
                  : undefined
              }
              whileTap={
                !loading
                  ? {
                      scale: 0.985,
                    }
                  : undefined
              }
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Creating vault...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>
          </form>

          {/* BENEFITS */}

          <div className="register-benefits">
            <div className="register-benefit">
              <ShieldCheck size={14} />
              <span>Private storage</span>
            </div>

            <div className="register-benefit">
              <Lock size={14} />
              <span>Secure access</span>
            </div>

            <div className="register-benefit">
              <Sparkles size={14} />
              <span>5 GB included</span>
            </div>
          </div>

          {/* DIVIDER */}

          <div className="auth-divider">
            <span>Already registered?</span>
          </div>

          <p className="auth-switch">
            Already have an account?
            <Link to="/login"> Sign in</Link>
          </p>

          {/* PRIVACY NOTE */}

          <div className="auth-security-note">
            <ShieldCheck size={13} />

            <span>
              Your workspace is private and protected by
              authenticated access.
            </span>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
