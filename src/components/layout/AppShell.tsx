// ============================================================
// MoZhi Academy — AppShell Layout
// ============================================================

import { Outlet } from 'react-router-dom';
import './AppShell.css';

export default function AppShell() {
  return (
    <div className="app-shell">
      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
