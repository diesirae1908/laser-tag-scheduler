import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const isLoggedIn = !!localStorage.getItem('adminToken');

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <nav className="bg-laser-card border-b border-laser-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-2xl">🎯</span>
          <span className="font-bold text-xl text-laser-cyan text-glow-cyan tracking-wide">
            LASER TAG
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/validate-payment"
            className="text-sm text-gray-400 hover:text-laser-green transition-colors duration-200"
          >
            Validate Payment
          </Link>

          {isAdminArea && isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-red-400 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/admin/login"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
