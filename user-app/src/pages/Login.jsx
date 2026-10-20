import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginWithEmail, registerUser } from '../api/auth'
import { apiRequest } from '../api/client'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Field, { inputCls } from '../components/ui/Field'
import SegmentedTabs from '../components/ui/SegmentedTabs'
import { ChevronLeft, AlertCircle, CheckCircle2, Check } from 'lucide-react'

const HERO_BG = 'linear-gradient(165deg, #1E4740 0%, #183B35 55%, #0F2A25 100%)'

function Alert({ tone = 'error', children }) {
    const Icon = tone === 'error' ? AlertCircle : CheckCircle2
    return (
        <p role={tone === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-control px-3.5 py-2.5 text-sm ${tone === 'error' ? 'bg-danger-bg text-danger-text' : 'bg-success-bg text-success-text'}`}>
            <Icon size={17} className="mt-px shrink-0" aria-hidden="true" />
            <span>{children}</span>
        </p>
    )
}

const FP_STEPS = ['Имэйл', 'Код', 'Нууц үг']

export default function Login() {
    const navigate = useNavigate()
    const { completeLogin } = useAuth()
    const [mode, setMode] = useState('login') // 'login' | 'register'
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)
        try {
            const data = mode === 'login'
                ? await loginWithEmail({ email, password })
                : await registerUser({ email, password, firstName, lastName, phone })
            if (data?.token) {
                completeLogin(data.token, data.user)
                // Navigate right away (no delayed fade): a late navigate('/')
                // used to override wherever the user had already tapped.
                navigate('/', { replace: true })
            } else {
                setError(mode === 'login' ? 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.' : 'Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.')
            }
        } catch (err) {
            setError(err.message || (mode === 'login' ? 'Имэйл эсвэл нууц үг буруу байна.' : 'Бүртгэл үүсгэхэд алдаа гарлаа.'))
        } finally {
            setIsLoading(false)
        }
    }

    const startForgotPassword = () => {
        setFpStep(1); setFpEmail(email.includes('@') ? email : ''); setFpCode(''); setFpNewPass(''); setFpConfirmPass('')
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

    const switchMode = (m) => { setMode(m); setError(null); cancelForgotPassword() }
    const isRegister = mode === 'register'

    return (
        <div className="flex min-h-dvh flex-col bg-surface">
            {/* Forest hero */}
            <header className="px-6 pb-14 pt-[calc(48px+env(safe-area-inset-top))] text-center text-white" style={{ background: HERO_BG }}>
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-pop">
                    <img src="/icons/hurshlogo-forest.png" alt="" className="h-12 w-12 object-contain" />
                </span>
                <h1 className="mt-4 text-[26px] font-semibold tracking-tight">Хөрш</h1>
                <p className="mt-1 text-sm text-white/75">Оршин суугчдын платформ</p>
            </header>

            {/* Sheet */}
            <main className="-mt-7 flex-1 rounded-t-[28px] bg-surface px-5 pb-[calc(32px+env(safe-area-inset-bottom))] pt-6">
                <div className="mx-auto w-full max-w-sm">
                    {fpStep > 0 ? (
                        <section aria-labelledby="fp-title">
                            <button type="button" onClick={cancelForgotPassword}
                                className={`-ml-1 mb-4 inline-flex items-center gap-1 rounded-control px-1 py-1 text-sm font-semibold text-brand-text hover:underline ${FOCUS_RING}`}>
                                <ChevronLeft size={17} aria-hidden="true" /> Нэвтрэх рүү буцах
                            </button>
                            <h2 id="fp-title" className="text-xl font-semibold text-ink">Нууц үг сэргээх</h2>

                            {/* Steps */}
                            <ol className="mb-5 mt-4 flex items-center gap-2" aria-label="Алхам">
                                {FP_STEPS.map((label, i) => {
                                    const s = i + 1
                                    const done = fpStep > s
                                    const current = fpStep === s
                                    return (
                                        <li key={label} className="flex flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done || current ? 'bg-brand text-on-brand' : 'bg-surface-muted text-ink-muted'}`}>
                                                {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : s}
                                            </span>
                                            <span className={`text-xs font-medium ${current ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
                                            {s < 3 && <span aria-hidden="true" className={`h-0.5 flex-1 rounded-full ${done ? 'bg-brand' : 'bg-line'}`} />}
                                        </li>
                                    )
                                })}
                            </ol>

                            <div className="space-y-4">
                                {fpError && <Alert>{fpError}</Alert>}
                                {fpSuccess && <Alert tone="success">{fpSuccess}</Alert>}

                                {fpStep === 1 && (
                                    <form onSubmit={handleFpSendCode} className="space-y-4">
                                        <p className="text-sm text-ink-muted">Бүртгэлтэй имэйл хаягаа оруулна уу. Танд 6 оронтой код илгээнэ.</p>
                                        <Field label="Имэйл хаяг">
                                            <input type="email" autoComplete="email" spellCheck={false} className={inputCls} placeholder="name@example.com" value={fpEmail} onChange={e => setFpEmail(e.target.value)} required />
                                        </Field>
                                        <Button type="submit" fullWidth loading={fpLoading}>{fpLoading ? 'Илгээж байна…' : 'Код илгээх'}</Button>
                                    </form>
                                )}

                                {fpStep === 2 && (
                                    <form onSubmit={handleFpVerifyCode} className="space-y-4">
                                        <p className="text-sm text-ink-muted"><strong className="font-semibold text-ink">{fpEmail}</strong> хаяг руу 6 оронтой код илгээгдлээ.</p>
                                        <Field label="6 оронтой код">
                                            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                                                className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em] tabular-nums`}
                                                placeholder="••••••" value={fpCode}
                                                onChange={e => { setFpCode(e.target.value.replace(/\D/g, '')); setFpError(null) }} required />
                                        </Field>
                                        <Button type="submit" fullWidth loading={fpLoading} disabled={fpCode.length !== 6}>{fpLoading ? 'Шалгаж байна…' : 'Кодыг баталгаажуулах'}</Button>
                                        <button type="button" onClick={() => setFpStep(1)} className={`w-full rounded-control py-1 text-center text-sm text-ink-muted hover:text-ink ${FOCUS_RING}`}>
                                            Код ирээгүй юу? <span className="font-semibold text-brand-text">Дахин илгээх</span>
                                        </button>
                                    </form>
                                )}

                                {fpStep === 3 && (
                                    <form onSubmit={handleFpResetPass} className="space-y-4">
                                        <p className="text-sm text-ink-muted">Шинэ нууц үгээ оруулна уу.</p>
                                        <Field label="Шинэ нууц үг" hint="Хамгийн багадаа 6 тэмдэгт">
                                            <input type="password" autoComplete="new-password" minLength={6} className={inputCls} value={fpNewPass} onChange={e => { setFpNewPass(e.target.value); setFpError(null) }} required />
                                        </Field>
                                        <Field label="Нууц үгийг давтах">
                                            <input type="password" autoComplete="new-password" className={inputCls} value={fpConfirmPass} onChange={e => { setFpConfirmPass(e.target.value); setFpError(null) }} required />
                                        </Field>
                                        <Button type="submit" fullWidth loading={fpLoading}>{fpLoading ? 'Хадгалж байна…' : 'Нууц үг сэргээх'}</Button>
                                    </form>
                                )}
                            </div>
                        </section>
                    ) : (
                        <>
                            <SegmentedTabs
                                label="Нэвтрэх эсвэл бүртгүүлэх"
                                tabs={[{ id: 'login', label: 'Нэвтрэх' }, { id: 'register', label: 'Бүртгүүлэх' }]}
                                value={mode}
                                onChange={switchMode}
                            />

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <h2 className="sr-only">{isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</h2>
                                {error && <Alert>{error}</Alert>}

                                {isRegister && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Овог">
                                            <input id="lastName" type="text" autoComplete="family-name" className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} />
                                        </Field>
                                        <Field label="Нэр">
                                            <input id="firstName" type="text" autoComplete="given-name" className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
                                        </Field>
                                    </div>
                                )}

                                <Field label={isRegister ? 'Имэйл хаяг' : 'Имэйл эсвэл утасны дугаар'}>
                                    <input
                                        id="email"
                                        type={isRegister ? 'email' : 'text'}
                                        inputMode={isRegister ? 'email' : 'text'}
                                        autoComplete={isRegister ? 'email' : 'username'}
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        className={inputCls}
                                        placeholder={isRegister ? 'name@example.com' : 'Имэйл эсвэл утас…'}
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(null) }}
                                        aria-invalid={error ? true : undefined}
                                        required
                                    />
                                </Field>

                                {isRegister && (
                                    <Field label="Утасны дугаар">
                                        <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </Field>
                                )}

                                <div>
                                    <Field label="Нууц үг" hint={isRegister ? 'Хамгийн багадаа 6 тэмдэгт' : undefined}>
                                        <input
                                            id="password"
                                            type="password"
                                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                                            className={inputCls}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(null) }}
                                            aria-invalid={error ? true : undefined}
                                            required
                                        />
                                    </Field>
                                    {!isRegister && (
                                        <div className="mt-2 text-right">
                                            <button type="button" onClick={startForgotPassword}
                                                className={`rounded-control text-sm font-semibold text-brand-text hover:underline ${FOCUS_RING}`}>
                                                Нууц үг мартсан?
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" fullWidth loading={isLoading} className="!mt-6 h-12 text-base">
                                    {isLoading
                                        ? (isRegister ? 'Бүртгэж байна…' : 'Нэвтэрч байна…')
                                        : (isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх')}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
