import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, LogOut, User, Settings, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/topbar.css';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/screening': 'Resume Screening',
  '/candidates': 'Candidates',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const title = PAGE_TITLES[location.pathname] ?? 'ResumeIQ';
  const getInitials = (name?: string) => {
    if (!name) return 'U';

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const NOTIFICATIONS = [
    { id: 1, text: '3 new candidates matched for Senior Engineer', time: '2m ago', unread: true },
    { id: 2, text: 'Batch screening completed: 24 resumes', time: '15m ago', unread: true },
    { id: 3, text: 'Weekly report is ready to view', time: '1h ago', unread: false },
  ];

  return (
    <header className="topbar">
      <button
        onClick={onMenuToggle}
        className="topbar-menu-btn"
      >
        <Menu />
      </button>

      <h1 className="topbar-title">{title}</h1>

      <div className="flex gap-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="topbar-notification-btn"
          >
            <Bell />
            <span className="topbar-notification-badge" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="notification-dropdown dropdown"
              >
                <div className="notification-header">
                  <span className="notification-header-title">Notifications</span>
                  <span className="badge bg-red-50">2 new</span>
                </div>
                <div>
                  {NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.unread ? 'unread' : ''}`}
                    >
                      <div className="flex gap-2.5 items-start w-full">
                        {n.unread && <div className="notification-dot" />}
                        {!n.unread && <div className="w-2" />}
                        <div className="flex-1">
                          <p className="notification-text">{n.text}</p>
                          <p className="notification-time">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notification-footer">
                  <button className="notification-footer-btn">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={`topbar-user ${dropdownOpen ? 'open' : ''}`}
          >
            <div className="topbar-avatar">
              {getInitials(user?.name)}
            </div>
            <div className="topbar-user-info">
              <p className="topbar-user-name">{user?.name}</p>
            </div>
            <ChevronDown className="topbar-user-chevron" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="dropdown"
              >
                <div className="dropdown-header">
                  <p className="dropdown-header-name">{user?.name}</p>
                  <p className="dropdown-header-email">{user?.email}</p>
                </div>
                <div className="dropdown-items">
                  <button
                    className="dropdown-item"
                  >
                    <User />
                    My Profile
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/settings');
                      setDropdownOpen(false);
                    }}
                  >
                    <Settings />
                    Settings
                  </button>
                </div>
                <div className="dropdown-divider" />
                <button
                  onClick={logout}
                  className="dropdown-item logout"
                >
                  <LogOut />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
