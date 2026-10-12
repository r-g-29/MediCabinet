import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountModal from './AccountModal';
import NotificationDropdown from './NotificationDropdown';
import './AppLayout.css';

const NAV_LINKS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/profiles',  icon: '👨‍👩‍👧', label: 'Profiles' },
  { to: '/medicines', icon: '💊', label: 'Medicines' },
  { to: '/schedules', icon: '🗓️', label: 'Schedules' },
  { to: '/emergency', icon: '🚨', label: 'Emergency Card' },
];



/* ── Inline Profile Dropdown ───────────────────────────── */
const ProfileDropdown = ({ user, initials, onLogout, onManageAccount }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="profile-menu-container" ref={ref}>
      <button
        className="profile-menu-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-label="Account menu"
        id="btn-profile-menu"
        title="Manage account info"
      >
        <span className="topbar-avatar">{initials}</span>
        <span className="topbar-name">{user?.name?.split(' ')[0] || 'Account'}</span>
        <span className="topbar-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="profile-dropdown">
          {/* User info header */}
          <div className="profile-dropdown-header">
            <div className="pd-avatar">{initials}</div>
            <div className="pd-meta">
              <div className="pd-name">{user?.name}</div>
              <div className="pd-email">{user?.email}</div>
              <span className="pd-badge">Account Owner</span>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Account Actions */}
          <div className="profile-dropdown-actions">
            <button
              className="pd-action-btn pd-manage-btn"
              onClick={() => {
                setOpen(false);
                onManageAccount();
              }}
              id="btn-manage-account"
            >
              <span className="pd-action-icon">⚙️</span>
              <div className="pd-action-text">
                <span className="pd-action-title">Manage Account Info</span>
                <span className="pd-action-desc">Update profile & security</span>
              </div>
            </button>

            <button
              className="pd-action-btn"
              onClick={() => {
                setOpen(false);
                navigate('/profiles');
              }}
              id="btn-shortcut-profiles"
            >
              <span className="pd-action-icon">👨‍👩‍👧</span>
              <div className="pd-action-text">
                <span className="pd-action-title">Family Profiles</span>
                <span className="pd-action-desc">Manage family members</span>
              </div>
            </button>

            <button
              className="pd-action-btn"
              onClick={() => {
                setOpen(false);
                navigate('/emergency');
              }}
              id="btn-shortcut-emergency"
            >
              <span className="pd-action-icon">🚨</span>
              <div className="pd-action-text">
                <span className="pd-action-title">Emergency Card</span>
                <span className="pd-action-desc">Medical emergency data</span>
              </div>
            </button>
          </div>

          <div className="profile-dropdown-divider" />

          <button className="pd-logout-btn" onClick={onLogout} id="btn-topbar-logout">
            🚪 Sign out
          </button>
        </div>
      )}
    </div>
  );
};


/* ── App Layout ────────────────────────────────────────── */
const AppLayout = () => {
  const { user, logout } = useAuth();
  // Desktop collapsed state: when collapsed, shows only icons and hides names
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mc_sidebar_collapsed') === 'true';
    }
    return false;
  });
  // Mobile drawer open state (< 768px)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('mc_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Derive current page title for top-bar
  const currentLink = NAV_LINKS.find((l) => location.pathname.startsWith(l.to));
  const pageTitle = currentLink ? `${currentLink.icon} ${currentLink.label}` : 'MediCabinet';

  return (
    <div
      className={`layout ${
        collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
      }`}
    >
      {/* Mobile Drawer Backdrop (only on small screens when open) */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : 'expanded'} ${
          mobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Main navigation"
        id="app-sidebar"
      >
        {/* Interactive Brand Header (Clean – No annoying cross next to logo) */}
        <div className="sidebar-header">
          <Link
            to="/dashboard"
            className="sidebar-logo interactive-logo"
            title="MediCabinet Dashboard"
            id="brand-logo-link"
          >
            <div className="sidebar-logo-icon">
              <span className="logo-pill">💊</span>
              <span className="logo-pulse-glow"></span>
            </div>
            {!collapsed && (
              <div className="sidebar-logo-info">
                <div className="sidebar-logo-text">
                  Medi<span className="logo-accent">Cabinet</span>
                </div>
                <div className="sidebar-logo-sub">Family Health Vault</div>
              </div>
            )}
          </Link>

          {/* Close button strictly on mobile drawer only */}
          <button
            className="sidebar-mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            id="btn-sidebar-mobile-close"
          >
            ✕
          </button>
        </div>

        {/* Navigation links */}
        <div className="sidebar-nav-container">
          {!collapsed && <div className="sidebar-section-label">MAIN NAVIGATION</div>}
          <nav className="sidebar-nav">
            {NAV_LINKS.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                title={collapsed ? label : undefined}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setMobileOpen(false);
                  }
                }}
              >
                <span className="sidebar-link-icon">{icon}</span>
                {!collapsed && <span className="sidebar-link-label">{label}</span>}
                {collapsed && <span className="sidebar-tooltip">{label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer with Collapse/Expand Toggle Button (No Emergency Helpline box) */}
        <div className="sidebar-footer">
          <button
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            id="btn-sidebar-collapse"
          >
            <span className="collapse-arrow-icon">{collapsed ? '▶' : '◀'}</span>
            {!collapsed && <span className="collapse-btn-text">Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      {/* ── Page Content & Top Bar ── */}
      <div className="main-content">
        {/* ── Top Bar ── */}
        <div className="top-bar">
          {/* Left: toggle button + page title */}
          <div className="top-bar-left">
            <button
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              id="btn-sidebar-toggle"
            >
              <span className="toggle-hamburger-icon">☰</span>
            </button>

            <span className="top-bar-page-title">{pageTitle}</span>
          </div>

          {/* Right: Notification bell + Profile menu placed at top right corner */}
          <div className="top-bar-right">
            <NotificationDropdown />
            <ProfileDropdown
              user={user}
              initials={initials}
              onLogout={handleLogout}
              onManageAccount={() => setAccountModalOpen(true)}
            />
          </div>
        </div>

        <div className="page-content">
          <Outlet />
        </div>

        <footer className="app-footer">
          ⚕️ MediCabinet is a <strong>tracking and reminder tool</strong>, not medical advice.
          Always consult a qualified healthcare professional before making any medical decisions.
        </footer>
      </div>

      {/* Account Info Management Modal */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;



