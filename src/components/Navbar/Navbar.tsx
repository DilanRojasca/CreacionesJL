import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button/Button';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitial = () => {
    const name = user?.user_metadata?.first_name || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/logo.svg" alt="Creaciones JL Logo" className="navbar-logo-img" />
          <span>Creaciones JL</span>
        </Link>
        
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <button 
                className={`user-avatar-button ${isDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Menú de usuario"
              >
                <div className="user-avatar">
                  {getInitial()}
                </div>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {isDropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <p className="user-name">{user?.user_metadata?.full_name || user?.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    Perfil
                  </Link>
                  <Link to="/cart" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    Carrito
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-button" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-buttons">
              <Button to="/login" variant="tertiary" size="medium">
                Iniciar Sesión
              </Button>
              <Button to="/register" variant="primary" size="medium">
                Registrarse
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
