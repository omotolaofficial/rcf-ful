import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Calendar, MessageSquare, Video, Users, Home as HomeIcon, Settings, LogOut, Info, Phone, HeartHandshake, Image as ImageIcon, Facebook, Instagram } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'About', path: '/about', icon: Info },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Media', path: '/media', icon: Video },
  { name: 'Team', path: '/executives', icon: Users },
  { name: 'Posts', path: '/posts', icon: ImageIcon },
  { name: 'News', path: '/announcements', icon: MessageSquare },
  { name: 'Contact', path: '/contact', icon: Phone },
];

export function Layout() {
  const logoPrimaryUrl = '/images/crm-logo.png';
  const logoSecondaryUrl = new URL('../../images/rcffulllogo.jpeg', import.meta.url).href;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <nav className="bg-blue-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            {/* Left: Branding with dual logos */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-2">
                {/* CRM Logo */}
                <img 
                  src={logoPrimaryUrl}
                  alt="CRM Logo" 
                  className="h-8 w-8 object-contain"
                />
                <img
                  src={logoSecondaryUrl}
                  alt="RCF Full Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg text-white leading-tight">RCF FUL</span>
                <span className="text-xs text-white/70 -mt-0.5">Campus Fellowship</span>
              </div>
              <span className="sm:hidden font-bold text-white">RCF FUL</span>
            </Link>
            
            {/* Center: Desktop Nav (flex-grow) */}
            <div className="hidden sm:flex items-center gap-1 flex-grow justify-center ml-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "px-3 py-5 text-sm font-medium transition-colors h-16 box-border border-b-[3px] flex items-center whitespace-nowrap",
                    location.pathname === item.path
                      ? "text-white border-amber-600"
                      : "text-white/80 hover:text-white border-transparent"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "px-3 py-5 text-sm font-medium transition-colors flex items-center gap-1 h-16 box-border border-b-[3px] whitespace-nowrap",
                    location.pathname.startsWith('/admin')
                      ? "text-white border-amber-600"
                      : "text-white/80 hover:text-white border-transparent"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>

            {/* Right: CTA Button */}
            <Link
              to="/join"
              className="hidden sm:flex flex-shrink-0 px-5 py-2 text-sm font-bold text-blue-900 bg-amber-500 hover:bg-amber-400 rounded-full transition-colors items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <HeartHandshake className="w-4 h-4" />
              Join Us
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-blue-800 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden bg-white border-t"
            >
              <div className="pt-2 pb-3 space-y-1 px-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3",
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3",
                      location.pathname.startsWith('/admin')
                        ? "bg-purple-50 text-purple-700"
                        : "text-purple-600 hover:bg-purple-50"
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/join"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-bold rounded-md text-blue-900 bg-amber-500 hover:bg-amber-400"
                  >
                    <HeartHandshake className="w-5 h-5" />
                    Join Us / Register
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
      
      <footer className="bg-blue-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <img
                src={logoPrimaryUrl}
                alt="CRM Logo"
                className="h-6 w-6 object-contain"
              />
              <img
                src={logoSecondaryUrl}
                alt="RCF Full Logo"
                className="h-6 w-6 object-contain"
              />
              <span className="font-bold text-lg tracking-tight">RCF FUL</span>
            </div>
            <div className="text-gray-400 text-sm leading-relaxed">
              We serve God by His Spirit<br />
              We boast in Christ Jesus<br />
              We put no confidence in the flesh<br />
              We experience progress and joy in the Faith<br />
              And we experience the TEACHINGS of God forever
            </div>
            <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
              <a
                href="https://www.facebook.com/profile.php?id=61582380994934"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-blue-900"
                aria-label="RCF FUL Facebook"
                title="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/rcffulchapter?igsh=MXVnbmY5aDhzcWhhMg=="
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-blue-900"
                aria-label="RCF FUL Instagram"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            &copy; 2026 RCF FUL
          </div>
        </div>
      </footer>
    </div>
  );
}
