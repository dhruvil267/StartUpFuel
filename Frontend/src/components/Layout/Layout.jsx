import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  PieChart,
  ArrowUpDown,
  FileText,
  LogOut,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import styles from './Layout.module.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', href: '/portfolio', icon: PieChart },
    { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay}>
          <div 
            className={styles.sidebarBackdrop}
            onClick={() => setSidebarOpen(false)}
          />
          <div className={styles.sidebarMobile}>
            <div className={styles.closeButton}>
              <button
                className={styles.closeButton}
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={styles.sidebarDesktop}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarInner}>
            <SidebarContent navigation={navigation} currentPath={location.pathname} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.mainContent}>
        {/* Top navigation */}
        <div className={styles.topNav}>
          <div className={styles.topNavContent}>
            <button
              className={styles.menuButton}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className={styles.topNavIcons}>
              <div className={styles.avatar}>
                <span className={styles.avatarText}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop top bar */}
        <div className={styles.desktopTopBar}>
          <div className={styles.desktopTopBarContent}>
            <div className={styles.userProfile}>
              <div className={styles.userProfileButton}>
                <div className={styles.avatar}>
                  <span className={styles.avatarText}>
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>{user?.firstName} {user?.lastName}</p>
                  <p className={styles.userEmail}>{user?.email}</p>
                </div>
              </div>
            </div>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, currentPath }) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <div className={styles.sidebarInner}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoContent}>
          <TrendingUp className={styles.logoIcon} />
          <span className={styles.logoText}>StartupFuel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`${styles.navLink} ${
                isActive ? styles.navLinkActive : ''
              }`}
            >
              <item.icon
                className={`${styles.navIcon} ${
                  isActive ? styles.navIconActive : ''
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info and logout (mobile) */}
      <div className={styles.mobileUserInfo}>
        <div className={styles.mobileUserProfile}>
          <div className={styles.mobileAvatar}>
            <span className={styles.mobileAvatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className={styles.mobileUserDetails}>
            <p className={styles.mobileUserName}>{user?.firstName} {user?.lastName}</p>
            <p className={styles.mobileUserEmail}>{user?.email}</p>
          </div>
          <button
            className={styles.mobileLogoutButton}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Layout;
