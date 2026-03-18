import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Home, 
  Bell, 
  LogOut, 
  Menu,
  X,
  UserCircle
} from 'lucide-react';
import './Layout.css';

export const Layout = () => {
  const { user, signOut } = useAuth();
  const { notifications } = useApp();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/calendar', icon: CalendarIcon, label: 'Calendario' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
  ];

  if (user?.role === 'admin' || user?.role === 'super_admin') {
    navItems.push({ to: '/admin', icon: UserCircle, label: 'Administración' });
  }

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (!user) return <Outlet />;

  return (
    <div className="layout-container">
      {/* Mobile Top Header */}
      <header className="mobile-header d-md-none">
        <div className="brand">
          <CalendarIcon className="brand-icon" />
          <span>PsicoCita</span>
        </div>
        <div className="flex items-center gap-4">
          <NavLink to="/notifications" className="notification-btn" onClick={closeMobileMenu}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge"></span>}
          </NavLink>
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar glass ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header d-none d-md-flex">
          <CalendarIcon className="brand-icon" size={28} />
          <h2>PsicoCita</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink 
            to="/notifications" 
            className={({ isActive }) => `nav-item d-md-none ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <Bell size={20} />
            <span>Notificaciones</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <UserCircle size={32} className="text-muted" />
            <div className="user-info">
              <span className="user-name">{user.full_name || 'Usuario'}</span>
              <span className="user-role">
                {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Licenciada' : 'Interna'}
              </span>
              <span className="session-pill">Sesión activa</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && <div className="sidebar-overlay d-md-none" onClick={closeMobileMenu}></div>}

      {/* Main Content Area */}
      <main className="main-content">
        {/* Desktop Top Header */}
        <header className="desktop-header glass d-none d-md-flex">
          <div className="header-breadcrumbs">
            <h3 className="page-title">Bienvenido a PsicoCita</h3>
          </div>
          <div className="header-actions">
            <NavLink to="/notifications" className="notification-btn">
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge"></span>}
            </NavLink>
          </div>
        </header>

        <div className="content-scrollable">
          <div className="content-container animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
