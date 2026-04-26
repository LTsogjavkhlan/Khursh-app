import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { apiRequest } from '../api/client'
import {
    BellIcon,
    UserIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../context/ThemeContext.jsx'

export default function MainLayout() {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
    const [notificationCount, setNotificationCount] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)
    const location = useLocation()
    const pollRef = useRef(null)
    const { colors } = useTheme()

    // Primary navigation items (4 main ones for bottom bar)
    const primaryNavItems = [
        {
            name: 'Нүүр',
            activeIcon: 'src/assets/icons/homeactive.png',
            inactiveIcon: 'src/assets/icons/homeinactive.png',
            path: '/'
        },
        {
            name: 'Төлбөр',
            activeIcon: 'src/assets/icons/cardactive.png',
            inactiveIcon: 'src/assets/icons/tulburinactive.png',
            path: '/payments'
        },
        {
            name: 'Машин',
            activeIcon: 'src/assets/icons/caractive.png',
            inactiveIcon: 'src/assets/icons/carinactive.png',
            path: '/license-plate'
        },
        {
            name: 'Цэс',
            activeIcon: 'src/assets/icons/menu.png',
            inactiveIcon: 'src/assets/icons/menu.png',
            path: '#more'
        }
    ]

    // Secondary items for the "More" menu
    const secondaryNavItems = [
        {
            name: 'Хуанли',
            icon: 'src/assets/icons/calendar.png',
            path: '/calendar'
        },
        {
            name: 'Зарлал',
            icon: 'src/assets/icons/notification.png',
            path: '/announcements'
        },
        {
            name: 'Дүрэм',
            icon: 'src/assets/icons/durem.png',
            path: '/rules'
        },
        {
            name: 'Санал, гомдол',
            icon: 'src/assets/icons/sanal.png',
            path: '/feedback'
        },
        {
            name: 'Холбоо барих',
            icon: 'src/assets/icons/phone.png',
            path: '/contact'
        },
        {
            name: 'Мэдэгдэл',
            icon: 'src/assets/icons/notification.png',
            path: '/notifications'
        },
        {
            name: 'Профайл',
            icon: 'src/assets/icons/profile.png',
            path: '/profile'
        }
    ]

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsScrolled(scrollPosition > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const data = await apiRequest('/api/notifications/unread-count')
            setNotificationCount(data.count ?? 0)
        } catch { /* user may not be logged in yet */ }
    }

    // Load count on mount and poll every 60 seconds
    useEffect(() => {
        fetchUnreadCount()
        pollRef.current = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(pollRef.current)
    }, [])

    // Reset badge to 0 when the user opens the notifications page
    useEffect(() => {
        if (location.pathname === '/notifications') {
            setNotificationCount(0)
        }
    }, [location.pathname])

    const toggleMoreMenu = () => {
        setIsMoreMenuOpen(!isMoreMenuOpen)
    }

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/'
        }
        return location.pathname.startsWith(path)
    }

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: colors.bg,
        },
        header: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 10,
            transition: 'box-shadow 0.3s ease',
        },
        headerScrolled: {
            boxShadow: `0 4px 6px -1px ${colors.shadow}, 0 2px 4px -1px ${colors.shadow}`,
        },
        headerLogoContainer: {
            display: 'flex',
            alignItems: 'center',
        },
        appTitle: {
            fontSize: '18px',
            fontWeight: '600',
            background: 'linear-gradient(to right, #2563eb, #4f46e5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        headerIconsContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
        },
        notificationContainer: {
            position: 'relative',
            cursor: 'pointer',
        },
        notificationBadge: {
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '10px',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        avatar: {
            width: '32px',
            height: '32px',
            backgroundColor: colors.surfaceAlt,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
        },
        main: {
            flex: 1,
            paddingTop: '64px',
            paddingBottom: '80px',
            paddingLeft: '16px',
            paddingRight: '16px',
            overflowX: 'hidden',
            backgroundColor: colors.surface,
            color: colors.text,
        },
        bottomNav: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTop: `1px solid ${colors.border}`,
            zIndex: 10,
            boxShadow: `0 -2px 10px ${colors.shadow}`,
        },
        bottomNavGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            height: '64px',
        },
        navItem: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative',
        },
        navItemActive: {
            color: colors.accent,
        },
        navItemInactive: {
            color: colors.textMuted,
        },
        navLabel: {
            fontSize: '12px',
            marginTop: '4px',
            transition: 'all 0.2s ease',
        },
        activeIndicator: {
            position: 'absolute',
            bottom: '0',
            width: '20px',
            height: '3px',
            backgroundColor: colors.accent,
            borderRadius: '3px 3px 0 0',
            transition: 'all 0.3s ease',
            transform: 'translateY(-6px)',
        },
        moreMenu: {
            position: 'fixed',
            bottom: '64px',
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTop: `1px solid ${colors.border}`,
            boxShadow: `0 -10px 15px -3px ${colors.shadow}`,
            borderRadius: '20px 20px 0 0',
            zIndex: 20,
            animation: 'slide-up 0.3s ease-out forwards',
        },
        dragHandle: {
            width: '40px',
            height: '4px',
            backgroundColor: colors.border,
            borderRadius: '9999px',
            margin: '12px auto',
        },
        moreMenuGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            padding: '16px 20px 24px',
        },
        moreMenuItem: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
        },
        moreMenuItemActive: {
            backgroundColor: colors.accentBg,
            color: colors.accent,
        },
        moreMenuItemInactive: {
            color: colors.textSub,
        },
        moreMenuIconContainer: {
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: colors.surfaceAlt,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
            transition: 'all 0.2s ease',
        },
        moreMenuIconContainerActive: {
            backgroundColor: colors.accentBg,
        },
        backdrop: {
            position: 'fixed',
            inset: 0,
            bottom: '64px',
            backgroundColor: colors.overlay,
            zIndex: 10,
            backdropFilter: 'blur(2px)',
            opacity: 0,
            animation: 'fade-in 0.3s ease-out forwards',
        },
    };

    return (
        <div style={styles.container} className="user-layout">

            {/* Top Header Bar */}
            <header style={{
                ...styles.header,
                ...(isScrolled ? styles.headerScrolled : {})
            }}>
                <div style={styles.headerLogoContainer}>
                    <img
                        src="src/assets/icons/hurshlogo.png"
                        alt="Хөрш Logo"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            marginRight: '10px'
                        }}
                    />
                    <h1 style={styles.appTitle}>Хөрш</h1>
                </div>

                <div style={styles.headerIconsContainer}>
                    <NavLink to="/notifications" style={styles.notificationContainer}>
                        <BellIcon style={{ width: '24px', height: '24px', color: colors.textSub }} />
                        {notificationCount > 0 && (
                            <span style={styles.notificationBadge}>
                                {notificationCount}
                            </span>
                        )}
                    </NavLink>
                    <NavLink to="/profile"
                        style={styles.avatar}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.border;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.surfaceAlt;
                        }}
                    >
                        <UserIcon style={{ width: '20px', height: '20px', color: colors.textSub }} />
                    </NavLink>
                </div>
            </header>

            {/* Main Content - with padding for header and nav */}
            <main style={styles.main}>
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav style={styles.bottomNav}>
                <div style={styles.bottomNavGrid}>
                    {primaryNavItems.map((item) => {
                        const active = item.path === '#more' ? isMoreMenuOpen :
                            (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path))

                        return (
                            <NavLink
                                key={item.name}
                                to={item.path === '#more' ? '#' : item.path}
                                style={{
                                    ...styles.navItem,
                                    ...(active ? styles.navItemActive : styles.navItemInactive)
                                }}
                                onClick={item.path === '#more' ? toggleMoreMenu : undefined}
                            >
                                <img
                                    src={active ? item.activeIcon : item.inactiveIcon}
                                    alt={item.name}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        marginBottom: '4px'
                                    }}
                                />
                                <span style={{
                                    ...styles.navLabel,
                                    ...(active ? { fontWeight: 500 } : {})
                                }}>
                                    {item.name}
                                </span>
                                {active && <div style={styles.activeIndicator}></div>}
                            </NavLink>
                        )
                    })}
                </div>
            </nav>

            {/* More Menu Popup */}
            {isMoreMenuOpen && (
                <div style={styles.moreMenu}>
                    <div style={styles.dragHandle}></div>
                    <div style={styles.moreMenuGrid}>
                        {secondaryNavItems.map((item) => {
                            const active = location.pathname === item.path

                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    style={{
                                        ...styles.moreMenuItem,
                                        ...(active ? styles.moreMenuItemActive : styles.moreMenuItemInactive)
                                    }}
                                    onClick={() => setIsMoreMenuOpen(false)}
                                >
                                    <div style={{
                                        ...styles.moreMenuIconContainer,
                                        ...(active ? styles.moreMenuIconContainerActive : {})
                                    }}>
                                        <img
                                            src={item.icon}
                                            alt={item.name}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: active ? '500' : '400' }}>{item.name}</span>
                                </NavLink>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Backdrop for More Menu */}
            {isMoreMenuOpen && (
                <div
                    style={styles.backdrop}
                    onClick={() => setIsMoreMenuOpen(false)}
                ></div>
            )}

            {/* Global keyframe animations */}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    )
} 