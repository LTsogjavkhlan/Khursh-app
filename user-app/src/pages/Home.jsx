import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { DoorOpen, UserPlus, CircleDollarSign, Phone, CircleUserRound, Calendar, ShieldCheck, MessageSquare, Car } from 'lucide-react'

export default function Home() {
    const welcomeRef = useRef(null)
    const sectionRefs = useRef([])
    const { user } = useAuth()

    const [announcements, setAnnouncements] = useState([])
    const [payments, setPayments] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [upcomingEvents, setUpcomingEvents] = useState([])
    const [loading, setLoading] = useState(true)

    const { colors } = useTheme()
    const userName = user?.firstName || 'Оршин суугч'
    const unitNumber = user?.apartmentNumber || ''

    const pendingTotal = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0)
    const balanceDisplay = pendingTotal > 0
        ? `${pendingTotal.toLocaleString()}₮`
        : 'Төлбөргүй'

    useEffect(() => {
        async function loadData() {
            try {
                const [announcementsData, paymentsData, vehiclesData, eventsData] = await Promise.allSettled([
                    apiRequest('/api/announcements'),
                    apiRequest('/api/payments/my-payments'),
                    apiRequest('/api/vehicles'),
                    apiRequest('/api/events'),
                ])

                if (announcementsData.status === 'fulfilled') {
                    const list = Array.isArray(announcementsData.value) ? announcementsData.value : []
                    setAnnouncements(list.slice(0, 3))
                }
                if (paymentsData.status === 'fulfilled') {
                    const list = Array.isArray(paymentsData.value) ? paymentsData.value : []
                    setPayments(list.slice(0, 3))
                }
                if (vehiclesData.status === 'fulfilled') {
                    const list = Array.isArray(vehiclesData.value) ? vehiclesData.value : []
                    setVehicles(list.slice(0, 2))
                }
                if (eventsData.status === 'fulfilled') {
                    const list = Array.isArray(eventsData.value) ? eventsData.value : []
                    const now = new Date()
                    const upcoming = list
                        .filter(e => new Date(e.date) >= now)
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .slice(0, 3)
                    setUpcomingEvents(upcoming)
                }
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return `${d.getMonth() + 1} сарын ${d.getDate()}`
    }

    const getPaymentStatusLabel = (payment) => {
        if (payment.status === 'completed') return 'Төлсөн'
        if (payment.status === 'pending') return 'Хүлээгдэж байна'
        if (payment.status === 'failed') return 'Амжилтгүй'
        return payment.status
    }

    const getPaymentStatusStyle = (payment) => {
        if (payment.status === 'completed') return styles.paymentStatusPaid
        if (payment.status === 'failed') return styles.paymentStatusCritical
        return styles.paymentStatusDue
    }

    useEffect(() => {
        // Animate welcome section
        const welcomeAnim = gsap.from(welcomeRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        });

        // Animate sections
        const sectionsAnim = gsap.from(sectionRefs.current, {
            y: 30,
            opacity: 0,
            stagger: 0.15,
            duration: 0.5,
            ease: "power1.out",
            delay: 0.2
        });

        // Cleanup function to kill animations when component unmounts
        return () => {
            welcomeAnim.kill();
            sectionsAnim.kill();
        };
    }, []);

    // Inline styles to ensure rendering
    const styles = {
        container: {
            paddingBottom: '16px',
        },
        welcomeSection: {
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
            color: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 6px 20px -4px rgba(0, 0, 0, 0.2), 0 4px 8px -2px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        welcomePattern: {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundImage: 'radial-gradient(circle at 20% 90%, rgba(255, 255, 255, 0.25) 0%, transparent 30%), radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.25) 0%, transparent 30%)',
            opacity: 0.9,
            zIndex: 0,
        },
        welcomeContent: {
            position: 'relative',
            zIndex: 1,
        },
        welcomeTitle: {
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '4px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            letterSpacing: '0.5px',
        },
        welcomeUnit: {
            opacity: '0.9',
            fontSize: '15px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        welcomeSubtext: {
            marginTop: '12px',
            fontSize: '14px',
            opacity: '0.85',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        welcomeBalance: {
            marginTop: '18px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        },
        welcomeBalanceLabel: {
            fontSize: '13px',
            fontWeight: '500',
            opacity: '1',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        welcomeBalanceAmount: {
            fontSize: '24px',
            fontWeight: 'bold',
            marginTop: '4px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        welcomeBalanceRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
        },
        payButton: {
            backgroundColor: '#ffffff',
            color: '#1e3a8a',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            border: '2px solid #ffffff',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s',
            zIndex: 5,
            position: 'relative',
            textAlign: 'center',
            display: 'inline-block',
        },
        section: {
            marginBottom: '24px',
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '14px',
            color: colors.text,
        },
        actionScroll: {
            display: 'flex',
            overflowX: 'auto',
            paddingBottom: '12px',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
            WebkitOverflowScrolling: 'touch',
        },
        actionButton: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 6px',
            borderRadius: '12px',
            color: 'white',
            width: '80px',
            height: '80px',
            flexShrink: 0,
            marginRight: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        },
        actionButtonBlue: {
            backgroundColor: '#2563eb',
        },
        actionButtonGreen: {
            backgroundColor: '#059669',
        },
        actionButtonPurple: {
            backgroundColor: '#7c3aed',
        },
        actionButtonAmber: {
            backgroundColor: '#d97706',
        },
        actionButtonIndigo: {
            backgroundColor: '#4f46e5',
        },
        actionButtonRed: {
            backgroundColor: '#dc2626',
        },
        actionButtonTeal: {
            backgroundColor: '#0d9488',
        },
        actionIcon: {
            width: '28px',
            height: '28px',
            marginBottom: '8px',
        },
        actionText: {
            fontSize: '12px',
            fontWeight: '500',
        },
        card: {
            backgroundColor: colors.surface,
            padding: '20px',
            borderRadius: '14px',
            boxShadow: `0 4px 8px ${colors.shadow}`,
            border: `1px solid ${colors.border}`,
        },
        cardHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
        },
        cardTitle: {
            fontSize: '19px',
            fontWeight: '600',
            color: colors.text,
        },
        viewAllLink: {
            fontSize: '14px',
            color: colors.accent,
            fontWeight: '500',
        },
        contentList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        },
        paymentItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px',
            backgroundColor: colors.surfaceAlt,
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
        },
        paymentInfo: {
            flex: 1,
        },
        paymentLabel: {
            color: colors.textSub,
            fontSize: '14px',
            fontWeight: '500',
        },
        paymentSecondary: {
            color: colors.textMuted,
            fontSize: '12px',
            marginTop: '2px',
        },
        paymentAmount: {
            fontWeight: '600',
            fontSize: '16px',
            marginLeft: '12px',
            color: colors.text,
        },
        paymentStatus: {
            padding: '5px 10px',
            fontSize: '12px',
            borderRadius: '9999px',
            fontWeight: '500',
            minWidth: '80px',
            textAlign: 'center',
        },
        paymentStatusPaid: {
            backgroundColor: '#d1fae5',
            color: '#065f46',
        },
        paymentStatusDue: {
            backgroundColor: '#fef3c7',
            color: '#92400e',
        },
        paymentStatusCritical: {
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
        },
        noticeItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '14px',
            backgroundColor: colors.surfaceAlt,
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
        },
        noticeIndicator: {
            width: '8px',
            height: '58px',
            borderRadius: '9999px',
            marginRight: '14px',
        },
        noticeIndicatorOrange: {
            backgroundColor: '#f97316',
        },
        noticeIndicatorBlue: {
            backgroundColor: '#3b82f6',
        },
        noticeContent: {
            flex: 1,
        },
        noticeTitle: { fontWeight: '600', fontSize: '15px', color: colors.text },
        noticeTime: { fontSize: '13px', color: colors.textSub, marginTop: '3px' },
        announcementItem: {
            padding: '14px', backgroundColor: colors.surface, borderRadius: '10px',
            border: `1px solid ${colors.border}`, marginBottom: '10px',
            boxShadow: `0 2px 4px ${colors.shadow}`,
        },
        announcementHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        announcementTitle: { fontWeight: '600', fontSize: '15px', color: colors.text },
        announcementDate: { fontSize: '12px', color: colors.textSub, backgroundColor: colors.surfaceAlt, padding: '3px 8px', borderRadius: '6px' },
        announcementContent: { fontSize: '14px', color: colors.textSub, marginTop: '6px', lineHeight: '1.4' },
        parkingItem: {
            padding: '14px', backgroundColor: colors.surfaceAlt, borderRadius: '10px',
            border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center',
        },
        parkingIcon: {
            width: '40px', height: '40px', borderRadius: '8px',
            backgroundColor: colors.accentBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginRight: '14px', color: '#4f46e5',
        },
        parkingInfo: { flex: 1 },
        parkingPlate: { fontWeight: '600', fontSize: '15px', color: colors.text },
        parkingVehicle: { fontSize: '13px', color: colors.textSub, marginTop: '2px' },
        parkingStatus: { fontSize: '12px', fontWeight: '500', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#166534' },
        showAllButton: {
            marginTop: '14px', padding: '10px', backgroundColor: colors.surfaceAlt,
            borderRadius: '8px', textAlign: 'center', color: colors.textSub,
            fontWeight: '500', fontSize: '14px',
        },
    };

    return (
        <div style={styles.container}>
            {/* Add scrollbar styling */}
            <style>
                {`
                    ::-webkit-scrollbar {
                        display: none;
                    }
                `}
            </style>

            {/* Welcome Section */}
            <div
                style={styles.welcomeSection}
                ref={welcomeRef}
                className="white-text"
            >
                <div style={styles.welcomePattern}></div>
                <div style={styles.welcomeContent}>
                    <h1 style={styles.welcomeTitle}>Сайн байна уу, {userName}!</h1>
                    <p style={styles.welcomeUnit}>тоот {unitNumber}</p>
                    <div style={styles.welcomeSubtext}>
                        <p>Оршин суугчдын нэгдсэн Application</p>
                    </div>
                    <div style={styles.welcomeBalance}>
                        <span style={styles.welcomeBalanceLabel}>Төлөгдөөгүй үлдэгдэл</span>
                        <div style={styles.welcomeBalanceRow}>
                            <span style={styles.welcomeBalanceAmount}>{balanceDisplay}</span>
                            <Link
                                to="/payments"
                                style={{
                                    backgroundColor: "#234ee0",
                                    color: "white",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    textDecoration: "none",
                                    display: "inline-block",
                                    border: "none",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                                    textAlign: "center"
                                }}
                            >
                                Төлбөр төлөх
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <section
                style={styles.section}
                ref={el => sectionRefs.current[0] = el}
            >
                <h2 style={{ ...styles.sectionTitle, fontSize: '20px', color: colors.text, opacity: 1 }}>Нэг дороос</h2>
                <div style={styles.actionScroll}>
                    <Link
                        to="/license-plate"
                        style={{ ...styles.actionButton, ...styles.actionButtonBlue }}
                        className="white-text"
                    >
                        <DoorOpen style={styles.actionIcon} />
                        <span style={styles.actionText}>Хаалт</span>
                    </Link>
                    <Link
                        to="/license-plate"
                        style={{ ...styles.actionButton, ...styles.actionButtonGreen }}
                        className="white-text"
                    >
                        <UserPlus style={styles.actionIcon} />
                        <span style={styles.actionText}>Зочин нэмэх</span>
                    </Link>
                    <Link
                        to="/payments"
                        style={{ ...styles.actionButton, ...styles.actionButtonPurple }}
                        className="white-text"
                    >
                        <CircleDollarSign style={styles.actionIcon} />
                        <span style={styles.actionText}>Төлбөр</span>
                    </Link>
                    <Link
                        to="/contact"
                        style={{ ...styles.actionButton, ...styles.actionButtonAmber }}
                        className="white-text"
                    >
                        <Phone style={styles.actionIcon} />
                        <span style={styles.actionText}>Холбоо барих</span>
                    </Link>
                    <Link
                        to="/profile"
                        style={{ ...styles.actionButton, ...styles.actionButtonIndigo }}
                        className="white-text"
                    >
                        <CircleUserRound style={styles.actionIcon} />
                        <span style={styles.actionText}>Профайл</span>
                    </Link>
                    <Link
                        to="/calendar"
                        style={{ ...styles.actionButton, ...styles.actionButtonTeal }}
                        className="white-text"
                    >
                        <Calendar style={styles.actionIcon} />
                        <span style={styles.actionText}>Хуанли</span>
                    </Link>
                    <Link
                        to="/rules"
                        style={{ ...styles.actionButton, ...styles.actionButtonRed }}
                        className="white-text"
                    >
                        <ShieldCheck style={styles.actionIcon} />
                        <span style={styles.actionText}>Дүрэм</span>
                    </Link>
                    <Link
                        to="/feedback"
                        style={{ ...styles.actionButton, backgroundColor: '#8B5CF6' }}
                        className="white-text"
                    >
                        <MessageSquare style={styles.actionIcon} />
                        <span style={styles.actionText}>Санал</span>
                    </Link>
                </div>
            </section>

            {/* Announcements */}
            <section
                style={{ ...styles.section, marginTop: '24px', marginBottom: '30px' }}
                ref={el => sectionRefs.current[3] = el}
            >
                <div style={{
                    ...styles.card,
                    borderLeft: '4px solid #3b82f6',
                    boxShadow: `0 4px 10px ${colors.shadow}`
                }}>
                    <div style={styles.cardHeader}>
                        <h2 style={{ ...styles.cardTitle, fontSize: '20px', opacity: 1 }}>Зарлал</h2>
                        <Link to="/announcements" style={{ ...styles.viewAllLink, opacity: 1 }}>Бүгдийг харах</Link>
                    </div>
                    <div style={styles.contentList}>
                        {loading ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Ачаалж байна...</p>
                        ) : announcements.length === 0 ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Одоогоор мэдэгдэл байхгүй.</p>
                        ) : announcements.slice(0, 2).map(announcement => (
                            <div key={announcement._id} style={styles.announcementItem}>
                                <div style={styles.announcementHeader}>
                                    <h3 style={{ ...styles.announcementTitle, opacity: 1 }}>
                                        {announcement.title}
                                    </h3>
                                    <span style={{ ...styles.announcementDate, opacity: 1 }}>
                                        {formatDate(announcement.createdAt)}
                                    </span>
                                </div>
                                <p style={{ ...styles.announcementContent, opacity: 1 }}>
                                    {announcement.content}
                                </p>
                            </div>
                        ))}
                        <Link to="/announcements" style={{
                            ...styles.showAllButton,
                            backgroundColor: colors.accentBg,
                            color: colors.accent,
                            opacity: 1
                        }}>
                            Бүх мэдэгдлийг харах
                        </Link>
                    </div>
                </div>
            </section>

            {/* Payment Summary */}
            <section
                style={styles.section}
                ref={el => sectionRefs.current[1] = el}
            >
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Төлбөрийн мэдэгдэл</h2>
                        <Link to="/payments" style={styles.viewAllLink}>Бүгдийг харах</Link>
                    </div>
                    <div style={styles.contentList}>
                        {loading ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Ачаалж байна...</p>
                        ) : payments.length === 0 ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Төлбөрийн мэдээлэл байхгүй.</p>
                        ) : payments.map(payment => (
                            <div key={payment._id} style={styles.paymentItem}>
                                <div style={styles.paymentInfo}>
                                    <p style={styles.paymentLabel}>{payment.description}</p>
                                    <p style={styles.paymentSecondary}>
                                        {payment.status === 'completed' && payment.paidAt
                                            ? `Төлсөн: ${formatDate(payment.paidAt)}`
                                            : payment.month ? `${payment.month}` : ''}
                                    </p>
                                </div>
                                <div style={styles.paymentAmount}>{payment.amount.toLocaleString()}₮</div>
                                <span style={{ ...styles.paymentStatus, ...getPaymentStatusStyle(payment) }}>
                                    {getPaymentStatusLabel(payment)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Parking Passes */}
            <section
                style={styles.section}
                ref={el => sectionRefs.current[4] = el}
            >
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Таны машин</h2>
                        <Link to="/license-plate" style={styles.viewAllLink}>Удирдах</Link>
                    </div>
                    <div style={styles.contentList}>
                        {loading ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Ачаалж байна...</p>
                        ) : vehicles.length === 0 ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Бүртгэлтэй машин байхгүй.</p>
                        ) : vehicles.map(vehicle => (
                            <div key={vehicle._id} style={styles.parkingItem}>
                                <div style={styles.parkingIcon}>
                                    <Car size={24} />
                                </div>
                                <div style={styles.parkingInfo}>
                                    <p style={styles.parkingPlate}>{vehicle.plate}</p>
                                    <p style={styles.parkingVehicle}>{vehicle.model}{vehicle.color ? ` • ${vehicle.color}` : ''}</p>
                                </div>
                                <span style={styles.parkingStatus}>{vehicle.isPrimary ? 'Үндсэн' : 'идэвхтэй'}</span>
                            </div>
                        ))}
                        <Link to="/license-plate" style={styles.showAllButton}>
                            Машин нэмэх
                        </Link>
                    </div>
                </div>
            </section>

            {/* Notices */}
            <section
                style={styles.section}
                ref={el => sectionRefs.current[2] = el}
            >
                <div style={styles.card}>
                    <h2 style={{ ...styles.cardTitle, marginBottom: '16px' }}>Удахгүй болох үйл явдлууд</h2>
                    <div style={styles.contentList}>
                        {loading ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Ачаалж байна...</p>
                        ) : upcomingEvents.length === 0 ? (
                            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Удахгүй болох үйл явдал байхгүй.</p>
                        ) : upcomingEvents.map(event => (
                            <div key={event._id} style={styles.noticeItem}>
                                <div style={{ ...styles.noticeIndicator, ...styles.noticeIndicatorBlue }}></div>
                                <div style={styles.noticeContent}>
                                    <h3 style={styles.noticeTitle}>{event.title}</h3>
                                    <p style={styles.noticeTime}>
                                        {formatDate(event.date)}{event.time ? ` • ${event.time}` : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
} 