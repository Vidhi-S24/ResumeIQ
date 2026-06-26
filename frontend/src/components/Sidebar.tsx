import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, LayoutDashboard, FileSearch, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import '../styles/sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/screening', icon: FileSearch, label: 'Resume Screening', badge: 'AI' },
  { path: '/candidates', icon: Users, label: 'Candidates' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <BrainCircuit />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="sidebar-logo-text"
            >
              ResumeIQ
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, icon: Icon, label, badge }) => {
          const isActive = location.pathname === path ||
            (path === '/screening' && location.pathname === '/dashboard');
          return (
            <NavLink
              key={path}
              to={path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="sidebar-nav-item-icon">
                <Icon />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-2 items-center min-w-0 flex-1"
                  >
                    <span className="sidebar-nav-item-label">{label}</span>
                    {badge && (
                      <span className="sidebar-nav-item-badge">
                        {badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {collapsed && badge && (
                <span className="sidebar-nav-item-dot">
                  {badge[0]}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={onToggle}
          className="sidebar-toggle-btn"
        >
          {collapsed ? (
            <ChevronRight />
          ) : (
            <>
              <ChevronLeft />
              <span className="sidebar-toggle-text">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
