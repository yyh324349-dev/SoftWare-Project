// ============================================================
// MoZhi Academy — AppShell Layout
// ============================================================

import { NavLink, Outlet } from 'react-router-dom';
import './AppShell.css';

const navItems = [
  { to: '/dashboard', icon: '📊', label: '仪表盘' },
  { to: '/courses', icon: '📚', label: '课程' },
  { to: '/report', icon: '📈', label: '学习报告' },
  { to: '/certificates', icon: '🏆', label: '证书' },
  { to: '/settings', icon: '⚙️', label: '设置' },
];

export default function AppShell() {
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🎓</span>
          <span className="logo-text">墨智学堂</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link-active' : ''}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-version">v0.1.0</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
