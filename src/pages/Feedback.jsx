import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { submitFeedback, fetchMyFeedback } from '../api/feedback'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext'

const STATUS_LABELS = { open: 'Нээлттэй', in_progress: 'Ажиллаж байна', resolved: 'Шийдэгдсэн' }
const STATUS_COLORS = { open: { bg: '#fef3c7', color: '#92400e' }, in_progress: { bg: '#dbeafe', color: '#1e40af' }, resolved: { bg: '#d1fae5', color: '#065f46' } }

export default function Feedback() {
    const { user } = useAuth()
    const location = useLocation()
    const headerRef = useRef(null)
    const formRef = useRef(null)

    // If navigated here from a notification, open the history tab directly
    const [activeTab, setActiveTab] = useState(
        location.state?.tab === 'history' ? 'history' : 'submit'
    )
    const [selectedCategory, setSelectedCategory] = useState('Гомдол')
    const [feedbackText, setFeedbackText] = useState('')
    const [images, setImages] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' }
    const [myFeedback, setMyFeedback] = useState([])
    const [loadingFeedback, setLoadingFeedback] = useState(false)

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3500)
    }

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

    // Animation on component mount
    useEffect(() => {
        // Animate header
        gsap.from(headerRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        })

        // Animate form
        gsap.from(formRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: 0.2,
            ease: "power1.out"
        })
    }, [])

    // Handle image upload
    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newImages = Array.from(e.target.files).map(file => ({
                id: Date.now() + Math.random().toString(36).substring(7),
                file,
                preview: URL.createObjectURL(file)
            }))
            setImages([...images, ...newImages])
        }
    }

    // Remove an image
    const removeImage = (id) => {
        const updatedImages = images.filter(img => img.id !== id)
        setImages(updatedImages)
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            await submitFeedback({
                title: selectedCategory,
                description: feedbackText,
                type: selectedCategory,
            })

            setSubmitting(false)
            setFeedbackText('')
            setImages([])
            showToast('Таны санал амжилттай илгээгдлээ. Баярлалаа', 'success')
        } catch (err) {
            setSubmitting(false)
            showToast(err.message || 'Санал илгээхэд алдаа гарлаа.', 'error')
        }
    }

    const { colors } = useTheme()
    const styles = {
        container: { padding: '16px 0 80px' },
        header: { marginBottom: '24px' },
        headerTitle: { fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' },
        headerSubtitle: { fontSize: '14px', color: colors.textMuted },
        userInfoContainer: {
            display: 'flex', alignItems: 'center', backgroundColor: colors.surface,
            borderRadius: '12px', padding: '16px', marginBottom: '20px',
            boxShadow: `0 2px 4px ${colors.shadow}`, border: `1px solid ${colors.border}`,
        },
        avatar: {
            width: '50px', height: '50px', borderRadius: '50%',
            backgroundColor: colors.surfaceAlt, display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginRight: '16px', color: colors.textSub,
            fontSize: '20px', fontWeight: 'bold',
        },
        userName: { fontSize: '16px', fontWeight: '600', color: colors.text },
        userType: { fontSize: '14px', color: colors.textMuted, marginTop: '2px' },
        categoryTabs: {
            display: 'flex', backgroundColor: colors.surface, borderRadius: '12px',
            marginBottom: '16px', overflow: 'hidden',
            boxShadow: `0 2px 4px ${colors.shadow}`, border: `1px solid ${colors.border}`,
        },
        categoryTab: {
            flex: 1, padding: '12px 16px', textAlign: 'center', cursor: 'pointer',
            fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease',
            color: colors.textSub, backgroundColor: colors.surface, border: 'none',
        },
        activeTab: { backgroundColor: colors.accent, color: 'white' },
        feedbackForm: {
            backgroundColor: colors.surface, borderRadius: '12px', padding: '20px',
            boxShadow: `0 2px 4px ${colors.shadow}`, border: `1px solid ${colors.border}`,
            boxSizing: 'border-box',
        },
        textarea: {
            width: '100%', minHeight: '200px', padding: '16px', borderRadius: '8px',
            border: `1px solid ${colors.border}`, resize: 'vertical', fontSize: '16px',
            marginBottom: '16px', fontFamily: 'inherit', boxSizing: 'border-box',
            backgroundColor: colors.surfaceAlt, color: colors.text,
        },
        imageUploadContainer: { marginBottom: '20px' },
        imageUploadLabel: {
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
            backgroundColor: colors.surfaceAlt, borderRadius: '8px', cursor: 'pointer',
            width: 'fit-content', marginBottom: '12px',
        },
        imageUploadIcon: { width: '20px', height: '20px', color: colors.textSub },
        imageUploadText: { fontSize: '14px', fontWeight: '500', color: colors.textSub },
        imageInput: { display: 'none' },
        imagesPreview: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
        imagePreviewContainer: {
            position: 'relative',
            width: '80px',
            height: '80px',
        },
        imagePreview: {
            width: '80px',
            height: '80px',
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
        },
        removeImageButton: {
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        submitButton: {
            width: '100%', padding: '14px', backgroundColor: colors.accent,
            color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px',
            fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s ease',
        },
        submitButtonDisabled: { backgroundColor: '#93C5FD', cursor: 'not-allowed' },
        successMessage: {
            padding: '16px',
            backgroundColor: '#DCFCE7',
            borderRadius: '8px',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500',
        },
        successIcon: {
            width: '20px',
            height: '20px',
        },
    };

    const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Оршин суугч'

    return (
        <div style={styles.container}>
            <header ref={headerRef} style={styles.header}>
                <h1 style={styles.headerTitle}>Санал, гомдол</h1>
                <p style={styles.headerSubtitle}>Голден Хилл сууц өмчлөгчдийн холбоонд санал гомдол илгээх</p>
            </header>

            {/* Main Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: '20px' }}>
                {[['submit', 'Илгээх'], ['history', 'Миний гомдлууд']].map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        flex: 1, padding: '12px', fontSize: '15px', fontWeight: '500', border: 'none',
                        cursor: 'pointer', background: 'none', borderBottom: activeTab === tab ? `2px solid ${colors.accent}` : '2px solid transparent',
                        color: activeTab === tab ? colors.accent : colors.textMuted,
                    }}>{label}</button>
                ))}
            </div>

            {activeTab === 'history' ? (
                <div>
                    {loadingFeedback ? (
                        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Ачаалж байна...</p>
                    ) : myFeedback.length === 0 ? (
                        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Илгээсэн санал гомдол байхгүй.</p>
                    ) : myFeedback.map(item => {
                        const sc = STATUS_COLORS[item.status] || STATUS_COLORS.open
                        return (
                            <div key={item._id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{item.title}</h3>
                                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                        {STATUS_LABELS[item.status] || item.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>{item.description}</p>
                                {item.adminResponse && (
                                    <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', borderLeft: '3px solid #2563eb' }}>
                                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', marginBottom: '4px' }}>СӨХ-ийн хариу:</p>
                                        <p style={{ fontSize: '14px', color: '#1e40af' }}>{item.adminResponse}</p>
                                    </div>
                                )}
                                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                    {new Date(item.createdAt).toLocaleDateString('mn-MN')}
                                </p>
                            </div>
                        )
                    })}
                </div>
            ) : (
            <>
            <div ref={formRef}>
                {/* User Info */}
                <div style={styles.userInfoContainer}>
                    <div style={styles.avatar}>
                        {displayName.split(' ').map(word => word[0]).join('')}
                    </div>
                    <div>
                        <h3 style={styles.userName}>{displayName}</h3>
                        <p style={styles.userType}>Оршин суугч</p>
                    </div>
                </div>

                {/* Category Tabs */}
                <div style={styles.categoryTabs}>
                    {['Гомдол', 'Шинэ санаа', 'Эвдрэл гэмтэл'].map(category => (
                        <button
                            key={category}
                            style={{
                                ...styles.categoryTab,
                                ...(selectedCategory === category ? styles.activeTab : {})
                            }}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Feedback Form */}
                <form style={styles.feedbackForm} onSubmit={handleSubmit}>
                    <div style={{
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '16px'
                    }}>
                        <textarea
                            style={{
                                ...styles.textarea,
                                border: 'none',
                                borderRadius: 0,
                                marginBottom: 0,
                                width: '100%',
                                display: 'block'
                            }}
                            placeholder={`${selectedCategory === 'Гомдол' ? 'Таны гомдлоо' : selectedCategory === 'Шинэ санаа' ? 'Таны саналаа' : 'Эвдрэл гэмтлийн тайлбарыг'} энд бичнэ үү...`}
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    {/* Image Upload Section */}
                    <div style={styles.imageUploadContainer}>
                        <label style={styles.imageUploadLabel} htmlFor="image-upload">
                            <svg xmlns="http://www.w3.org/2000/svg" style={styles.imageUploadIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span style={styles.imageUploadText}>Зураг нэмэх</span>
                        </label>
                        <input
                            type="file"
                            id="image-upload"
                            style={styles.imageInput}
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                        />

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div style={styles.imagesPreview}>
                                {images.map(img => (
                                    <div key={img.id} style={styles.imagePreviewContainer}>
                                        <img src={img.preview} alt="Preview" style={styles.imagePreview} />
                                        <button
                                            type="button"
                                            style={styles.removeImageButton}
                                            onClick={() => removeImage(img.id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        style={{
                            ...styles.submitButton,
                            ...(submitting ? styles.submitButtonDisabled : {})
                        }}
                        disabled={submitting || !feedbackText.trim()}
                    >
                        {submitting ? 'Илгээж байна...' : 'Илгээх'}
                    </button>
                </form>
            </div>
            </>
            )}

            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '88px',
                    left: '16px',
                    right: '16px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    backgroundColor: toast.type === 'success' ? '#166534' : '#991b1b',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '500',
                    animation: 'slide-up 0.3s ease-out',
                }}>
                    {toast.type === 'success' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '22px', height: '22px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '22px', height: '22px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    )}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    )
} 