import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, Smartphone, Search, UserRound, LogOut, LayoutDashboard,
  ArrowLeft, Sun, Moon, Monitor, Plus, ShoppingCart, History,
  Users, MessageSquare, Inbox, CreditCard, BarChart3, Settings, Globe,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { publicPages } from "../data/pages";

const adminNavigation = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Mobiles & Stock", path: "/admin/mobiles", icon: Smartphone },
  { label: "Add Mobile", path: "/admin/mobiles/new", icon: Plus },
  { label: "Sales", path: "/admin/sales", icon: ShoppingCart },
  { label: "Sold History", path: "/admin/sold-mobiles", icon: History },
  { label: "Loans", path: "/admin/loans", icon: CreditCard },
  { label: "Requests", path: "/admin/requests", icon: Inbox },
  { label: "Messages", path: "/admin/messages", icon: MessageSquare },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const themeOptions = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "midnight", label: "Midnight", icon: Monitor },
  { value: "ocean", label: "Ocean", icon: Monitor },
  { value: "emerald", label: "Emerald", icon: Monitor },
  { value: "sunset", label: "Sunset", icon: Sun },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("shafi-theme") || "dark"; }
    catch { return "dark"; }
  });
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");

  // Keep browser Back navigation inside the Admin Dashboard.
  useEffect(() => {
    if (!isAdminArea || !isAdmin) return;

    const keepAdminDashboard = () => {
      navigate("/admin");
    };

    window.addEventListener("popstate", keepAdminDashboard);

    return () => {
      window.removeEventListener("popstate", keepAdminDashboard);
    };
  }, [isAdminArea, isAdmin, navigate]);

  useEffect(() => {
    try { localStorage.setItem("shafi-theme", theme); } catch {}
  }, [theme]);

  function cycleTheme() {
    const index = themeOptions.findIndex((item) => item.value === theme);
    setTheme(themeOptions[(index + 1) % themeOptions.length].value);
  }

  function goBack() {
    if (isAdminArea) {
      if (location.pathname !== "/admin") navigate("/admin");
      return;
    }

    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(isAdmin ? "/admin" : user ? "/account" : "/");
  }

  async function logout() {
    await signOut();
    navigate("/");
  }

  const ThemeIcon = themeOptions.find((item) => item.value === theme)?.icon || Moon;

  return (
    <div className="app-shell" data-theme={theme}>
      <header className={`topbar ${isAdminArea ? "topbar-admin" : ""}`}>
        <button className="icon-button navbar-back" onClick={goBack} title="Go back" aria-label="Go back">
          <ArrowLeft size={19} />
        </button>
        <Link to="/" className="brand">
          <span className="brand-mark"><Smartphone size={21} /></span>
          <span>SHAFI <b>MOBILE ZONE</b><small>{isAdminArea ? "ADMIN CONTROL CENTER" : "SMARTER CHOICE. BETTER VALUE."}</small></span>
        </Link>

        {!isAdminArea && (
          <nav className={open ? "nav-links open" : "nav-links"}>
            {publicPages.slice(0, 6).map(([name, path]) => (
              <NavLink key={path} to={path} onClick={() => setOpen(false)}>{name}</NavLink>
            ))}
          </nav>
        )}

        <div className="top-actions">
          <button className="icon-button theme-toggle" onClick={cycleTheme} title={`Theme: ${theme}. Click to change`} aria-label="Change theme">
            <ThemeIcon size={17} />
          </button>
          {!isAdminArea && <Link className="icon-button" to="/mobiles" aria-label="Search"><Search size={18} /></Link>}
          {user ? (
            <>
              <Link className="icon-button" to={isAdmin ? "/admin" : "/account"} title="Dashboard">
                {isAdmin ? <LayoutDashboard size={18} /> : <UserRound size={18} />}
              </Link>
              <button className="icon-button" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
            </>
          ) : (
            <div className="auth-nav-actions">
              <Link className="button button-small button-ghost" to="/login">Sign in</Link>
              <Link className="button button-small" to="/signup">Sign up</Link>
            </div>
          )}
          {!isAdminArea && <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>}
        </div>
      </header>

      {isAdminArea ? (
        <div className="admin-shell">
          <aside className={`admin-sidebar ${open ? "sidebar-open" : ""}`}>
            <div className="sidebar-label">WORKSPACE</div>
            <nav className="admin-nav">
              {adminNavigation.map(({ label, path, icon: Icon, end }) => (
                <NavLink key={path} to={path} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}>
                  <Icon size={17} /><span>{label}</span>
                  {path === "/admin/mobiles/new" && <span className="sidebar-plus">+</span>}
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-store-card glass">
              <span className="sidebar-store-icon"><Globe size={17} /></span>
              <b>Shafi Mobile Zone</b>
              <small>Kote Sangi Â· Kabul</small>
              <a href="https://wa.me/93782550555" target="_blank" rel="noreferrer">Contact support â†—</a>
            </div>
          </aside>
          <main className="admin-content">
            <div className="admin-mobile-bar">
              <button className="icon-button" onClick={() => setOpen(!open)} aria-label="Open admin navigation"><Menu size={18} /></button>
              <span>Admin workspace</span>
              <span className="admin-online-dot">â— Online</span>
            </div>
            <Outlet />
          </main>
        </div>
      ) : (
        <main><Outlet /></main>
      )}

      {!isAdminArea && (
        <footer className="footer">
          <div>
            <div className="brand footer-brand">
              <span className="brand-mark"><Smartphone /></span>
              <span>SHAFI <b>MOBILE ZONE</b><small>YOUR TRUSTED MOBILE STORE</small></span>
            </div>
            <p>Discover quality smartphones with clear details and personal support.</p>
            <div className="footer-contact">
              <a href="tel:0782550555">0782550555</a>
              <a href="https://wa.me/93782550555" target="_blank" rel="noreferrer">WhatsApp support</a>
              <span>Kabul, Kote Sangi, Fazli Market, Shop No. 80</span>
            </div>
          </div>
          <div className="footer-links">
            <Link to="/about">About</Link><Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link>
          </div>
          <small>Â© {new Date().getFullYear()} Shafi Mobile Zone. All rights reserved.</small>
        </footer>
      )}
    </div>
  );
}

