import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useTheme } from '../context/ThemeContext'

export default function Rules() {
    const headerRef = useRef(null)
    const rulesRef = useRef([])

    // Sample rules data for the apartment complex
    const [rules,] = useState([
        {
            id: 1,
            title: 'Ерөнхий дүрэм',
            items: [
                'Оршин суугчид бие биенийхээ амар тайван байдлыг хүндэтгэж, чимээ шуугиан гаргахгүй байх',
                'Нийтийн эзэмшлийн талбайд хог хаяхгүй байх',
                'Орон сууцны нийтийн талбайг эвдэж гэмтээхгүй байх',
                'Дуу чимээ гаргах хориотой цаг: 22:00-8:00'
            ]
        },
        {
            id: 2,
            title: 'Автомашины дүрэм',
            items: [
                'Зориулалтын зогсоолд л автомашинаа байрлуулах',
                'Орон сууцны гарц хаах хэлбэрээр зогсоохыг хориглоно',
                'Зочны автомашин 24 цагаас илүү зогсоохыг хориглоно',
                'Нэг айлд хамгийн ихдээ 2 автомашины зөвшөөрөл олгоно'
            ]
        },
        {
            id: 3,
            title: 'Хог хаягдлын дүрэм',
            items: [
                'Хог хаягдлыг зориулалтын хогийн савнуудад ангилан хаях',
                'Том хэмжээтэй эд зүйлс хаяхдаа СӨХ-тэй урьдчилан зөвшилцөх',
                'Барилгын хог хаягдлыг зөвшөөрөлгүйгээр хаяхыг хориглоно',
                'Хог хаях цаг: Өглөө 8:00-10:00, Оройн 18:00-20:00'
            ]
        },
        {
            id: 4,
            title: 'Гал түймрийн аюулгүй байдал',
            items: [
                'Нийтийн талбайд гал түймэр гарч болзошгүй үйл ажиллагаа явуулахгүй байх',
                'Гал унтраагуур, гал дэмжих систем зэргийг гэмтээхгүй байх',
                'Гал түймрийн дохиоллын системийг эвдэхгүй байх',
                'Гал гарсан үед 101 дугаарт яаралтай мэдэгдэх'
            ]
        },
        {
            id: 5,
            title: 'Дундын өмчийн хамгаалалт',
            items: [
                'Шат, зогсоол, коридор зэрэг дундын өмчийн талбайд эд зүйлс байрлуулахгүй байх',
                'Нийтийн эзэмшлийн талбайг өөрийн хэрэгцээнд дур мэдэн өөрчлөхгүй байх',
                'Нийтийн талбайн цэцэрлэг, ургамлыг эвдэхгүй, хамгаалах',
                'Нийтийн талбайн камер, гэрэлтүүлэг зэргийг эвдэхгүй байх'
            ]
        }
    ])

    useEffect(() => {
        // Animate header
        gsap.from(headerRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        })

        // Animate rules sections with stagger
        gsap.from(rulesRef.current, {
            y: 20,
            opacity: 0,
            stagger: 0.1,
            duration: 0.4,
            delay: 0.2,
            ease: "power1.out"
        })
    }, [])

    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px 0 80px' },
        header: { marginBottom: '24px' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' },
        headerSubtitle: { fontSize: '14px', color: colors.textMuted },
        ruleSection: {
            backgroundColor: colors.surface, borderRadius: '12px', padding: '20px',
            marginBottom: '16px', boxShadow: `0 2px 4px ${colors.shadow}`,
            border: `1px solid ${colors.border}`,
        },
        ruleTitle: {
            fontSize: '18px', fontWeight: '600', color: colors.text,
            marginBottom: '16px', display: 'flex', alignItems: 'center',
        },
        ruleIcon: { width: '24px', height: '24px', marginRight: '8px', color: colors.accent },
        ruleList: { listStyle: 'none', padding: '0', margin: '0' },
        ruleItem: {
            display: 'flex', alignItems: 'flex-start', marginBottom: '12px',
            fontSize: '15px', color: colors.textSub, lineHeight: '1.5',
        },
        bulletPoint: {
            minWidth: '24px', height: '24px', borderRadius: '50%',
            backgroundColor: colors.accentBg, color: colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: '12px', fontSize: '12px', fontWeight: '600',
        },
        note: {
            fontSize: '14px', color: colors.textMuted,
            backgroundColor: colors.surfaceAlt, padding: '12px 16px',
            borderRadius: '8px', marginTop: '16px', borderLeft: `3px solid ${colors.accent}`,
        }
    };

    return (
        <div style={styles.container}>
            <header ref={headerRef} style={styles.header}>
                <h1 style={styles.headerTitle}>Орон сууцны дүрэм</h1>
                <p style={styles.headerSubtitle}>Хамтдаа амар тайван, аюулгүй орчинд амьдрах дүрмүүд</p>
            </header>

            <div>
                {rules.map((ruleSection, index) => (
                    <div
                        key={ruleSection.id}
                        style={styles.ruleSection}
                        ref={el => rulesRef.current[index] = el}
                    >
                        <h2 style={styles.ruleTitle}>
                            <svg xmlns="http://www.w3.org/2000/svg" style={styles.ruleIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {ruleSection.title}
                        </h2>

                        <ul style={styles.ruleList}>
                            {ruleSection.items.map((item, idx) => (
                                <li key={idx} style={styles.ruleItem}>
                                    <span style={styles.bulletPoint}>{idx + 1}</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <div style={styles.note}>
                    <p>Тайлбар: Дээрх дүрмүүд нь орон сууцны хамтын амьдралыг зохицуулах үндсэн дүрмүүд болно.</p>
                </div>
            </div>
        </div>
    )
} 