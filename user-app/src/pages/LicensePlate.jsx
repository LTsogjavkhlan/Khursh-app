import { useState, useEffect } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ApartmentAccessGate from '../components/ApartmentAccessGate'
import { useToast } from '../components/Toast'
import PageHeader from '../components/ui/PageHeader'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusPill from '../components/ui/StatusPill'
import Dialog from '../components/ui/Dialog'
import Field, { inputCls } from '../components/ui/Field'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { FEATURE_DISABLED_MESSAGE, isFeatureDisabledError } from '../utils/features'
import { dayLabel, timeLabel } from '../utils/format'
import { DoorOpen, Car, UserPlus, Plus, Trash2, Check } from 'lucide-react'

const DURATIONS = [['4', '4 цаг'], ['8', '8 цаг'], ['24', '24 цаг']]

// A licence plate rendered like a plate: bordered and letter-spaced
function Plate({ children }) {
    return (
        <span className="inline-flex items-center rounded-[6px] border-2 border-ink/80 bg-surface px-2 py-0.5 text-[15px] font-bold tracking-[0.08em] text-ink">
            {children}
        </span>
    )
}

function IconDelete({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title="Устгах"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger-text ${FOCUS_RING}`}
        >
            <Trash2 size={18} aria-hidden="true" />
        </button>
    )
}

export default function LicensePlate() {
    const { hasApartmentAccess, hasFeature, refreshUser } = useAuth()
    const toast = useToast()
    const gateEnabled = hasFeature('gateOpen')
    const vehiclesEnabled = hasFeature('vehicleRegistration')
    const guestsEnabled = hasFeature('guestPass')
    const notifyDisabled = () => toast.show(FEATURE_DISABLED_MESSAGE)

    const [licensePlate, setLicensePlate] = useState('')
    const [vehicleModel, setVehicleModel] = useState('')
    const [vehicleColor, setVehicleColor] = useState('')
    const [guestPlate, setGuestPlate] = useState('')
    const [duration, setDuration] = useState('4')
    const [gateAnimating, setGateAnimating] = useState(false)
    const [lastOpened, setLastOpened] = useState(null)
    const [showAddGuest, setShowAddGuest] = useState(false)
    const [showAddVehicle, setShowAddVehicle] = useState(false)
    const [addingVehicle, setAddingVehicle] = useState(false)
    const [addingGuest, setAddingGuest] = useState(false)

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

    const handleOpenGate = () => {
        if (!gateEnabled) return notifyDisabled()
        if (gateAnimating) return
        setGateAnimating(true)
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
            toast.show('Машин бүртгэгдлээ')
        } catch (err) {
            // The HOA switched the feature off after this page loaded
            if (isFeatureDisabledError(err)) {
                setShowAddVehicle(false)
                notifyDisabled()
                refreshUser()
            } else {
                toast.show(err.message || 'Алдаа гарлаа. Дахин оролдоно уу.')
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
            toast.show(err.message || 'Устгахад алдаа гарлаа.')
        }
    }

    const handleAddGuest = async (e) => {
        e.preventDefault()
        if (!guestPlate) return
        const hours = { '4': 4, '8': 8, '24': 24 }[duration] || 4
        const expiresAt = new Date(Date.now() + hours * 3600000).toISOString()
        setAddingGuest(true)
        try {
            await apiRequest('/api/vehicles/guest-passes', {
                method: 'POST',
                body: JSON.stringify({ plate: guestPlate.toUpperCase(), expiresAt }),
            })
            await loadGuestPasses()
            setGuestPlate('')
            setShowAddGuest(false)
            toast.show('Зочны машин нэмэгдлээ')
        } catch (err) {
            if (isFeatureDisabledError(err)) {
                setShowAddGuest(false)
                notifyDisabled()
                refreshUser()
            } else {
                toast.show(err.message || 'Алдаа гарлаа. Дахин оролдоно уу.')
            }
        } finally {
            setAddingGuest(false)
        }
    }

    const handleDeleteGuest = async (id) => {
        if (!window.confirm('Энэ зочны дугаарыг устгах уу?')) return
        try {
            await apiRequest(`/api/vehicles/guest-passes/${id}`, { method: 'DELETE' })
            setGuestPasses(guestPasses.filter(p => p._id !== id))
        } catch (err) {
            toast.show(err.message || 'Устгахад алдаа гарлаа.')
        }
    }

    if (!hasApartmentAccess) {
        return <ApartmentAccessGate title="Хаалганы хандалт байхгүй" message="Хаалга онгойлгох, тээврийн хэрэгсэл бүртгэхийн тулд СӨХ-д бүртгэлтэй орон сууцтай байх шаардлагатай. Профайл хэсгээс орон сууцаа нэмэх эсвэл эзэмшигчээсээ түрээслэгчийн хандалт хүсээрэй." />
    }

    const addButton = (enabled, label, onOpen) => (
        <button
            type="button"
            onClick={() => (enabled ? onOpen() : notifyDisabled())}
            aria-disabled={!enabled}
            className={`flex h-12 w-full items-center justify-center gap-1.5 rounded-card border border-dashed text-sm font-semibold transition-colors ${FOCUS_RING} ${
                enabled ? 'border-line-strong/60 text-ink-secondary hover:bg-surface-muted' : 'cursor-not-allowed border-line text-ink-muted'
            }`}
        >
            <Plus size={16} aria-hidden="true" /> {label}
        </button>
    )

    return (
        <div className="space-y-8 pb-4 pt-2">
            <PageHeader title="Хаалт ба машин" description="Хаалт нээх, өөрийн болон зочны машин бүртгэх" />

            {/* Gate control */}
            <section aria-label="Хаалт" className="rounded-[24px] px-5 py-7 text-center text-white" style={{ background: 'linear-gradient(165deg, #1E4740 0%, #183B35 60%, #0F2A25 100%)' }}>
                <button
                    type="button"
                    onClick={handleOpenGate}
                    disabled={gateAnimating}
                    aria-disabled={!gateEnabled}
                    aria-label={gateAnimating ? 'Хаалт нээгдэж байна' : 'Хаалт нээх'}
                    className={`relative mx-auto flex h-36 w-36 items-center justify-center rounded-full transition-transform duration-150 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 ${
                        gateEnabled ? 'bg-white text-[#183B35] shadow-[0_12px_40px_rgba(0,0,0,0.35)]' : 'cursor-not-allowed bg-white/15 text-white/50'
                    }`}
                >
                    {gateAnimating && (
                        <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-white/40 motion-reduce:animate-none" />
                    )}
                    <span className="relative flex flex-col items-center gap-1.5">
                        <DoorOpen size={40} strokeWidth={1.8} aria-hidden="true" />
                        <span className="text-[15px] font-semibold">{gateAnimating ? 'Нээж байна…' : 'Хаалт нээх'}</span>
                    </span>
                </button>
                <p className="mt-5 text-sm text-white/70" aria-live="polite">
                    {!gateEnabled ? FEATURE_DISABLED_MESSAGE
                        : lastOpened ? <span className="inline-flex items-center gap-1.5"><Check size={15} aria-hidden="true" /> Өнөөдөр {timeLabel(lastOpened)} цагт нээсэн</span>
                        : 'Товчийг дарж хаалтыг нээнэ'}
                </p>
            </section>

            {/* My vehicles */}
            <section aria-labelledby="my-cars" className="space-y-3">
                <h2 id="my-cars" className="text-[15px] font-semibold text-ink-muted">Бүртгэлтэй машин</h2>
                {loadingVehicles ? (
                    <SkeletonBlock className="h-20 rounded-card" />
                ) : userVehicles.length > 0 ? (
                    <Card padded={false}>
                        <ul className="divide-y divide-line">
                            {userVehicles.map(vehicle => (
                                <li key={vehicle._id} className="flex items-center gap-3 py-3 pl-4 pr-2">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                                        <Car size={20} aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <Plate>{vehicle.plate}</Plate>
                                        <p className="mt-1 truncate text-xs text-ink-muted">{vehicle.model}{vehicle.color ? ` · ${vehicle.color}` : ''}</p>
                                    </div>
                                    {vehicle.isPrimary && <StatusPill tone="success" icon={false}>Үндсэн</StatusPill>}
                                    <IconDelete label={`${vehicle.plate} машиныг устгах`} onClick={() => handleDeleteVehicle(vehicle._id)} />
                                </li>
                            ))}
                        </ul>
                    </Card>
                ) : (
                    <p className="text-sm text-ink-muted">Бүртгэлтэй машин байхгүй байна.</p>
                )}
                {addButton(vehiclesEnabled, 'Шинээр машин нэмэх', () => setShowAddVehicle(true))}
            </section>

            {/* Guest passes */}
            <section aria-labelledby="guest-cars" className="space-y-3">
                <h2 id="guest-cars" className="text-[15px] font-semibold text-ink-muted">Зочны машин</h2>
                {guestPasses.length > 0 ? (
                    <Card padded={false}>
                        <ul className="divide-y divide-line">
                            {guestPasses.map(guest => {
                                const expiry = new Date(guest.expiresAt)
                                const isExpired = expiry < new Date()
                                return (
                                    <li key={guest._id} className={`flex items-center gap-3 py-3 pl-4 pr-2 ${isExpired ? 'opacity-60' : ''}`}>
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-secondary">
                                            <UserPlus size={20} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <Plate>{guest.plate}</Plate>
                                            <p className={`mt-1 text-xs ${isExpired ? 'text-danger-text' : 'text-ink-muted'}`}>
                                                {isExpired ? 'Хугацаа дууссан' : `${dayLabel(expiry)}, ${timeLabel(expiry)} хүртэл`}
                                            </p>
                                        </div>
                                        <IconDelete label={`${guest.plate} зочны дугаарыг устгах`} onClick={() => handleDeleteGuest(guest._id)} />
                                    </li>
                                )
                            })}
                        </ul>
                    </Card>
                ) : (
                    <p className="text-sm text-ink-muted">Идэвхтэй зочин байхгүй байна.</p>
                )}
                {addButton(guestsEnabled, 'Зочин нэмэх', () => setShowAddGuest(true))}
            </section>

            {/* Add vehicle */}
            <Dialog open={showAddVehicle} onClose={() => setShowAddVehicle(false)} title="Машин бүртгэх">
                <form onSubmit={handleAddVehicle} className="space-y-4">
                    <Field label="Улсын дугаар">
                        <input className={`${inputCls} uppercase tracking-wider`} placeholder="Жишээ: 2959УЕВ…" autoComplete="off" spellCheck={false}
                            value={licensePlate} onChange={e => setLicensePlate(e.target.value)} required />
                    </Field>
                    <Field label="Машины марк">
                        <input className={inputCls} placeholder="Жишээ: Toyota Prius…" autoComplete="off"
                            value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} required />
                    </Field>
                    <Field label="Өнгө (заавал биш)">
                        <input className={inputCls} placeholder="Жишээ: Цагаан…" autoComplete="off"
                            value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} />
                    </Field>
                    <Button type="submit" fullWidth loading={addingVehicle}>Бүртгэх</Button>
                </form>
            </Dialog>

            {/* Add guest */}
            <Dialog open={showAddGuest} onClose={() => setShowAddGuest(false)} title="Зочин нэмэх" description="Зочны машин сонгосон хугацаанд хаалтаар нэвтэрнэ.">
                <form onSubmit={handleAddGuest} className="space-y-5">
                    <Field label="Улсын дугаар">
                        <input className={`${inputCls} uppercase tracking-wider`} placeholder="Жишээ: 1234УБА…" autoComplete="off" spellCheck={false}
                            value={guestPlate} onChange={e => setGuestPlate(e.target.value)} required />
                    </Field>
                    <fieldset>
                        <legend className="mb-1.5 text-[13px] font-medium text-ink-secondary">Нэвтрэх хугацаа</legend>
                        <div className="grid grid-cols-3 gap-2">
                            {DURATIONS.map(([value, label]) => (
                                <label key={value} className={`flex h-11 cursor-pointer items-center justify-center rounded-control border text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-text ${
                                    duration === value ? 'border-brand-text bg-brand-soft text-brand-text' : 'border-line text-ink-secondary hover:bg-surface-muted'
                                }`}>
                                    <input type="radio" name="duration" value={value} checked={duration === value} onChange={() => setDuration(value)} className="sr-only" />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <Button type="submit" fullWidth loading={addingGuest}>Зочин нэмэх</Button>
                </form>
            </Dialog>
        </div>
    )
}
