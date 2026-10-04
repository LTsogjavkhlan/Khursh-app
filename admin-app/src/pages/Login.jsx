import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginWithEmail } from '../api/auth'
import { AlertTriangle, Mail, Lock, Check, Loader2 } from 'lucide-react'

const loginStyles = `
.login-page * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

const accentColor = '#334155'
const buttonGradient = 'linear-gradient(to right, #0f172a, #334155, #0f172a)'
const buttonShadow = '0 10px 25px -5px rgba(51, 65, 85, 0.6), 0 0 15px rgba(51, 65, 85, 0.3)'

export default function Login() {
    const navigate = useNavigate()
    const { completeLogin } = useAuth()
    const [rememberMe, setRememberMe] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const pageRef = useRef(null)
    const overlayRef = useRef(null)
    const logoRef = useRef(null)
    const formRef = useRef(null)
    const titleRef = useRef(null)
    const formFieldsRef = useRef(null)
    const buttonRef = useRef(null)

    useEffect(() => {
        if (pageRef.current) pageRef.current.style.opacity = 1;

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(overlayRef.current,
            { opacity: 0 },
            { opacity: 0.5, duration: 1 }
        );

        tl.fromTo(logoRef.current,
            { y: -50, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.3)" },
            "-=0.5"
        );

        tl.fromTo(titleRef.current,
            { y: -20, opacity: 0, rotationX: -20 },
            { y: 0, opacity: 1, rotationX: 0, duration: 0.8 },
            "-=0.6"
        );

        tl.fromTo(formRef.current,
            { y: 30, opacity: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" },
            { y: 0, opacity: 1, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)", duration: 0.9, ease: "back.out(1.4)" },
            "-=0.5"
        );

        tl.fromTo(formFieldsRef.current.children,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
            "-=0.3"
        );

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

        gsap.to(buttonRef.current, {
            scale: 0.95,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });

        try {
            const data = await loginWithEmail({ email, password })
            if (data?.token) {
                const role = data.user?.role
                if (role !== 'admin' && role !== 'platform_admin') {
                    setError('Энэ бүртгэл админ эрхгүй байна')
                    return
                }

                completeLogin(data.token, data.user)

                gsap.to(pageRef.current, {
                    opacity: 0,
                    duration: 0.6,
                    onComplete: () => {
                        navigate('/', { replace: true })
                    }
                })
            } else {
                setError('Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.')
            }
        } catch (err) {
            setError(err.message || 'Имэйл эсвэл нууц үг буруу байна.')
        } finally {
            setIsLoading(false)
        }
    }

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
            background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 60%, #020617 100%)',
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
            marginBottom: '20px',
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
            height: '52px',
            width: '52px',
            objectFit: 'contain',
        },
        title: {
            fontSize: '30px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        },
        subtitle: {
            color: '#cbd5e1',
            opacity: 0.8,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        },
        formContainer: {
            backgroundColor: 'rgba(255, 255, 255, 0.60)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px -15px rgba(15, 23, 42, 0.55), 0 0 20px rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            border: '1px solid rgba(51, 65, 85, 0.35)',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
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
            backgroundColor: accentColor,
            borderColor: accentColor,
        },
        checkboxText: {
            fontSize: '14px',
            color: '#374151',
        },
        buttonContainer: {
            marginTop: '32px',
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
            backgroundColor: '#64748b',
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
                <div style={styles.backgroundImage} />
                <div ref={overlayRef} style={styles.overlay}></div>

                <div style={styles.content}>
                    <div style={styles.logoContainer}>
                        <div ref={logoRef}>
                            <div style={styles.logoCircle}>
                                <img src="/icons/hurshlogo.png" alt="Хөрш" style={styles.logoIcon} />
                            </div>
                        </div>

                        <div ref={titleRef}>
                            <h1 style={styles.title}>СӨХ Админ систем</h1>
                        </div>
                    </div>

                    <div ref={formRef} style={styles.formContainer}>
                        <div style={{ height: '24px' }} />
                        <div style={styles.formContent}>
                            <form onSubmit={handleSubmit}>
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
                                        <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                                        <span style={{ color: '#b91c1c', fontSize: '14px', fontWeight: '500', lineHeight: '1.4' }}>
                                            {error}
                                        </span>
                                    </div>
                                )}

                                <div ref={formFieldsRef} style={styles.formFields}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label} htmlFor="email">Имэйл хаяг</label>
                                        <div style={styles.inputWrapper}>
                                            <div style={{ ...styles.inputIcon, color: error ? '#dc2626' : accentColor }}>
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                style={{
                                                    ...styles.input,
                                                    ...(error ? {
                                                        boxShadow: '0 0 0 2px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                                                        backgroundColor: 'rgba(254,242,242,0.7)',
                                                    } : {})
                                                }}
                                                placeholder="Админы имэйл хаяг"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div style={styles.fieldGroup}>
                                        <label style={{ ...styles.label, marginBottom: '6px' }} htmlFor="password">Нууц үг</label>
                                        <div style={styles.inputWrapper}>
                                            <div style={{ ...styles.inputIcon, color: error ? '#dc2626' : accentColor }}>
                                                <Lock size={20} />
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
                                                        <Check size={20} color="white" />
                                                    )}
                                                </div>
                                            </div>
                                            <span style={styles.checkboxText}>Сануулах</span>
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
                                                e.target.style.boxShadow = '0 15px 30px -5px rgba(51, 65, 85, 0.7)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = isLoading ? 'none' : buttonShadow;
                                        }}
                                    >
                                        {isLoading ? (
                                            <div style={styles.loadingSpinner}>
                                                <Loader2 style={styles.spinnerIcon} />
                                                <span>Нэвтэрч байна...</span>
                                            </div>
                                        ) : 'Нэвтрэх'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
