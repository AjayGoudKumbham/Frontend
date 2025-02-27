import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import Button from './Button';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check for the token in localStorage
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;  // If token exists, user is authenticated

  const handleLogout = () => {
    localStorage.removeItem('token');  // Remove token on logout
    navigate('/');  // Redirect to home
  };

  if (location.pathname === '/') return null;  // Don't render navbar on the home page

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-medium">
            <Home className="w-5 h-5" />
            Home
          </Link>

          {isAuthenticated && (
            <Button
              variant="secondary"
              icon={LogOut}
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
