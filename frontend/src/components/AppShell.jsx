import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, FileText, Plus, LayoutTemplate, User } from 'lucide-react';
import { isDemoMode } from '../api';
import './AppShell.css';

const AppShell = () => {
  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Notes', path: '/notes', icon: FileText },
    { name: 'Create', path: '/create', icon: Plus, isMain: true },
    { name: 'Templates', path: '/templates', icon: LayoutTemplate },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar — tablet/desktop only */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">DW</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''} ${item.isMain ? 'sidebar-nav-main' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="sidebar-icon-wrap">
                    <item.icon size={item.isMain ? 20 : 19} strokeWidth={isActive || item.isMain ? 2.2 : 1.7} />
                  </div>
                  <span className="sidebar-label">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-avatar">R</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-body">
        {isDemoMode && (
          <div className="demo-banner">
            Demo mode: data is saved in this browser only.
          </div>
        )}
        <main className="app-content">
          <Outlet />
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="bottom-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${item.isMain ? 'nav-item-main' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrap">
                    <item.icon size={item.isMain ? 22 : 20} strokeWidth={item.isMain ? 2.5 : isActive ? 2 : 1.5} />
                  </div>
                  <span className="nav-label">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AppShell;
