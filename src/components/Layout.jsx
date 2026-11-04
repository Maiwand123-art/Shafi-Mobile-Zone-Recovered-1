import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Smartphone,
  Search,
  UserRound,
  LogOut,
  LayoutDashboard,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { publicPages } from "../data/pages";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(isAdmin ? "/admin" : user ? "/account" : "/");
    }
  }

  async function logout() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="icon-button navbar-back"
          onClick={goBack}
          title="Go back"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <Link to="/" className="brand">
          <span className="brand-mark">
            <Smartphone size={22} />
          </span>
          <span>
            SHAFI <b>MOBILE ZONE</b>
            <small>SMARTER CHOICE. BETTER VALUE.</small>
          </span>
        </Link>

        <nav className={open ? "nav-links open" : "nav-links"}>
          {publicPages.slice(0, 6).map(([name, path]) => (
            <NavLink key={path} to={path} onClick={() => setOpen(false)}>
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="top-actions">
          <Link className="icon-button" to="/mobiles" aria-label="Search">
            <Search size={18} />
          </Link>

          {user ? (
            <>
              <Link
                className="icon-button"
                to={isAdmin ? "/admin" : "/account"}
                title="Dashboard"
              >
                {isAdmin ? (
                  <LayoutDashboard size={18} />
                ) : (
                  <UserRound size={18} />
                )}
              </Link>

              <button className="icon-button" onClick={logout} title="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link className="button button-small" to="/login">
              Sign in
            </Link>
          )}

          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">
              <Smartphone />
            </span>
            <span>
              SHAFI <b>MOBILE ZONE</b>
              <small>YOUR TRUSTED MOBILE STORE</small>
            </span>
          </div>
          <p>Find your next phone with confidence.</p>
        </div>

        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>

        <small>
          © {new Date().getFullYear()} Shafi Mobile Zone. All rights reserved.
        </small>
      </footer>
    </div>
  );
}
