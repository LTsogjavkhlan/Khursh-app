import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { apiRequest } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import ApartmentAccessGate from '../components/ApartmentAccessGate'
import { useToast } from '../components/Toast'
import { FEATURE_DISABLED_MESSAGE, isFeatureDisabledError, disabledFeatureStyle } from '../utils/features'
import { DoorOpen, ShieldCheck, UserPlus, Plus, Trash2 } from 'lucide-react'

export default function LicensePlate() {
    const { hasApartmentAccess, hasFeature, refreshUser } = useAuth()
    const toast = useToast()
    const gateEnabled = hasFeature('gateOpen')
    const vehiclesEnabled = hasFeature('vehicleRegistration')
    const guestsEnabled = hasFeature('guestPass')
    const notifyDisabled = () => toast.show(FEATURE_DISABLED_MESSAGE)
    const headerRef = useRef(null)
    const gateButtonRef = useRef(null)
    const myCarsRef = useRef(null)
    const guestCarsRef = useRef(null)
    const formRef = useRef(null)

    const [licensePlate, setLicensePlate] = useState('')
    const [vehicleModel, setVehicleModel] = useState('')
    const [vehicleColor, setVehicleColor] = useState('')
    const [duration, setDuration] = useState('4')
    const [gateAnimating, setGateAnimating] = useState(false)
    const [lastOpened, setLastOpened] = useState(null)
    const [showAddGuest, setShowAddGuest] = useState(false)
    const [showAddVehicle, setShowAddVehicle] = useState(false)
    const [addingVehicle, setAddingVehicle] = useState(false)

    const [userVehicles, setUserVehicles] = useState([])
    const [guestPasses, setGuestPasses] = useState([])
    const [loadingVehicles, setLoadingVehicles] = useState(true)

    const loadVehicles = async () => {
        try {
            const data = await apiRequest('/api/vehicles')
            setUserVehicles(Array.isArray(data) ? data : [])
        } catch { setUserVehicles([]) }
        finally { setLoadingVehicles(false) }
    }

    const loadGuestPasses = async () => {
        try {
            const data = await apiRequest('/api/vehicles/guest-passes')
            setGuestPasses(Array.isArray(data) ? data : [])
        } catch { setGuestPasses([]) }
    }

    useEffect(() => { loadVehicles(); loadGuestPasses() }, [])

    // Pick up any feature changes the platform admin made since the last load
    useEffect(() => { refreshUser() }, [refreshUser])

    useEffect(() => {
        // Animate header
        gsap.from(headerRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        })

        // Animate gate button
        gsap.from(gateButtonRef.current, {
            y: 10,
            opacity: 0,
            scale: 0.95,
            duration: 0.5,
            delay: 0.2,
            ease: "back.out(1.7)"
        })

        // Animate my cars section
        gsap.from(myCarsRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.4,
            delay: 0.4,
            ease: "power1.out"
        })

        // Animate guest cars section
        gsap.from(guestCarsRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.4,
            delay: 0.5,
            ease: "power1.out"
        })
    }, [])

    const handleOpenGate = () => {
        if (!gateEnabled) return notifyDisabled()
        if (gateAnimating) return
        setGateAnimating(true)
        gsap.to(gateButtonRef.current, { scale: 0.95, duration: 0.2, yoyo: true, repeat: 1 })
        setTimeout(() => {
            setGateAnimating(false)
            setLastOpened(new Date())
        }, 2000)
    }

    const handleAddVehicle = async (e) => {
        e.preventDefault()
        if (!licensePlate || !vehicleModel) return
        setAddingVehicle(true)
        try {
            await apiRequest('/api/vehicles', {
                method: 'POST',
                body: JSON.stringify({ plate: licensePlate, model: vehicleModel, color: vehicleColor, isPrimary: userVehicles.length === 0 }),
            })
            await loadVehicles()
            setLicensePlate('')
            setVehicleModel('')
            setVehicleColor('')
            setShowAddVehicle(false)
        } catch (err) {
            // The HOA switched the feature off after this page loaded
            if (isFeatureDisabledError(err)) {
                setShowAddVehicle(false)
                notifyDisabled()
                refreshUser()
            } else {
                alert(err.message || 'Алдаа гарлаа.')
            }
        } finally {
            setAddingVehicle(false)
        }
    }

    const handleDeleteVehicle = async (id) => {
        if (!window.confirm('Энэ машиныг устгах уу?')) return
        try {
            await apiRequest(`/api/vehicles/${id}`, { method: 'DELETE' })
            setUserVehicles(userVehicles.filter(v => v._id !== id))
        } catch (err) {
            alert(err.message || 'Устгахад алдаа гарлаа.')
        }
    }

    const handleAddGuest = async (e) => {
        e.preventDefault()
        if (!licensePlate) return
        const hours = { '4': 4, '8': 8, '24': 24 }[duration] || 4
        const expiresAt = new Date(Date.now() + hours * 3600000).toISOString()
        try {
            await apiRequest('/api/vehicles/guest-passes', {
                method: 'POST',
                body: JSON.stringify({ plate: licensePlate.toUpperCase(), expiresAt }),
            })
            await loadGuestPasses()
            setLicensePlate('')
            setShowAddGuest(false)
        } catch (err) {
            if (isFeatureDisabledError(err)) {
                setShowAddGuest(false)
                notifyDisabled()
                refreshUser()
            } else {
                alert(err.message || 'Алдаа гарлаа.')
            }
        }
    }

    const handleDeleteGuest = async (id) => {
        if (!window.confirm('Энэ зочны дугаарыг устгах уу?')) return
        try {
            await apiRequest(`/api/vehicles/guest-passes/${id}`, { method: 'DELETE' })
            setGuestPasses(guestPasses.filter(p => p._id !== id))
        } catch (err) {
            alert(err.message || 'Устгахад алдаа гарлаа.')
        }
    }

    const formatLastOpened = (date) => {
        if (!date) return 'Байхгүй'
        return `Өнөөдөр ${new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} цагт`
    }

    // Inline styles for consistent rendering
    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px 0 80px' },
        header: { marginBottom: '24px' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' },
        headerSubtitle: { fontSize: '14px', color: colors.textMuted },
        gateButton: {
            width: '100%', padding: '16px', marginBottom: '24px', borderRadius: '16px',
            backgroundColor: colors.accent, boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
        },
        gateButtonText: { color: 'white', fontSize: '18px', fontWeight: '600', marginLeft: '12px' },
        gateIcon: { width: '24px', height: '24px', color: 'white' },
        gateInfo: { fontSize: '13px', color: colors.textMuted, textAlign: 'center', marginTop: '-16px', marginBottom: '24px' },
        sectionTitle: {
            fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        },
        carsList: { marginBottom: '24px' },
        carItem: {
            backgroundColor: colors.surface, borderRadius: '16px', padding: '16px',
            marginBottom: '12px', boxShadow: `0 2px 4px ${colors.shadow}`,
            border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center',
        },
        primaryTag: {
            backgroundColor: colors.accentBg, color: colors.accent, fontSize: '12px',
            fontWeight: '500', padding: '2px 8px', borderRadius: '9999px', marginLeft: 'auto',
        },
        plateNumber: {
            backgroundColor: colors.surfaceAlt, color: colors.text, padding: '4px 8px',
            borderRadius: '6px', fontSize: '16px', fontWeight: '600',
            marginBottom: '4px', display: 'inline-block',
        },
        vehicleDetails: { fontSize: '14px', color: colors.textMuted },
        addButton: {
            backgroundColor: colors.surfaceAlt, border: `1px dashed ${colors.border}`,
            borderRadius: '16px', padding: '16px', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: '24px',
        },
        addButtonText: { color: colors.textMuted, fontSize: '14px', fontWeight: '500', marginLeft: '8px' },
        addIcon: { width: '20px', height: '20px', color: colors.textMuted },
        formContainer: {
            backgroundColor: colors.surface, borderRadius: '16px', padding: '16px',
            marginBottom: '24px', boxShadow: `0 4px 6px -1px ${colors.shadow}`,
            border: `1px solid ${colors.border}`,
        },
        formTitle: { fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '16px' },
        formGroup: { marginBottom: '16px' },
        label: { display: 'block', fontSize: '14px', fontWeight: '500', color: colors.textSub, marginBottom: '4px' },
        input: {
            width: '100%', padding: '10px 12px', borderRadius: '8px',
            border: `1px solid ${colors.border}`, fontSize: '14px',
            backgroundColor: colors.surfaceAlt, color: colors.text,
        },
        select: {
            width: '100%', padding: '10px 12px', borderRadius: '8px',
            border: `1px solid ${colors.border}`, fontSize: '14px',
            backgroundColor: colors.surfaceAlt, color: colors.text,
        },
        submitButton: {
            width: '100%', padding: '12px', backgroundColor: colors.accent,
            color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px',
            fontWeight: '500', cursor: 'pointer',
        },
        cancelButton: {
            width: '100%', padding: '12px', backgroundColor: colors.surfaceAlt,
            color: colors.textSub, border: `1px solid ${colors.border}`, borderRadius: '8px',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '8px',
        },
        expiryTag: { backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '12px', fontWeight: '500', padding: '2px 8px', borderRadius: '9999px', marginLeft: 'auto' },
        guestVehicle: { display: 'flex', flexDirection: 'column' },
        guestInfo: { display: 'flex', flexDirection: 'column', flex: '1' },
        licensePlateIcon: {
            width: '40px', height: '40px', backgroundColor: colors.accentBg,
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginRight: '12px', color: colors.accent,
        },
        guestName: { fontSize: '14px', fontWeight: '500', color: colors.text },
        viewAllButton: { color: colors.accent, fontSize: '14px', fontWeight: '500', textDecoration: 'none' },
    };

    if (!hasApartmentAccess) {
        return <ApartmentAccessGate title="Хаалганы хандалт байхгүй" message="Хаалга онгойлгох, тээврийн хэрэгсэл бүртгэхийн тулд СӨХ-д бүртгэлтэй орон сууцтай байх шаардлагатай. Профайл хэсгээс орон сууцаа нэмэх эсвэл эзэмшигчээсээ түрээслэгчийн хандалт хүсээрэй." />
    }

    return (
        <div style={styles.container}>
            {/* Header Section */}
            <header ref={headerRef} style={styles.header}>
                <h1 style={styles.headerTitle}>Тээврийн хэрэгсэл & Хаалт удирдах</h1>
            </header>

            {/* Gate Button */}
            {/* Stays tappable when the feature is off, so the tap can explain why */}
            <button
                ref={gateButtonRef}
                style={gateEnabled ? styles.gateButton : { ...styles.gateButton, ...disabledFeatureStyle(colors) }}
                onClick={handleOpenGate}
                disabled={gateAnimating}
                aria-disabled={!gateEnabled}
            >
                <DoorOpen style={gateEnabled ? styles.gateIcon : { ...styles.gateIcon, color: colors.textMuted }} />
                <span style={gateEnabled ? styles.gateButtonText : { ...styles.gateButtonText, color: colors.textMuted }}>
                    {gateAnimating ? 'Хаалт нээгдэж байна…' : 'Хаалт нээх'}
                </span>
            </button>

            <p style={styles.gateInfo}>
                {gateEnabled ? `Сүүлд нээсэн цаг: ${formatLastOpened(lastOpened)}` : FEATURE_DISABLED_MESSAGE}
            </p>

            {/* My Cars Section */}
            <section ref={myCarsRef} style={styles.carsList}>
                <div style={styles.sectionTitle}>
                    <span>Бүртгэлтэй машин</span>
                </div>

                {loadingVehicles ? (
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>Ачаалж байна...</p>
                ) : userVehicles.length === 0 ? (
                    <div style={{ ...styles.carItem, justifyContent: 'center', color: '#6B7280' }}>
                        Бүртгэлтэй машин байхгүй байна
                    </div>
                ) : userVehicles.map(vehicle => (
                    <div key={vehicle._id} style={styles.carItem}>
                        <div style={styles.licensePlateIcon}>
                            <ShieldCheck size={24} />
                        </div>
                        <div style={styles.guestVehicle}>
                            <span style={styles.plateNumber}>{vehicle.plate}</span>
                            <span style={styles.vehicleDetails}>{vehicle.model}{vehicle.color ? ` • ${vehicle.color}` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                            {vehicle.isPrimary && <span style={styles.primaryTag}>Үндсэн</span>}
                            <button
                                onClick={() => handleDeleteVehicle(vehicle._id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Устгах
                            </button>
                        </div>
                    </div>
                ))}

                {showAddVehicle ? (
                    <div style={styles.formContainer}>
                        <h3 style={styles.formTitle}>Машин бүртгэх</h3>
                        <form onSubmit={handleAddVehicle}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Улсын дугаар</label>
                                <input type="text" style={styles.input} placeholder="Жишээ: 2959УЕВ" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Машины марк</label>
                                <input type="text" style={styles.input} placeholder="Жишээ: Toyota Sai" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Өнгө</label>
                                <input type="text" style={styles.input} placeholder="Жишээ: Цагаан" value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} />
                            </div>
                            <button type="submit" disabled={addingVehicle} style={styles.submitButton}>
                                {addingVehicle ? 'Хадгалж байна...' : 'Бүртгэх'}
                            </button>
                            <button type="button" style={styles.cancelButton} onClick={() => setShowAddVehicle(false)}>Цуцлах</button>
                        </form>
                    </div>
                ) : (
                    <button
                        style={vehiclesEnabled ? styles.addButton : { ...styles.addButton, ...disabledFeatureStyle(colors) }}
                        onClick={() => (vehiclesEnabled ? setShowAddVehicle(true) : notifyDisabled())}
                        aria-disabled={!vehiclesEnabled}
                    >
                        <Plus style={styles.addIcon} />
                        <span style={styles.addButtonText}>Шинээр машин нэмэх</span>
                    </button>
                )}
            </section>

            {/* Guest Access Section */}
            <section ref={guestCarsRef} style={styles.carsList}>
                <div style={styles.sectionTitle}>
                    <span>Зочин нэмэх <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6B7280', marginLeft: '8px' }}></span></span>
                    <a href="#" style={styles.viewAllButton}>Түүх</a>
                </div>

                {guestPasses.length > 0 ? (
                    <>
                        {guestPasses.map(guest => {
                            const expiry = new Date(guest.expiresAt)
                            const now = new Date()
                            const isExpired = expiry < now
                            const expiresStr = expiry.toLocaleString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            return (
                                <div key={guest._id} style={{ ...styles.carItem, opacity: isExpired ? 0.5 : 1 }}>
                                    <div style={styles.licensePlateIcon}>
                                        <UserPlus size={24} />
                                    </div>
                                    <div style={styles.guestInfo}>
                                        <span style={styles.plateNumber}>{guest.plate}</span>
                                        <span style={{ fontSize: '12px', color: isExpired ? '#ef4444' : '#6B7280' }}>
                                            {isExpired ? 'Хугацаа дууссан' : `${expiresStr} хүртэл`}
                                        </span>
                                    </div>
                                    <button onClick={() => handleDeleteGuest(guest._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ef4444' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )
                        })}
                    </>
                ) : (
                    <div style={{ ...styles.carItem, justifyContent: 'center', color: '#6B7280' }}>
                        Идэвхтэй зочин байхгүй байна
                    </div>
                )}

                {showAddGuest ? (
                    <div ref={formRef} style={styles.formContainer}>
                        <h3 style={styles.formTitle}>Зочин нэмэх</h3>
                        <form onSubmit={handleAddGuest}>
                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="licensePlate">
                                    Улсын дугаараа оруулна уу
                                </label>
                                <input
                                    id="licensePlate"
                                    type="text"
                                    style={styles.input}
                                    placeholder="Улсын дугаар оруулна уу"
                                    value={licensePlate}
                                    onChange={e => setLicensePlate(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="duration">
                                    Нэвтрэх хугацаа
                                </label>
                                <select
                                    id="duration"
                                    style={styles.select}
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                >
                                    <option value="4">4 цаг</option>
                                    <option value="8">8 цаг</option>
                                    <option value="24">24 цаг</option>
                                </select>
                            </div>

                            <button type="submit" style={styles.submitButton}>
                                Зочин нэмэх
                            </button>
                            <button
                                type="button"
                                style={styles.cancelButton}
                                onClick={() => setShowAddGuest(false)}
                            >
                                Цуцлах
                            </button>
                        </form>
                    </div>
                ) : (
                    <button
                        style={guestsEnabled ? styles.addButton : { ...styles.addButton, ...disabledFeatureStyle(colors) }}
                        onClick={() => (guestsEnabled ? setShowAddGuest(true) : notifyDisabled())}
                        aria-disabled={!guestsEnabled}
                    >
                        <Plus style={styles.addIcon} />
                        <span style={styles.addButtonText}>Зочин нэмэх</span>
                    </button>
                )}
            </section>
        </div>
    )
} 