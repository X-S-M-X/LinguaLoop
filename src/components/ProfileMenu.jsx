import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import { getProfileInitials } from "../lib/profileHelpers.js";
import { uploadAvatar } from "../lib/avatarUpload.js";
import { supabase } from "../lib/supabaseClient.js";
import AppIcon from "./AppIcon.jsx";

export default function ProfileMenu({ compact = false }) {
  const { user, signOut } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const root = useRef(null);
  const trigger = useRef(null);
  const input = useRef(null);
  const panelId = useId();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    function resize() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  async function changePicture(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy("upload");
    setError("");
    setMessage("");
    try {
      await uploadAvatar(supabase, user?.id, file);
      await refreshProfile();
      setMessage("Profile picture updated.");
    } catch (err) {
      setError(
        err.message || "Your picture could not be uploaded. Please try again.",
      );
    } finally {
      setBusy("");
    }
  }
  async function logout() {
    setBusy("logout");
    setError("");
    setMessage("");
    try {
      const { error: logoutError } = await signOut();
      if (logoutError) throw logoutError;
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "We couldn’t log you out. Please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div
      className={`profile-menu${compact ? " profile-menu--compact" : ""}`}
      ref={root}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
    >
      <button
        type="button"
        className="profile-menu__trigger sidebar-user"
        ref={trigger}
        aria-label="Open profile options"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open);
          setError("");
          setMessage("");
        }}
      >
        <span className="nav-avatar" aria-hidden="true">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            getProfileInitials(profile?.display_name, user?.email)
          )}
        </span>
        {!compact && (
          <>
            <span className="sidebar-user__details">
              <strong>
                {profile?.display_name || profile?.username || "Learner"}
              </strong>
              <span>
                {profile?.username
                  ? `@${profile.username}`
                  : "Your learning account"}
              </span>
            </span>
            <AppIcon name="arrow" size={16} />
          </>
        )}
      </button>
      <input
        ref={input}
        type="file"
        aria-label="Choose profile picture"
        hidden
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={changePicture}
        disabled={Boolean(busy)}
      />
      {open && (
        <div
          className="profile-menu__panel"
          id={panelId}
          role="region"
          aria-label="Profile options"
        >
          <strong className="profile-menu__title">Your account</strong>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={Boolean(busy)}
          >
            <AppIcon name="profile" size={18} />
            {busy === "upload"
              ? "Uploading picture…"
              : "Change profile picture"}
          </button>
          <Link to="/settings">
            <AppIcon name="settings" size={18} />
            Profile settings
          </Link>
          <button type="button" onClick={logout} disabled={Boolean(busy)}>
            <AppIcon name="logout" size={18} />
            {busy === "logout" ? "Logging out…" : "Log out"}
          </button>
          {error && (
            <p className="profile-menu__error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="profile-menu__success" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
