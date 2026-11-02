import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ProfileMenu from "./ProfileMenu.jsx";
import AppIcon from "./AppIcon.jsx";

const items = [
  { to: "/dashboard", label: "Learn", icon: "learn" },
  { to: "/practice", label: "Practice", icon: "target" },
  { to: "/courses", label: "Courses", icon: "cards" },
  { to: "/progress", label: "Progress", icon: "progress" },
  { to: "/settings", label: "Settings", icon: "settings" },
];
export default function NavBar() {
  const { session } = useAuth();
  const location = useLocation();
  const brand = (
    <>
      <span className="brand__mark">L</span>
      <span>LinguaLoop</span>
    </>
  );
  if (!session || location.pathname === "/home")
    return (
      <header className="public-nav">
        <Link to="/home" className="brand" aria-label="LinguaLoop home">
          {brand}
        </Link>
        <nav className="public-nav__links" aria-label="Public navigation">
          {session ? (
            <Link
              to="/dashboard"
              className="button button--primary button--small"
            >
              Back to learning
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-link">
                Log in
              </Link>
              <Link
                to="/signup"
                className="button button--primary button--small"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>
    );
  const inLesson = location.pathname.startsWith("/lessons/");
  const practiceLesson =
    inLesson &&
    ["ai", "review"].includes(
      new URLSearchParams(location.search).get("activity"),
    );
  const active = (item, isActive) =>
    isActive ||
    (item.to === "/dashboard" && inLesson && !practiceLesson) ||
    (item.to === "/practice" && practiceLesson);
  return (
    <>
      <aside className="app-sidebar">
        <Link
          to="/dashboard"
          className="brand"
          aria-label="LinguaLoop learning dashboard"
        >
          {brand}
        </Link>
        <nav className="app-sidebar__nav" aria-label="App navigation">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `app-nav-link${active(item, isActive) ? " app-nav-link--active" : ""}`
              }
            >
              <AppIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__profile">
          <ProfileMenu />
          <Link to="/home" className="sidebar-about">
            About LinguaLoop
          </Link>
        </div>
      </aside>
      <header className="mobile-app-header">
        <Link to="/dashboard" className="brand">
          {brand}
        </Link>
        <ProfileMenu compact />
      </header>
      <nav className="mobile-bottom-nav" aria-label="Mobile app navigation">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `mobile-nav-link${active(item, isActive) ? " mobile-nav-link--active" : ""}`
            }
          >
            <AppIcon name={item.icon} size={21} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
