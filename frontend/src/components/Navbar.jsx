import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import { Database } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed left-0 right-0 top-4 z-50 transition-all duration-300 pointer-events-none`}>
      <div className="w-[min(1200px,calc(100%-2rem))] mx-auto pointer-events-auto">
        <div className={`rounded-2xl px-4 sm:px-6 lg:px-8 py-2 transition-colors duration-300 flex items-center justify-between ${scrolled ? 'bg-white/90 backdrop-blur border border-gray-200 shadow-lg' : 'bg-white/40 backdrop-blur-sm border border-transparent'}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div>
              <span className="block text-lg font-extrabold text-gray-900 leading-none">Synthetic Data</span>
              <span className="block text-sm text-[#7E5CE2] -mt-0.5">Market • AI · IPFS · Blockchain</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink to="/" active={isActive('/')} isHome>
              Home
            </NavLink>
            <NavLink to="/dashboard" active={isActive('/dashboard')}>
              Dashboard
            </NavLink>
          </div>

          {/* Wallet Connect */}
          <div>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, active, children, isHome = false }) => {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors';

  // Only change Home's active background; other links keep the existing active style
  // Use a subtle translucent version of #ff9c3f for Home when active
  const activeClass = isHome
    ? 'bg-[#ff9c3f]/70 text-primary-700'
    : 'bg-primary-50 text-primary-700';

  const inactiveClass = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <Link to={to} className={`${base} ${active ? activeClass : inactiveClass}`}>
      {children}
    </Link>
  );
};

export default Navbar;
