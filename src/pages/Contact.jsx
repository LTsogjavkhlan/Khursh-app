import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useTheme } from '../context/ThemeContext'

export default function Contact() {
    const headerRef = useRef(null)
    const contentRef = useRef(null)

    useEffect(() => {
        const headerAnim = gsap.from(headerRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        });

        const contentAnim = gsap.from(contentRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: 0.2,
            ease: "power1.out"
        });

        return () => {
            headerAnim.kill();
            contentAnim.kill();
        };
    }, []);

    // Contact info data
    const contactGroups = [
        {
            id: 'СӨХ',
            title: 'Голден Хилл сууц өмчлөгчдын холбоо',
            contacts: [
                { label: 'Утасны дугаар', value: '+976 8076 8880' },
                { label: 'Цахим шуудан', value: '6817007@muls.edu.mn' }
            ]
        },
        {
            id: 'heating',
            title: 'Батбаян дулаан',
            contacts: [
                { label: 'Утасны дугаар', value: '+976 9988 7766' },
                { label: 'Цахим шуудан', value: 'info@soh-app.mn' }
            ]
        },
        {
            id: 'electric',
            title: 'Улаанбаатар цахилгаан түгээх сүлжээ',
            contacts: [
                { label: 'Дуудлагын төв', value: '7004-7004' },
                { label: 'Утас', value: '976-11-342420' },
                { label: 'Цахим шуудан', value: 'info@ubedn.mn' }
            ]
        },
        {
            id: 'elevator',
            title: 'Лифтчин',
            contacts: [
                { label: 'Утасны дугаар', value: '99548795, 88465265' }
            ]
        }
    ];

    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px', paddingBottom: '72px' },
        header: { marginBottom: '24px' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text },
        headerSubtitle: { color: colors.textMuted, marginTop: '4px' },
        contactGroup: {
            backgroundColor: colors.surface, borderRadius: '12px', padding: '16px',
            marginBottom: '16px', boxShadow: `0 1px 3px ${colors.shadow}`, border: `1px solid ${colors.border}`,
        },
        contactGroupTitle: {
            fontSize: '17px', fontWeight: '600', color: colors.text,
            marginBottom: '12px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px',
        },
        contactItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' },
        contactLabel: { fontSize: '14px', color: colors.textMuted, fontWeight: '500' },
        contactValue: { fontSize: '15px', color: colors.text, fontWeight: '500' },
        icon: { color: colors.accent, marginRight: '8px', width: '18px', height: '18px' },
    };

    return (
        <div style={styles.container}>
            <header style={styles.header} ref={headerRef}>
                <h1 style={styles.headerTitle}>Холбоо барих</h1>
                <p style={styles.headerSubtitle}>Холбогдох дугаарууд</p>
            </header>

            <div ref={contentRef}>
                {contactGroups.map(group => (
                    <div key={group.id} style={styles.contactGroup}>
                        <h2 style={styles.contactGroupTitle}>{group.title}</h2>
                        {group.contacts.map((contact, index) => (
                            <div key={index} style={styles.contactItem}>
                                <span style={styles.contactLabel}>{contact.label}:</span>
                                <span style={styles.contactValue}>{contact.value}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
} 