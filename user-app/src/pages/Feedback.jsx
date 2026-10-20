import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { submitFeedback, fetchMyFeedback } from '../api/feedback'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast'
import PageHeader from '../components/ui/PageHeader'
import SegmentedTabs from '../components/ui/SegmentedTabs'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusPill from '../components/ui/StatusPill'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { inputCls } from '../components/ui/Field'
import { resizeImage } from '../utils/imageResize'
import { fullDate } from '../utils/format'
import { ImagePlus, X, MessageSquareWarning, Lightbulb, Wrench, MessageSquare, Send } from 'lucide-react'

const MAX_IMAGES = 3
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const CATEGORIES = [
    { id: 'Гомдол', icon: MessageSquareWarning, placeholder: 'Гомдлоо энд бичнэ үү…' },
    { id: 'Шинэ санаа', icon: Lightbulb, placeholder: 'Саналаа энд бичнэ үү…' },
    { id: 'Эвдрэл гэмтэл', icon: Wrench, placeholder: 'Эвдрэл гэмтлийн байршил, тайлбарыг бичнэ үү…' },
]

const STATUS = {
    open: { label: 'Нээлттэй', tone: 'warning' },
    in_progress: { label: 'Ажиллаж байна', tone: 'info' },
    resolved: { label: 'Шийдэгдсэн', tone: 'success' },
}

