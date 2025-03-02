import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { ModalContainer, modalRef, confirmModal } from '../Toast/ConfirmationModal';
import './Header.css';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    // Instead of window.confirm, use confirmModal
    confirmModal.warning(
      '¿De verdad deseas cerrar la sesión?',
      () => {
        // Yes callback - perform logout
        logout();
        // Show success toast
        confirmModal.success('Sesión cerrada exitosamente');
      },
      () => {
        // No callback - do nothing or show a canceled message
        confirmModal.info('Operación cancelada');
      }
    );
  };

  const navItems: NavItem[] = [
    { name: 'Inicio', path: '/', icon: <HomeIcon /> },
    { name: 'Fotos', path: '/gallery', icon: <GalleryIcon /> },
    { name: 'Videos', path: '/video', icon: <VideoIcon /> },
    isAuthenticated
      ? { name: 'Cerrar sesión', path: '/login', icon: <LoginIcon />, onClick: handleLogout }
      : { name: 'Login', path: '/login', icon: <LoginIcon /> },
  ];

  return (
    <>
      <header className="glass-header">
        <div className="header-container">
          <div className="logo">
            <LogoIcon />
            <span>MediaApp</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <ul>
              {navItems.map((item) => (
                <li key={item.name}>
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className={location.pathname === item.path ? 'active' : ''}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={location.pathname === item.path ? 'active' : ''}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="mobile-nav">
            <ul>
              {navItems.map((item) => (
                <li key={item.name}>
                  {item.onClick ? (
                    <button
                      onClick={() => {
                        item.onClick?.();
                        setIsMenuOpen(false);
                      }}
                      className={location.pathname === item.path ? 'active' : ''}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={location.pathname === item.path ? 'active' : ''}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* Mount the ModalContainer component */}
      <ModalContainer ref={modalRef} />
    </>
  );
};

// Modern Minimalist Icon Components

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const GalleryIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
    <path d="M22 9l-6 3 6 3V9z" />
  </svg>
);

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoginIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

export default Header;