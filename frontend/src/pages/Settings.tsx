import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Shield,
  HardDrive,
  KeyRound,
  Save,
  Lock,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from "lucide-react";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
};

type StorageInfo = {
  total: number;
  used: number;
  available: number;
  percentage: number;
};

const API_BASE_URL = "http://localhost:8000/api";

const emptyProfile: UserProfile = {
  id: 0,
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  date_joined: "",
};

const emptyStorage: StorageInfo = {
  total: 0,
  used: 0,
  available: 0,
  percentage: 0,
};

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

function getInitials(profile: UserProfile): string {
  const first = profile.first_name.trim()[0] || "";
  const last = profile.last_name.trim()[0] || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return (
    profile.username.trim()[0] ||
    profile.email.trim()[0] ||
    "U"
  ).toUpperCase();
}

function extractApiError(data: any): string {
  if (!data) {
    return "Something went wrong.";
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object") {
    const fields = [
      "current_password",
      "new_password",
      "confirm_password",
      "password",
    ];

    for (const field of fields) {
      const value = data[field];

      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }

      if (typeof value === "string") {
        return value;
      }
    }
  }

  return "Something went wrong. Please try again.";
}

export default function Settings() {
  const [profile, setProfile] =
    useState<UserProfile>(emptyProfile);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [storage, setStorage] =
    useState<StorageInfo>(emptyStorage);

  const [storageLoading, setStorageLoading] =
    useState(true);

  const [storageError, setStorageError] =
    useState("");

  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================
     CHANGE PASSWORD
     ========================= */

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  /* =========================
     DELETE ACCOUNT
     ========================= */

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deletePassword, setDeletePassword] =
    useState("");

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState("");

  const initials = useMemo(
    () => getInitials(profile),
    [profile]
  );

  const storagePercentage =
    storage.total > 0
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

  useEffect(() => {
    loadProfile();
    loadStorage();
  }, []);

  /* =========================
     LOAD PROFILE
     ========================= */

  async function loadProfile() {
    try {
      setProfileLoading(true);
      setError("");

      const token = getAccessToken();

      if (!token) {
        setError(
          "Your session has expired. Please sign in again."
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/profile/`,
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
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        throw new Error(
          "Unable to load your profile."
        );
      }

      const data = await response.json();

      const loadedProfile: UserProfile = {
        id: data.id ?? 0,
        username: data.username ?? "",
        email: data.email ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        date_joined: data.date_joined ?? "",
      };

      setProfile(loadedProfile);
      setFirstName(loadedProfile.first_name);
      setLastName(loadedProfile.last_name);

      localStorage.setItem(
        "username",
        loadedProfile.username
      );

      localStorage.setItem(
        "email",
        loadedProfile.email
      );

      localStorage.setItem(
        "first_name",
        loadedProfile.first_name
      );

      localStorage.setItem(
        "last_name",
        loadedProfile.last_name
      );
    } catch (err) {
      console.error("Profile load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  /* =========================
     LOAD STORAGE
     ========================= */

  async function loadStorage() {
    try {
      setStorageLoading(true);
      setStorageError("");

      const token = getAccessToken();

      if (!token) {
        setStorageError(
          "Sign in again to view storage usage."
        );
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
          throw new Error(
            "Your session has expired. Please sign in again."
          );
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
    } catch (err) {
      console.error("Storage load error:", err);

      setStorageError(
        err instanceof Error
          ? err.message
          : "Unable to load storage information."
      );
    } finally {
      setStorageLoading(false);
    }
  }

  /* =========================
     SAVE PROFILE
     ========================= */

  async function handleSaveProfile(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaveMessage("");
    setError("");

    const token = getAccessToken();

    if (!token) {
      setError(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/profile/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to save profile changes."
        );
      }

      const updatedProfile: UserProfile = {
        id: data.id ?? profile.id,
        username:
          data.username ?? profile.username,
        email: data.email ?? profile.email,
        first_name:
          data.first_name ?? firstName.trim(),
        last_name:
          data.last_name ?? lastName.trim(),
        date_joined:
          data.date_joined ?? profile.date_joined,
      };

      setProfile(updatedProfile);
      setFirstName(updatedProfile.first_name);
      setLastName(updatedProfile.last_name);

      localStorage.setItem(
        "username",
        updatedProfile.username
      );

      localStorage.setItem(
        "email",
        updatedProfile.email
      );

      localStorage.setItem(
        "first_name",
        updatedProfile.first_name
      );

      localStorage.setItem(
        "last_name",
        updatedProfile.last_name
      );

      setSaveMessage(
        "Profile changes saved successfully."
      );
    } catch (err) {
      console.error("Profile save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save profile changes."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  /* =========================
     OPEN PASSWORD MODAL
     ========================= */

  function openPasswordModal() {
    setSaveMessage("");
    setError("");

    setPasswordError("");
    setPasswordMessage("");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowPasswordModal(true);
  }

  /* =========================
     CHANGE PASSWORD
     ========================= */

  async function handleChangePassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setPasswordError(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/change-password/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to change your password."
        );
      }

      setPasswordMessage(
        data.message ||
          "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMessage("");
      }, 1200);
    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setPasswordError(
        err instanceof Error
          ? err.message
          : "Unable to change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /* =========================
     OPEN DELETE MODAL
     ========================= */

  function openDeleteModal() {
    setDeletePassword("");
    setDeleteError("");
    setShowDeleteConfirm(true);
  }

  /* =========================
     DELETE ACCOUNT
     ========================= */

  async function handleDeleteAccount(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setDeleteError("");

    if (!deletePassword) {
      setDeleteError(
        "Enter your password to continue."
      );
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setDeleteError(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    try {
      setDeletingAccount(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/delete-account/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
         body: JSON.stringify({
  password: deletePassword,
  refresh_token:
    localStorage.getItem("refresh_token") ||
    sessionStorage.getItem("refresh_token") ||
    "",
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to delete your account."
        );
      }

      /*
       * Clear authentication and profile data.
       */

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");

      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("first_name");
      localStorage.removeItem("last_name");

      /*
       * Redirect to login after successful deletion.
       */

      window.location.href = "/login";
    } catch (err) {
      console.error(
        "Delete account error:",
        err
      );

      setDeleteError(
        err instanceof Error
          ? err.message
          : "Unable to delete your account."
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="settings-page">
      {/* HEADER */}

      <div className="settings-header">
        <div>
          <p className="settings-eyebrow">
            ACCOUNT
          </p>

          <h1>Settings</h1>

          <p className="settings-description">
            Manage your DocVault account, security and
            storage.
          </p>
        </div>
      </div>

      {/* GLOBAL FEEDBACK */}

      {(saveMessage || error) && (
        <div
          className={
            error
              ? "settings-feedback settings-feedback-error"
              : "settings-feedback"
          }
          role="status"
        >
          {error || saveMessage}
        </div>
      )}

      <div className="settings-layout">
        <main className="settings-main">

          {/* PROFILE */}

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <User size={18} />
              </div>

              <div>
                <h2>Profile</h2>

                <p>
                  Update the personal information
                  associated with your account.
                </p>
              </div>
            </div>

            <div className="settings-profile-preview">
              <div className="settings-avatar">
                {profileLoading
                  ? "…"
                  : initials}
              </div>

              <div>
                <strong>
                  {profileLoading
                    ? "Loading profile..."
                    : profile.first_name ||
                      profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`.trim()
                    : profile.username}
                </strong>

                <span>
                  {profileLoading
                    ? "Loading..."
                    : profile.email}
                </span>
              </div>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="settings-form"
            >
              <div className="settings-form-grid">

                <label className="settings-field">
                  <span>First name</span>

                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    placeholder="First name"
                    autoComplete="given-name"
                    disabled={profileLoading}
                  />
                </label>

                <label className="settings-field">
                  <span>Last name</span>

                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    placeholder="Last name"
                    autoComplete="family-name"
                    disabled={profileLoading}
                  />
                </label>

              </div>

              <div className="settings-field">
                <span>Username</span>

                <input
                  type="text"
                  value={profile.username}
                  disabled
                />

                <small>
                  Your username cannot be changed
                  from this page.
                </small>
              </div>

              <div className="settings-field">
                <span>Email address</span>

                <input
                  type="email"
                  value={profile.email}
                  disabled
                />

                <small>
                  Your account email is used for
                  authentication.
                </small>
              </div>

              <div className="settings-form-actions">
                <button
                  type="submit"
                  className="settings-primary-button"
                  disabled={
                    profileLoading ||
                    savingProfile
                  }
                >
                  <Save size={15} />

                  {savingProfile
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          {/* SECURITY */}

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <Shield size={18} />
              </div>

              <div>
                <h2>Security</h2>

                <p>
                  Manage your account credentials
                  and authentication.
                </p>
              </div>
            </div>

            <div className="settings-security-row">
              <div className="settings-row-icon">
                <KeyRound size={17} />
              </div>

              <div className="settings-row-content">
                <strong>Password</strong>

                <span>
                  Keep your account protected with a
                  strong password.
                </span>
              </div>

              <button
                type="button"
                className="settings-secondary-button"
                onClick={openPasswordModal}
              >
                Change password
              </button>
            </div>

            <div className="settings-security-row">
              <div className="settings-row-icon">
                <Lock size={17} />
              </div>

              <div className="settings-row-content">
                <strong>
                  Private workspace
                </strong>

                <span>
                  Your uploaded files are private by
                  default and protected by authenticated
                  access.
                </span>
              </div>

              <span className="settings-status-badge">
                Enabled
              </span>
            </div>
          </section>

          {/* STORAGE */}

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <HardDrive size={18} />
              </div>

              <div>
                <h2>Storage</h2>

                <p>
                  Monitor the space used by your
                  vault.
                </p>
              </div>

              <button
                type="button"
                className="settings-icon-button"
                onClick={loadStorage}
                disabled={storageLoading}
                title="Refresh storage"
                aria-label="Refresh storage"
              >
                <RefreshCw
                  size={16}
                  className={
                    storageLoading
                      ? "settings-spin"
                      : ""
                  }
                />
              </button>
            </div>

            {storageError ? (
              <div className="settings-storage-error">
                <span>{storageError}</span>

                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={loadStorage}
                  disabled={storageLoading}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="settings-storage-summary">

                  <div>
                    <span>
                      Used storage
                    </span>

                    <strong>
                      {storageLoading
                        ? "Loading..."
                        : formatBytes(
                            storage.used
                          )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Available
                    </span>

                    <strong>
                      {storageLoading
                        ? "Loading..."
                        : formatBytes(
                            storage.available
                          )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total capacity
                    </span>

                    <strong>
                      {storageLoading
                        ? "Loading..."
                        : formatBytes(
                            storage.total
                          )}
                    </strong>
                  </div>

                </div>

                <div className="settings-storage-bar">
                  <div
                    className="settings-storage-progress"
                    style={{
                      width: `${storagePercentage}%`,
                    }}
                  />
                </div>

                <div className="settings-storage-footer">
                  <span>
                    {storageLoading
                      ? "Calculating usage..."
                      : `${storagePercentage.toFixed(
                          2
                        )}% used`}
                  </span>

                  <span>
                    {storageLoading
                      ? ""
                      : `${formatBytes(
                          storage.total
                        )} capacity`}
                  </span>
                </div>
              </>
            )}
          </section>

          {/* DANGER ZONE */}

          <section className="settings-card settings-danger-card">
            <div className="settings-card-header">
              <div className="settings-card-icon settings-danger-icon">
                <AlertTriangle size={18} />
              </div>

              <div>
                <h2>Danger zone</h2>

                <p>
                  These actions can permanently
                  affect your DocVault account.
                </p>
              </div>
            </div>

            <div className="settings-danger-row">
              <div>
                <strong>
                  Delete account
                </strong>

                <span>
                  Permanently delete your account
                  and associated vault data.
                </span>
              </div>

              <button
                type="button"
                className="settings-danger-button"
                onClick={openDeleteModal}
              >
                <Trash2 size={15} />

                Delete account
              </button>
            </div>
          </section>
        </main>

        {/* SIDE PANEL */}

        <aside className="settings-side">

          <div className="settings-side-card">
            <p className="settings-side-label">
              ACCOUNT
            </p>

            <div className="settings-side-user">
              <div className="settings-avatar small">
                {profileLoading
                  ? "…"
                  : initials}
              </div>

              <div>
                <strong>
                  {profileLoading
                    ? "Loading..."
                    : profile.username}
                </strong>

                <span>
                  {profileLoading
                    ? ""
                    : profile.email}
                </span>
              </div>
            </div>

            <div className="settings-side-divider" />

            <div className="settings-side-item">
              <span>Workspace</span>

              <strong>Private</strong>
            </div>

            <div className="settings-side-item">
              <span>Storage</span>

              <strong>
                {storageLoading
                  ? "Loading..."
                  : `${storagePercentage.toFixed(
                      2
                    )}% used`}
              </strong>
            </div>

            <div className="settings-side-item">
              <span>Security</span>

              <strong>
                Protected
              </strong>
            </div>
          </div>

          <div className="settings-side-note">
            <Lock size={15} />

            <div>
              <strong>
                Your data stays private
              </strong>

              <p>
                Files in your vault are accessible
                only through authenticated access
                unless you explicitly share them.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================
          CHANGE PASSWORD MODAL
          ========================= */}

      {showPasswordModal && (
        <div
          className="settings-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !changingPassword
            ) {
              setShowPasswordModal(false);
            }
          }}
        >
          <div
            className="settings-modal settings-password-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <div className="settings-modal-icon">
              <KeyRound size={20} />
            </div>

            <h2 id="change-password-title">
              Change password
            </h2>

            <p>
              Enter your current password and choose a
              new password for your DocVault account.
            </p>

            <form
              className="settings-password-form"
              onSubmit={handleChangePassword}
            >
              <label className="settings-field">
                <span>Current password</span>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={changingPassword}
                  autoFocus
                />
              </label>

              <label className="settings-field">
                <span>New password</span>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={changingPassword}
                />
              </label>

              <label className="settings-field">
                <span>Confirm new password</span>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={changingPassword}
                />
              </label>

              {passwordError && (
                <div
                  className="settings-form-feedback settings-form-feedback-error"
                  role="alert"
                >
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div
                  className="settings-form-feedback"
                  role="status"
                >
                  {passwordMessage}
                </div>
              )}

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={() => {
                    if (!changingPassword) {
                      setShowPasswordModal(false);
                    }
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-primary-button"
                  disabled={changingPassword}
                >
                  <KeyRound size={15} />

                  {changingPassword
                    ? "Changing..."
                    : "Change password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          DELETE ACCOUNT MODAL
          ========================= */}

      {showDeleteConfirm && (
        <div
          className="settings-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !deletingAccount
            ) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="settings-modal-icon">
              <Trash2 size={20} />
            </div>

            <h2 id="delete-account-title">
              Delete your account?
            </h2>

            <p>
              This action is permanent. Your account,
              folders, files and associated vault data
              will be deleted.
            </p>

            <form
              onSubmit={handleDeleteAccount}
              className="settings-password-form"
            >
              <label className="settings-field">
                <span>
                  Enter your password to confirm
                </span>

                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) =>
                    setDeletePassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={deletingAccount}
                  autoFocus
                />
              </label>

              {deleteError && (
                <div
                  className="settings-form-feedback settings-form-feedback-error"
                  role="alert"
                >
                  {deleteError}
                </div>
              )}

              <div className="settings-delete-warning">
                <AlertTriangle size={16} />

                <span>
                  This cannot be undone once the account
                  is deleted.
                </span>
              </div>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={() => {
                    if (!deletingAccount) {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                      setDeleteError("");
                    }
                  }}
                  disabled={deletingAccount}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-danger-button"
                  disabled={deletingAccount}
                >
                  <Trash2 size={15} />

                  {deletingAccount
                    ? "Deleting..."
                    : "Delete account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}