export default function Feedback() {
    const { user } = useAuth()
    const location = useLocation()
    const toast = useToast()

    // If navigated here from a notification, open the history tab directly
    const [activeTab, setActiveTab] = useState(
        location.state?.tab === 'history' ? 'history' : 'submit'
    )
    const [selectedCategory, setSelectedCategory] = useState('Гомдол')
    const [feedbackText, setFeedbackText] = useState('')
    const [images, setImages] = useState([])
    const [preparingImages, setPreparingImages] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [myFeedback, setMyFeedback] = useState([])
    const [loadingFeedback, setLoadingFeedback] = useState(false)

    const loadMyFeedback = async () => {
        setLoadingFeedback(true)
        try {
            const data = await fetchMyFeedback()
            setMyFeedback(Array.isArray(data) ? data : [])
        } catch { setMyFeedback([]) }
        finally { setLoadingFeedback(false) }
    }

    useEffect(() => {
        if (activeTab === 'history') loadMyFeedback()
    }, [activeTab])

    // Free preview URLs when the page unmounts
    const imagesRef = useRef(images)
    imagesRef.current = images
    useEffect(() => () => imagesRef.current.forEach(img => URL.revokeObjectURL(img.preview)), [])

    // Add photos: shrink each on the device first, then enforce the limits
    const handleImageUpload = async (e) => {
        const input = e.target
        const picked = Array.from(input.files || [])
        input.value = '' // allow picking the same file again later
        if (picked.length === 0) return

        const room = MAX_IMAGES - images.length
        if (picked.length > room) {
            toast.show(`Хамгийн ихдээ ${MAX_IMAGES} зураг хавсаргах боломжтой`)
        }

        setPreparingImages(true)
        try {
            const added = []
            for (const original of picked.slice(0, Math.max(room, 0))) {
                const file = await resizeImage(original)
                if (file.size > MAX_IMAGE_BYTES) {
                    toast.show('Зураг тус бүр 5MB-аас ихгүй байх ёстой')
                    continue
                }
                added.push({
                    id: Date.now() + Math.random().toString(36).substring(7),
                    file,
                    preview: URL.createObjectURL(file),
                })
            }
            setImages(prev => [...prev, ...added])
        } finally {
            setPreparingImages(false)
        }
    }

    const removeImage = (id) => {
        const img = images.find(i => i.id === id)
        if (img) URL.revokeObjectURL(img.preview)
        setImages(images.filter(i => i.id !== id))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            await submitFeedback({
                title: selectedCategory,
                description: feedbackText,
                type: selectedCategory,
                images: images.map(img => img.file),
            })

            setSubmitting(false)
            setFeedbackText('')
            images.forEach(img => URL.revokeObjectURL(img.preview))
            setImages([])
            toast.show('Таны санал амжилттай илгээгдлээ. Баярлалаа!')
        } catch (err) {
            setSubmitting(false)
            toast.show(err.message || 'Санал илгээхэд алдаа гарлаа. Дахин оролдоно уу.')
        }
    }

    const category = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0]
    const full = images.length >= MAX_IMAGES
    const pickerBlocked = full || preparingImages || submitting
    const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : ''

    return (
        <div className="pb-4 pt-2">
            <PageHeader title="Санал, гомдол" description={`${user?.hoaName || 'СӨХ'}-д санал, гомдол илгээх`} />

            <SegmentedTabs
                label="Санал, гомдлын хэсэг"
                value={activeTab}
                onChange={setActiveTab}
                className="mb-6"
                tabs={[{ id: 'submit', label: 'Илгээх' }, { id: 'history', label: 'Миний гомдлууд' }]}
            />

            {activeTab === 'history' ? (
                <section aria-label="Миний гомдлууд">
                    {loadingFeedback ? (
                        <div className="space-y-3"><SkeletonBlock className="h-28 rounded-card" /><SkeletonBlock className="h-28 rounded-card" /></div>
                    ) : myFeedback.length === 0 ? (
                        <Card><EmptyState icon={MessageSquare} title="Илгээсэн санал, гомдол алга" description="Илгээсэн санал, гомдол болон СӨХ-ийн хариу энд харагдана." className="py-6" /></Card>
                    ) : (
                        <ul className="space-y-3">
                            {myFeedback.map(item => {
                                const st = STATUS[item.status] || { label: item.status, tone: 'neutral' }
                                return (
                                    <li key={item._id}>
                                        <Card>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="text-[15px] font-semibold text-ink">{item.title}</h3>
                                                    <p className="text-xs text-ink-muted">{fullDate(item.createdAt)}</p>
                                                </div>
                                                <StatusPill tone={st.tone}>{st.label}</StatusPill>
                                            </div>
                                            <p className="mt-2.5 whitespace-pre-line text-sm text-ink-secondary">{item.description}</p>
                                            {item.images?.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.images.map((img, i) => (
                                                        <a key={img.publicId || i} href={img.url} target="_blank" rel="noopener noreferrer" className={`block overflow-hidden rounded-xl border border-line ${FOCUS_RING}`}>
                                                            <img src={img.thumbUrl || img.url} alt={`Хавсаргасан зураг ${i + 1}`} width={64} height={64} loading="lazy" className="h-16 w-16 object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            {item.adminResponse && (
                                                <div className="mt-3 rounded-control border-l-[3px] border-brand-text bg-brand-soft p-3">
                                                    <p className="mb-1 text-xs font-semibold text-brand-text">СӨХ-ийн хариу</p>
                                                    <p className="text-sm text-ink">{item.adminResponse}</p>
                                                </div>
                                            )}
                                        </Card>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category */}
                    <fieldset>
                        <legend className="mb-2 text-[13px] font-medium text-ink-secondary">Төрөл</legend>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map(({ id, icon: CatIcon }) => {
                                const Icon = CatIcon
                                const active = selectedCategory === id
                                return (
                                    <label key={id} className={`flex cursor-pointer flex-col items-center gap-2 rounded-card border px-2 py-3.5 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-text ${
                                        active ? 'border-brand-text bg-brand-soft' : 'border-line bg-surface hover:bg-surface-muted'
                                    }`}>
                                        <input type="radio" name="category" value={id} checked={active} onChange={() => setSelectedCategory(id)} className="sr-only" />
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-surface text-brand-text' : 'bg-surface-muted text-ink-secondary'}`}>
                                            <Icon size={20} aria-hidden="true" />
                                        </span>
                                        <span className={`text-[13px] font-semibold leading-tight ${active ? 'text-brand-text' : 'text-ink-secondary'}`}>{id}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </fieldset>

                    {/* Description */}
                    <div>
                        <label htmlFor="feedback-text" className="mb-1.5 block text-[13px] font-medium text-ink-secondary">Тайлбар</label>
                        <textarea
                            id="feedback-text"
                            name="description"
                            className={`${inputCls} min-h-40 resize-y leading-relaxed`}
                            placeholder={category.placeholder}
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            required
                        />
                    </div>

                    {/* Photos */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-[13px] font-medium text-ink-secondary">Зураг (заавал биш)</span>
                            <span className="text-xs tabular-nums text-ink-muted">{images.length}/{MAX_IMAGES}</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {images.map(img => (
                                <div key={img.id} className="relative h-20 w-20">
                                    <img src={img.preview} alt="Хавсаргах зураг" className="h-20 w-20 rounded-xl border border-line object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.id)}
                                        disabled={submitting}
                                        aria-label="Зураг хасах"
                                        className={`absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-surface shadow-card ${FOCUS_RING}`}
                                    >
                                        <X size={14} strokeWidth={2.6} aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                            {!full && (
                                <label
                                    htmlFor="image-upload"
                                    className={`flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-[11px] font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-text ${
                                        pickerBlocked ? 'cursor-not-allowed border-line text-ink-muted' : 'cursor-pointer border-line-strong/60 text-ink-secondary hover:bg-surface-muted'
                                    }`}
                                >
                                    <ImagePlus size={20} aria-hidden="true" />
                                    {preparingImages ? 'Бэлдэж…' : 'Нэмэх'}
                                </label>
                            )}
                        </div>
                        <input
                            type="file"
                            id="image-upload"
                            className="sr-only"
                            accept="image/*"
                            multiple
                            disabled={pickerBlocked}
                            onChange={handleImageUpload}
                        />
                    </div>

                    <div>
                        <Button type="submit" fullWidth loading={submitting} disabled={preparingImages || !feedbackText.trim()}>
                            {!submitting && <Send size={17} aria-hidden="true" />}
                            {submitting ? (images.length ? 'Зураг илгээж байна…' : 'Илгээж байна…') : 'Илгээх'}
                        </Button>
                        {displayName && <p className="mt-2 text-center text-xs text-ink-muted">Илгээгч: {displayName}</p>}
                    </div>
                </form>
            )}
        </div>
    )
}
