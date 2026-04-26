import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'

export default function Calendar() {
    const headerRef = useRef(null)
    const calendarRef = useRef(null)

    const currentDate = new Date()
    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
    const [selectedDay, setSelectedDay] = useState(null)
    const [showEventPopup, setShowEventPopup] = useState(false)
    const [events, setEvents] = useState([])

    const monthNames = [
        "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
        "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"
    ]
    const weekDays = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"]

    const garbageCollection = {
        title: "Хог ачих өдөр",
        color: "#f97316",
        isRecurring: true,
    }

    useEffect(() => {
        apiRequest('/api/events')
            .then(data => {
                const list = Array.isArray(data) ? data : []
                setEvents(list.map(e => ({
                    ...e,
                    date: new Date(e.date),
                    color: '#2563eb',
                })))
            })
            .catch(() => {})
    }, [])

    // Navigation functions
    const goToPreviousMonth = () => {
        setCurrentMonth(prev => {
            const newMonth = prev - 1;
            if (newMonth < 0) {
                setCurrentYear(prevYear => prevYear - 1);
                return 11;
            }
            return newMonth;
        });
        setSelectedDay(null);
    }

    const goToNextMonth = () => {
        setCurrentMonth(prev => {
            const newMonth = prev + 1;
            if (newMonth > 11) {
                setCurrentYear(prevYear => prevYear + 1);
                return 0;
            }
            return newMonth;
        });
        setSelectedDay(null);
    }

    // Get all days of the current month with correct offset for weekday
    const getDaysInMonth = () => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        // Find the first Monday before the start of month if the 1st isn't a Monday
        const firstDay = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday
        const dayOffset = firstDay === 0 ? 6 : firstDay - 1; // Convert to 0 = Monday, 6 = Sunday

        // Create the calendar grid
        const totalCalendarDays = [];

        // Add days from previous month
        const lastMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = dayOffset - 1; i >= 0; i--) {
            totalCalendarDays.push({
                day: lastMonthLastDay - i,
                currentMonth: false,
                date: new Date(currentYear, currentMonth - 1, lastMonthLastDay - i)
            });
        }

        // Add days from current month
        for (let day = 1; day <= daysInMonth; day++) {
            totalCalendarDays.push({
                day,
                currentMonth: true,
                date: new Date(currentYear, currentMonth, day)
            });
        }

        // Add days from next month to complete the grid rows
        const daysNeededFromNextMonth = 7 - (totalCalendarDays.length % 7 || 7);
        if (daysNeededFromNextMonth < 7) {
            for (let day = 1; day <= daysNeededFromNextMonth; day++) {
                totalCalendarDays.push({
                    day,
                    currentMonth: false,
                    date: new Date(currentYear, currentMonth + 1, day)
                });
            }
        }

        return totalCalendarDays;
    }

    const getEventsForDate = (date) => {
        if (!date) return [];

        const dayEvents = events.filter(event =>
            event.date.getDate() === date.getDate() &&
            event.date.getMonth() === date.getMonth() &&
            event.date.getFullYear() === date.getFullYear()
        );

        if (date.getDay() === 3) {
            dayEvents.push({ ...garbageCollection, date, time: "Өглөө" });
        }

        return dayEvents;
    }

    const handleDayClick = (day) => {
        setSelectedDay(day);
        const hasEvents = getEventsForDate(day.date).length > 0;
        if (hasEvents) {
            setShowEventPopup(true);
        }
    }

    // Close the event popup
    const closeEventPopup = () => {
        setShowEventPopup(false);
    }

    // Get the current month's days
    const daysInMonth = getDaysInMonth();

    useEffect(() => {
        const welcomeAnim = gsap.from(headerRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        });

        const calendarAnim = gsap.from(calendarRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: 0.2,
            ease: "power1.out"
        });

        return () => {
            welcomeAnim.kill();
            calendarAnim.kill();
        };
    }, []);

    // Styles
    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px', paddingBottom: '72px', position: 'relative' },
        header: { marginBottom: '16px' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text },
        headerSubtitle: { color: colors.textMuted, marginTop: '4px' },
        calendarContainer: {
            backgroundColor: colors.surface, borderRadius: '12px',
            boxShadow: `0 1px 3px ${colors.shadow}`, overflow: 'hidden',
            border: `1px solid ${colors.border}`,
        },
        calendarHeader: {
            padding: '16px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: `1px solid ${colors.border}`,
        },
        monthTitle: { fontSize: '18px', fontWeight: '600', color: colors.text },
        navigationButton: {
            padding: '8px', borderRadius: '8px', backgroundColor: colors.surfaceAlt,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
        weekdayHeader: {
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.surfaceAlt,
        },
        weekday: { padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: colors.textMuted },
        weekendDay: { backgroundColor: colors.surfaceAlt, color: colors.textSub, fontWeight: '600' },
        calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: colors.border },
        calendarDay: {
            position: 'relative', aspectRatio: '1', backgroundColor: colors.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', padding: '4px',
        },
        calendarWeekendDay: { backgroundColor: colors.surfaceAlt },
        calendarOtherMonthDay: { backgroundColor: colors.bg },
        dayNumber: { fontSize: '15px', fontWeight: '500', marginBottom: '2px' },
        currentMonth: { color: colors.text },
        otherMonth: { color: colors.textMuted, opacity: '0.5', fontSize: '13px', fontWeight: '400' },
        selectedDay: { backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}` },
        eventIndicatorContainer: { display: 'flex', gap: '2px', marginTop: '2px' },
        eventIndicator: { width: '4px', height: '4px', borderRadius: '50%' },
        overlayContainer: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            display: showEventPopup ? 'flex' : 'none',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.overlay, backdropFilter: 'blur(5px)', zIndex: 50,
        },
        popupContainer: {
            width: '90%', maxWidth: '400px', backgroundColor: colors.surface,
            borderRadius: '12px', padding: '20px',
            boxShadow: `0 10px 25px -5px ${colors.shadow}`, border: `1px solid ${colors.border}`,
        },
        popupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
        popupTitle: { fontSize: '18px', fontWeight: '600', color: colors.text, display: 'flex', flexDirection: 'column', alignItems: 'center' },
        popupDayNumber: { fontSize: '40px', fontWeight: '700', lineHeight: '1', color: colors.text, marginBottom: '4px' },
        popupMonthYear: { fontSize: '16px', fontWeight: '500', color: colors.textSub },
        popupCloseButton: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '4px' },
        eventListContainer: { marginTop: '12px' },
        eventItem: { padding: '12px', borderRadius: '8px', marginBottom: '10px', backgroundColor: colors.surfaceAlt },
        eventTitle: { fontSize: '16px', fontWeight: '500', marginBottom: '4px', color: colors.text },
        eventTime: { fontSize: '14px', color: colors.textMuted },
        eventTag: { display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', color: 'white', marginTop: '6px' },
        noEvents: { textAlign: 'center', padding: '20px', color: colors.textMuted },
    };

    return (
        <div style={styles.container}>
            <header style={styles.header} ref={headerRef}>
                <h1 style={styles.headerTitle}>Нэгдсэн хуанли</h1>
                <p style={styles.headerSubtitle}>Үйл явдал, мэдэгдэл</p>
            </header>

            <div style={styles.calendarContainer} ref={calendarRef}>
                <div style={styles.calendarHeader}>
                    <button
                        style={styles.navigationButton}
                        onClick={goToPreviousMonth}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 style={styles.monthTitle}>{`${monthNames[currentMonth]} ${currentYear}`}</h2>
                    <button
                        style={styles.navigationButton}
                        onClick={goToNextMonth}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div style={styles.weekdayHeader}>
                    {weekDays.map((day, index) => (
                        <div
                            key={index}
                            style={{
                                ...styles.weekday,
                                ...(index >= 5 ? styles.weekendDay : {})
                            }}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                <div style={styles.calendarGrid}>
                    {daysInMonth.map((day, index) => {
                        const events = getEventsForDate(day.date);
                        const hasEvents = events.length > 0;
                        const isWeekend = index % 7 >= 5; // 5 and 6 are weekend indices (Sat, Sun)

                        return (
                            <div
                                key={index}
                                style={{
                                    ...styles.calendarDay,
                                    ...(isWeekend ? styles.calendarWeekendDay : {}),
                                    ...(!day.currentMonth ? styles.calendarOtherMonthDay : {}),
                                    ...(selectedDay && selectedDay.day === day.day && selectedDay.date.getMonth() === day.date.getMonth() ? styles.selectedDay : {}),
                                }}
                                onClick={() => handleDayClick(day)}
                            >
                                <span style={{
                                    ...styles.dayNumber,
                                    ...(day.currentMonth ? styles.currentMonth : styles.otherMonth)
                                }}>
                                    {day.day}
                                </span>

                                {hasEvents && (
                                    <div style={styles.eventIndicatorContainer}>
                                        {events.slice(0, 3).map((event, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    ...styles.eventIndicator,
                                                    backgroundColor: event.color
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Details Popup */}
            <div style={styles.overlayContainer} onClick={closeEventPopup}>
                <div style={styles.popupContainer} onClick={e => e.stopPropagation()}>
                    <div style={styles.popupHeader}>
                        <h3 style={styles.popupTitle}>
                            {selectedDay && (
                                <>
                                    <span style={styles.popupDayNumber}>
                                        {selectedDay.day}
                                    </span>
                                    <span style={styles.popupMonthYear}>
                                        {`${monthNames[selectedDay.date.getMonth()]}, ${selectedDay.date.getFullYear()}`}
                                    </span>
                                </>
                            )}
                        </h3>
                        <button style={styles.popupCloseButton} onClick={closeEventPopup}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div style={styles.eventListContainer}>
                        {selectedDay && getEventsForDate(selectedDay.date).length > 0 ? (
                            getEventsForDate(selectedDay.date).map((event, index) => (
                                <div key={index} style={styles.eventItem}>
                                    <div style={styles.eventTitle}>{event.title}</div>
                                    <div style={styles.eventTime}>{event.time}</div>
                                    <div
                                        style={{
                                            ...styles.eventTag,
                                            backgroundColor: event.color,
                                        }}
                                    >
                                        {event.type}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={styles.noEvents}>Энэ өдөр үйл явдал алга</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 