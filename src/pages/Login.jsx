import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginWithEmail, registerUser } from '../api/auth'
import { apiRequest } from '../api/client'

// Add CSS reset style but scoped to login page only
const loginStyles = `
.login-page * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
`;

export default function Login() {
    const navigate = useNavigate()
    const { completeLogin } = useAuth()
    const [userType, setUserType] = useState('resident') // 'resident' | 'admin'
    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [rememberMe, setRememberMe] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')

    // Forgot password flow
    const [fpStep, setFpStep] = useState(0) // 0=off, 1=enter email, 2=enter code, 3=new password
    const [fpEmail, setFpEmail] = useState('')
    const [fpCode, setFpCode] = useState('')
    const [fpNewPass, setFpNewPass] = useState('')
    const [fpConfirmPass, setFpConfirmPass] = useState('')
    const [fpResetToken, setFpResetToken] = useState('')
    const [fpLoading, setFpLoading] = useState(false)
    const [fpError, setFpError] = useState(null)
    const [fpSuccess, setFpSuccess] = useState(null)

    // References for animations
    const pageRef = useRef(null)
    const overlayRef = useRef(null)
    const logoRef = useRef(null)
    const formRef = useRef(null)
    const titleRef = useRef(null)
    const tabsRef = useRef(null)
    const formFieldsRef = useRef(null)
    const buttonRef = useRef(null)

    useEffect(() => {
        if (userType === 'admin') {
            setMode('login')
            setError(null)
        }
    }, [userType])

    useEffect(() => {
        // Initial visibility
        if (pageRef.current) pageRef.current.style.opacity = 1;

        // Create timeline for smooth sequential animations
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Overlay animation from bottom to top
        tl.fromTo(overlayRef.current,
            { opacity: 0 },
            { opacity: 0.5, duration: 1 }
        );

        // Logo animation with bounce
        tl.fromTo(logoRef.current,
            { y: -50, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.3)" },
            "-=0.5"
        );

        // Title animation with slight rotation
        tl.fromTo(titleRef.current,
            { y: -20, opacity: 0, rotationX: -20 },
            { y: 0, opacity: 1, rotationX: 0, duration: 0.8 },
            "-=0.6"
        );

        // Form background animation with enhanced shadow
        tl.fromTo(formRef.current,
            { y: 30, opacity: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" },
            { y: 0, opacity: 1, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)", duration: 0.9, ease: "back.out(1.4)" },
            "-=0.5"
        );

        // Tabs animation with stagger
        tl.fromTo(tabsRef.current.children,
            { y: 15, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
            "-=0.6"
        );

        // Form fields animation with stagger
        tl.fromTo(formFieldsRef.current.children,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
            "-=0.3"
        );

        // Button animation
        tl.fromTo(buttonRef.current,
            { y: 20, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
            "-=0.2"
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        // Animate button while loading
        gsap.to(buttonRef.current, {
            scale: 0.95,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });

        try {
            if (mode === 'login') {
                const data = await loginWithEmail({ email, password })
                if (data?.token) {
                    // Role must match selected tab
                    if (userType === 'admin' && data.user?.role !== 'admin') {
                        setError('Энэ бүртгэл администратор эрхгүй байна')
                        return
                    }

                    completeLogin(data.token, data.user)

                    // Fade out animation before navigating
                    gsap.to(pageRef.current, {
                        opacity: 0,
                        duration: 0.6,
                        onComplete: () => {
                            const isAdmin = data.user?.role === 'admin'
                            navigate(isAdmin ? '/admin' : '/', { replace: true })
                        }
                    })
                } else {
                    setError('Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.')
                }
            } else {
                const payload = {
                    email,
                    password,
                    firstName,
                    lastName,
                    phone,
                }
                const data = await registerUser(payload)
                if (data?.token) {
                    completeLogin(data.token, data.user)

                    gsap.to(pageRef.current, {
                        opacity: 0,
                        duration: 0.6,
                        onComplete: () => {
                            navigate('/', { replace: true })
                        }
                    })
                } else {
                    setError('Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.')
                }
            }
        } catch (err) {
            if (mode === 'login') {
                setError(err.message || 'Имэйл эсвэл нууц үг буруу байна.')
            } else {
                setError(err.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const startForgotPassword = () => {
        setFpStep(1); setFpEmail(''); setFpCode(''); setFpNewPass(''); setFpConfirmPass('')
        setFpError(null); setFpSuccess(null); setFpResetToken('')
    }

    const cancelForgotPassword = () => { setFpStep(0); setFpError(null); setFpSuccess(null) }

    const handleFpSendCode = async (e) => {
        e.preventDefault()
        setFpLoading(true); setFpError(null)
        try {
            await apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: fpEmail }) })
            setFpStep(2)
        } catch (err) {
            setFpError(err.message || 'Алдаа гарлаа')
        } finally { setFpLoading(false) }
    }

    const handleFpVerifyCode = async (e) => {
        e.preventDefault()
        setFpLoading(true); setFpError(null)
        try {
            const data = await apiRequest('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email: fpEmail, code: fpCode }) })
            setFpResetToken(data.resetToken)
            setFpStep(3)
        } catch (err) {
            setFpError(err.message || 'Код буруу байна')
        } finally { setFpLoading(false) }
    }

    const handleFpResetPass = async (e) => {
        e.preventDefault()
        if (fpNewPass !== fpConfirmPass) return setFpError('Нууц үг таарахгүй байна')
        setFpLoading(true); setFpError(null)
        try {
            await apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken: fpResetToken, newPassword: fpNewPass }) })
            setFpSuccess('Нууц үг амжилттай сэргээгдлээ! Одоо нэвтрэх боломжтой.')
            setTimeout(() => cancelForgotPassword(), 2500)
        } catch (err) {
            setFpError(err.message || 'Алдаа гарлаа')
        } finally { setFpLoading(false) }
    }

    const accentColor = userType === 'admin' ? '#334155' : '#2563eb'
    const accentColorLight = userType === 'admin' ? 'rgba(51, 65, 85, 0.12)' : 'rgba(37, 99, 235, 0.1)'
    const buttonGradient = userType === 'admin'
        ? 'linear-gradient(to right, #0f172a, #334155, #0f172a)'
        : 'linear-gradient(to right, #4f46e5, #2563eb, #4f46e5)'
    const buttonShadow = userType === 'admin'
        ? '0 10px 25px -5px rgba(51, 65, 85, 0.6), 0 0 15px rgba(51, 65, 85, 0.3)'
        : '0 10px 25px -5px rgba(79, 70, 229, 0.5), 0 0 15px rgba(79, 70, 229, 0.3)'

    // Custom styles with direct CSS to avoid tailwind issues
    const styles = {
        pageContainer: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            position: 'relative',
            boxSizing: 'border-box',
        },
        backgroundImage: {
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden',
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.1)',
            minHeight: '100vh',
            minWidth: '100vw',
        },
        overlay: {
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(1px)',
            zIndex: 10,
        },
        content: {
            position: 'relative',
            zIndex: 20,
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
        },
        logoContainer: {
            textAlign: 'center',
            marginBottom: '40px',
        },
        logoCircle: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '9999px',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(255, 255, 255, 0.5)',
        },
        logoIcon: {
            height: '48px',
            width: '48px',
            color: '#2563eb',
        },
        title: {
            fontSize: '30px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        },
        subtitle: {
            color: '#bfdbfe',
            opacity: 0.8,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        },
        formContainer: {
            backgroundColor: 'rgba(255, 255, 255, 0.60)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
        },
        tabsContainer: {
            display: 'flex',
            paddingTop: '24px',
            paddingLeft: '24px',
            paddingRight: '24px',
        },
        tab: {
            flex: 1,
            padding: '12px',
            textAlign: 'center',
            fontWeight: '500',
            transition: 'all 300ms',
            borderRadius: '8px 8px 0 0',
            borderBottom: '2px solid',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
        },
        activeTab: {
            color: accentColor,
            borderColor: accentColor,
            backgroundColor: accentColorLight,
        },
        inactiveTab: {
            color: '#9ca3af',
            borderColor: 'transparent',
        },
        formContent: {
            padding: '24px',
            maxWidth: '100%',
            overflow: 'hidden',
        },
        formFields: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            maxWidth: '100%',
        },
        fieldGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            maxWidth: '100%',
        },
        label: {
            display: 'block',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
            marginLeft: '4px',
        },
        inputWrapper: {
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
        },
        inputIcon: {
            position: 'absolute',
            top: '50%',
            left: '16px',
            transform: 'translateY(-50%)',
            color: accentColor,
            height: '20px',
            width: '20px',
        },
        input: {
            width: '100%',
            paddingLeft: '48px',
            paddingRight: '24px',
            paddingTop: '16px',
            paddingBottom: '16px',
            backgroundColor: 'rgba(249, 250, 251, 0.6)',
            border: 'none',
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 200ms',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            fontSize: '16px',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        checkboxContainer: {
            display: 'flex',
            alignItems: 'center',
        },
        checkboxLabel: {
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
        },
        checkboxWrapper: {
            position: 'relative',
            display: 'inline-block',
            width: '20px',
            height: '20px',
            marginRight: '8px',
        },
        checkboxInput: {
            opacity: 0,
            position: 'absolute',
            height: '20px',
            width: '20px',
            cursor: 'pointer',
        },
        checkboxVisual: {
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            width: '20px',
            height: '20px',
            transition: 'all 200ms',
        },
        checkboxChecked: {
            backgroundColor: '#3b82f6',
            borderColor: '#3b82f6',
        },
        checkboxText: {
            fontSize: '14px',
            color: '#374151',
        },
        buttonContainer: {
            marginTop: '32px',
        },
        registerText: {
            marginTop: '16px',
            fontSize: '14px',
            textAlign: 'center',
            color: '#374151',
        },
        registerLink: {
            color: accentColor,
            fontWeight: '500',
            cursor: 'pointer',
            marginLeft: '4px',
            textDecoration: 'underline',
        },
        button: {
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            color: 'white',
            fontWeight: '500',
            fontSize: '18px',
            transition: 'all 300ms',
            border: 'none',
            cursor: 'pointer',
            transform: 'translateY(0)',
        },
        activeButton: {
            background: buttonGradient,
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s ease infinite',
            boxShadow: buttonShadow,
        },
        loadingButton: {
            backgroundColor: '#60a5fa',
        },
        buttonHover: {
            transform: 'translateY(-4px)',
            boxShadow: userType === 'admin'
                ? '0 15px 30px -5px rgba(51, 65, 85, 0.7)'
                : '0 15px 30px -5px rgba(79, 70, 229, 0.6)',
        },
        roleSelectorContainer: {
            display: 'flex',
            padding: '20px 24px 0',
            gap: '8px',
        },
        roleTab: {
            flex: 1,
            padding: '10px 16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 250ms',
            borderRadius: '10px',
            cursor: 'pointer',
            border: '2px solid transparent',
        },
        activeRoleTab: {
            backgroundColor: accentColor,
            color: 'white',
            border: `2px solid ${accentColor}`,
            boxShadow: `0 4px 12px -2px ${accentColor}55`,
        },
        inactiveRoleTab: {
            backgroundColor: 'rgba(0,0,0,0.05)',
            color: '#6b7280',
            border: '2px solid rgba(0,0,0,0.08)',
        },
        roleDivider: {
            height: '1px',
            backgroundColor: 'rgba(0,0,0,0.08)',
            margin: '16px 24px 0',
        },
        loadingSpinner: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        spinnerIcon: {
            animation: 'spin 1s linear infinite',
            marginRight: '12px',
            height: '20px',
            width: '20px',
        },
    };

    return (
        <>
            <style>{loginStyles}</style>
            <div ref={pageRef} className="login-page" style={styles.pageContainer}>
                {/* Background Image */}
                <div style={styles.backgroundImage}>
                    <img
                        src="/loginimg.jpg"
                        alt="Login Background"
                        style={styles.image}
                    />
                </div>

                {/* Dark overlay */}
                <div ref={overlayRef} style={styles.overlay}></div>

                {/* Content */}
                <div style={styles.content}>
                    {/* Logo & Title */}
                    <div style={styles.logoContainer}>
                        <div ref={logoRef}>
                            <div style={styles.logoCircle}>
                                <svg xmlns="http://www.w3.org/2000/svg" style={styles.logoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                        </div>

                        <div ref={titleRef}>
                            <h1 style={styles.title}>Оршин суугчдын Platform</h1>
                            <p style={styles.subtitle}>СӨХ-ийн application</p>
                        </div>
                    </div>

                    {/* Login Form */}
                    <div ref={formRef} style={{
                        ...styles.formContainer,
                        ...(userType === 'admin' ? {
                            border: '1px solid rgba(51, 65, 85, 0.35)',
                            boxShadow: '0 20px 60px -15px rgba(15, 23, 42, 0.55), 0 0 20px rgba(255, 255, 255, 0.2)',
                        } : {})
                    }}>
                        {/* Role Selector Tabs */}
                        <div style={styles.roleSelectorContainer}>
                            <button
                                type="button"
                                style={{ ...styles.roleTab, ...(userType === 'resident' ? styles.activeRoleTab : styles.inactiveRoleTab) }}
                                onClick={() => setUserType('resident')}
                            >
                                Оршин суугч
                            </button>
                            <button
                                type="button"
                                style={{ ...styles.roleTab, ...(userType === 'admin' ? styles.activeRoleTab : styles.inactiveRoleTab) }}
                                onClick={() => setUserType('admin')}
                            >
                                Админ
                            </button>
                        </div>
                        <div style={styles.roleDivider} />

                        {/* Login / Register tabs */}
                        {userType === 'resident' && (
                            <div ref={tabsRef} style={styles.tabsContainer}>
                                <button
                                    style={{ ...styles.tab, ...(mode === 'login' ? styles.activeTab : styles.inactiveTab) }}
                                    onClick={() => { setMode('login'); setError(null); cancelForgotPassword() }}
                                >
                                    Нэвтрэх
                                </button>
                                <button
                                    style={{ ...styles.tab, ...(mode === 'register' ? styles.activeTab : styles.inactiveTab) }}
                                    onClick={() => { setMode('register'); setError(null); cancelForgotPassword() }}
                                >
                                    Бүртгүүлэх
                                </button>
                            </div>
                        )}
                        {userType === 'admin' && <div ref={tabsRef} />}

                        {/* Form */}
                        <div style={styles.formContent}>
                            {/* Forgot Password Flow */}
                            {fpStep > 0 ? (
                                <div>
                                    {/* Back button */}
                                    <button type="button" onClick={cancelForgotPassword} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: accentColor, fontSize: '14px', fontWeight: '500', marginBottom: '20px', padding: 0 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Буцах
                                    </button>

                                    {/* Step indicators */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                        {[1, 2, 3].map(s => (
                                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: s < 3 ? 1 : 'none' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0, backgroundColor: fpStep >= s ? accentColor : 'rgba(255,255,255,0.2)', color: fpStep >= s ? 'white' : 'rgba(255,255,255,0.5)' }}>
                                                    {fpStep > s ? '✓' : s}
                                                </div>
                                                {s < 3 && <div style={{ flex: 1, height: '2px', backgroundColor: fpStep > s ? accentColor : 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />}
                                            </div>
                                        ))}
                                    </div>

                                    {fpError && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: 'rgba(254,226,226,0.85)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}>
                                            <span style={{ color: '#b91c1c', fontSize: '13px' }}>{fpError}</span>
                                        </div>
                                    )}
                                    {fpSuccess && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(220,252,231,0.9)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}>
                                            <span style={{ color: '#15803d', fontSize: '13px', fontWeight: '500' }}>{fpSuccess}</span>
                                        </div>
                                    )}

                                    {/* Step 1 — Enter email */}
                                    {fpStep === 1 && (
                                        <form onSubmit={handleFpSendCode}>
                                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '16px' }}>
                                                Бүртгэлтэй имэйл хаягаа оруулна уу. Танд 4 оронтой код илгээнэ.
                                            </p>
                                            <div style={styles.fieldGroup}>
                                                <label style={styles.label}>Имэйл хаяг</label>
                                                <div style={styles.inputWrapper}>
                                                    <div style={{ ...styles.inputIcon, color: accentColor }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                        </svg>
                                                    </div>
                                                    <input type="email" style={styles.input} placeholder="Мэйл хаягаа оруулна уу" value={fpEmail} onChange={e => setFpEmail(e.target.value)} required />
                                                </div>
                                            </div>
                                            <div ref={buttonRef} style={{ marginTop: '20px' }}>
                                                <button type="submit" disabled={fpLoading} style={{ ...styles.button, ...(fpLoading ? styles.loadingButton : styles.activeButton) }}>
                                                    {fpLoading ? 'Илгээж байна...' : 'Код илгээх'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Step 2 — Enter OTP code */}
                                    {fpStep === 2 && (
                                        <form onSubmit={handleFpVerifyCode}>
                                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '16px' }}>
                                                <strong style={{ color: 'white' }}>{fpEmail}</strong> хаяг руу 4 оронтой код илгээгдлээ. Доор оруулна уу.
                                            </p>
                                            <div style={styles.fieldGroup}>
                                                <label style={styles.label}>4 оронтой код</label>
                                                <div style={styles.inputWrapper}>
                                                    <input type="text" inputMode="numeric" maxLength={4} style={{ ...styles.input, letterSpacing: '12px', fontSize: '22px', fontWeight: '700', textAlign: 'center', paddingLeft: '16px' }} placeholder="• • • •" value={fpCode} onChange={e => { setFpCode(e.target.value.replace(/\D/g, '')); setFpError(null) }} required />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setFpStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '8px', padding: 0 }}>
                                                Код хүлээгдэхгүй байна уу? Дахин илгээх →
                                            </button>
                                            <div style={{ marginTop: '16px' }}>
                                                <button type="submit" disabled={fpLoading || fpCode.length !== 4} style={{ ...styles.button, ...(fpLoading || fpCode.length !== 4 ? styles.loadingButton : styles.activeButton) }}>
                                                    {fpLoading ? 'Шалгаж байна...' : 'Кодыг баталгаажуулах'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Step 3 — New password */}
                                    {fpStep === 3 && (
                                        <form onSubmit={handleFpResetPass}>
                                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '16px' }}>
                                                Шинэ нууц үгээ оруулна уу.
                                            </p>
                                            <div style={styles.fieldGroup}>
                                                <label style={styles.label}>Шинэ нууц үг</label>
                                                <div style={styles.inputWrapper}>
                                                    <div style={{ ...styles.inputIcon, color: accentColor }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <input type="password" style={styles.input} placeholder="Хамгийн багадаа 6 тэмдэгт" value={fpNewPass} onChange={e => { setFpNewPass(e.target.value); setFpError(null) }} required />
                                                </div>
                                            </div>
                                            <div style={{ ...styles.fieldGroup, marginTop: '12px' }}>
                                                <label style={styles.label}>Нууц үгийг давтах</label>
                                                <div style={styles.inputWrapper}>
                                                    <div style={{ ...styles.inputIcon, color: accentColor }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <input type="password" style={styles.input} placeholder="Давтах" value={fpConfirmPass} onChange={e => { setFpConfirmPass(e.target.value); setFpError(null) }} required />
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '20px' }}>
                                                <button type="submit" disabled={fpLoading} style={{ ...styles.button, ...(fpLoading ? styles.loadingButton : styles.activeButton) }}>
                                                    {fpLoading ? 'Хадгалж байна...' : 'Нууц үг сэргээх'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ) : (
                            <form onSubmit={handleSubmit}>
                                {/* Error banner — shown above all fields */}
                                {error && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px',
                                        backgroundColor: 'rgba(254, 226, 226, 0.85)',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                        borderRadius: '10px',
                                        padding: '12px 14px',
                                        marginBottom: '16px',
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '18px', height: '18px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                        </svg>
                                        <span style={{ color: '#b91c1c', fontSize: '14px', fontWeight: '500', lineHeight: '1.4' }}>
                                            {error}
                                        </span>
                                    </div>
                                )}

                                <div ref={formFieldsRef} style={styles.formFields}>
                                    {/* Unified identifier input (email or phone) */}
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label} htmlFor="email">
                                            {mode === 'register' ? 'Имэйл хаяг' : 'Имэйл эсвэл утасны дугаар'}
                                        </label>
                                        <div style={styles.inputWrapper}>
                                            <div style={{ ...styles.inputIcon, color: error ? '#dc2626' : accentColor }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                            </div>
                                            <input
                                                id="email"
                                                type={mode === 'register' ? 'email' : 'text'}
                                                style={{
                                                    ...styles.input,
                                                    ...(error ? {
                                                        boxShadow: '0 0 0 2px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                                                        backgroundColor: 'rgba(254,242,242,0.7)',
                                                    } : {})
                                                }}
                                                placeholder={mode === 'register' ? 'Имэйл хаягаа оруулна уу' : 'Имэйл эсвэл утасны дугаар'}
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password with forgot password link */}
                                    <div style={styles.fieldGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <label style={{ ...styles.label, marginBottom: 0 }} htmlFor="password">
                                                Нууц үг
                                            </label>
                                            {mode === 'login' && userType === 'resident' && (
                                                <button
                                                    type="button"
                                                    onClick={startForgotPassword}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '13px', fontWeight: '500', padding: 0 }}
                                                >
                                                    Нууц үг мартсан?
                                                </button>
                                            )}
                                        </div>
                                        <div style={styles.inputWrapper}>
                                            <div style={{ ...styles.inputIcon, color: error ? '#dc2626' : accentColor }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                id="password"
                                                type="password"
                                                style={{
                                                    ...styles.input,
                                                    ...(error ? {
                                                        boxShadow: '0 0 0 2px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                                                        backgroundColor: 'rgba(254,242,242,0.7)',
                                                    } : {})
                                                }}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Extra fields only for register mode */}
                                    {mode === 'register' && (
                                        <>
                                            <div style={styles.fieldGroup}>
                                                <label style={styles.label} htmlFor="phone">
                                                    Утасны дугаар
                                                </label>
                                                <div style={styles.inputWrapper}>
                                                    <input
                                                        id="phone"
                                                        type="tel"
                                                        style={styles.input}
                                                        placeholder="Утасны дугаар"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div style={styles.fieldGroup}>
                                                <label style={styles.label} htmlFor="firstName">
                                                    Нэр
                                                </label>
                                                <div style={styles.inputWrapper}>
                                                    <input
                                                        id="firstName"
                                                        type="text"
                                                        style={styles.input}
                                                        placeholder="Таны нэр"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div style={styles.fieldGroup}>
                                                <label style={styles.label} htmlFor="lastName">
                                                    Овог
                                                </label>
                                                <div style={styles.inputWrapper}>
                                                    <input
                                                        id="lastName"
                                                        type="text"
                                                        style={styles.input}
                                                        placeholder="Таны овог"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div style={styles.checkboxContainer}>
                                        <label style={styles.checkboxLabel}>
                                            <div style={styles.checkboxWrapper}>
                                                <input
                                                    id="remember-me"
                                                    type="checkbox"
                                                    style={styles.checkboxInput}
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                />
                                                <div style={{
                                                    ...styles.checkboxVisual,
                                                    ...(rememberMe ? styles.checkboxChecked : {})
                                                }}>
                                                    {rememberMe && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span style={styles.checkboxText}>
                                                Сануулах
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div ref={buttonRef} style={styles.buttonContainer}>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        style={{
                                            ...styles.button,
                                            ...(isLoading ? styles.loadingButton : styles.activeButton)
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isLoading) {
                                                e.target.style.transform = 'translateY(-4px)';
                                                e.target.style.boxShadow = userType === 'admin'
                                                    ? '0 15px 30px -5px rgba(51, 65, 85, 0.7)'
                                                    : '0 15px 30px -5px rgba(79, 70, 229, 0.6)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = isLoading ? 'none' : buttonShadow;
                                        }}
                                    >
                                        {isLoading ? (
                                            <div style={styles.loadingSpinner}>
                                                <svg style={styles.spinnerIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>{mode === 'login' ? 'Logging in...' : 'Бүртгэж байна...'}</span>
                                            </div>
                                        ) : mode === 'login' ? 'Log In' : 'Бүртгүүлэх'}
                                    </button>

                                </div>
                            </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
} 