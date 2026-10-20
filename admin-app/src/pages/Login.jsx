import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginWithEmail } from '../api/auth'
import { AlertTriangle, Mail, Lock, ShieldCheck, Wallet, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import { fieldInputCls } from '../components/ui/FormField'

const HIGHLIGHTS = [
    { icon: Wallet, text: 'Төлбөр, нэхэмжлэлээ нэг дороос хянана' },
    { icon: Users, text: 'Оршин суугч, гишүүнчлэлийн хүсэлтээ удирдана' },
    { icon: ShieldCheck, text: 'Таны СӨХ-ийн мэдээлэл зөвхөн танд харагдана' },
]

export default function Login() {
    const navigate = useNavigate()
    const { completeLogin } = useAuth()
    const [rememberMe, setRememberMe] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const data = await loginWithEmail({ email, password })
            if (data?.token) {
                const role = data.user?.role
                if (role !== 'admin' && role !== 'platform_admin') {
                    setError('Энэ бүртгэл админ эрхгүй байна')
                    return
                }

                completeLogin(data.token, data.user)
                navigate('/', { replace: true })
            } else {
                setError('Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.')
            }
        } catch (err) {
            setError(err.message || 'Имэйл эсвэл нууц үг буруу байна.')
        } finally {
            setIsLoading(false)
        }
    }

    const inputCls = `${fieldInputCls} h-11 pl-10`

    return (
        <div className="min-h-screen bg-canvas flex">
            {/* Brand panel (desktop) */}
            <aside className="hidden lg:flex w-[44%] max-w-[560px] bg-brand text-on-brand flex-col justify-between p-12">
                <div className="flex items-center gap-3">
                    <img src="/icons/hurshlogowhite.png" alt="" width={36} height={36} className="w-9 h-9" />
                    <span className="text-lg font-semibold tracking-tight">Хөрш</span>
                </div>
                <div>
                    <h2 className="text-[32px] leading-tight font-semibold tracking-tight text-balance">
                        СӨХ-ийн удирдлагыг нэг дороос
                    </h2>
                    <ul className="mt-8 space-y-4">
                        {HIGHLIGHTS.map(({ icon: ItemIcon, text }) => {
                            const Icon = ItemIcon
                            return (
                                <li key={text} className="flex items-start gap-3 text-[15px] text-white/85">
                                    <span className="w-8 h-8 rounded-control bg-white/10 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                    <span className="pt-1.5">{text}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <p className="text-xs text-white/60">© Хөрш — СӨХ-ийн удирдлагын систем</p>
            </aside>

            {/* Form */}
            <main className="flex-1 flex items-center justify-center px-5 py-10">
                <div className="w-full max-w-[400px]">
                    <div className="lg:hidden flex items-center gap-2.5 mb-8">
                        <img src="/icons/hurshlogo-forest.png" alt="" width={32} height={32} className="w-8 h-8" />
                        <span className="text-lg font-semibold tracking-tight text-ink">Хөрш</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight text-ink">Админ нэвтрэх</h1>
                    <p className="mt-1.5 text-sm text-ink-muted">СӨХ болон платформын админы бүртгэлээр нэвтэрнэ үү.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate={false}>
                        {error && (
                            <div role="alert" className="flex items-start gap-2.5 rounded-control bg-danger-bg px-3.5 py-3 text-sm font-medium text-danger-text">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-[13px] font-medium text-ink-secondary mb-1.5">Имэйл хаяг</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    spellCheck={false}
                                    required
                                    className={inputCls}
                                    placeholder="admin@жишээ.mn"
                                    value={email}
                                    aria-invalid={error ? true : undefined}
                                    onChange={(e) => { setEmail(e.target.value); setError(null) }}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[13px] font-medium text-ink-secondary mb-1.5">Нууц үг</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className={inputCls}
                                    placeholder="••••••••"
                                    value={password}
                                    aria-invalid={error ? true : undefined}
                                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                                />
                            </div>
                        </div>

                        <label htmlFor="remember-me" className="inline-flex items-center gap-2.5 text-sm text-ink-secondary cursor-pointer select-none">
                            <input
                                id="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded-[4px] accent-[var(--brand)] cursor-pointer"
                            />
                            Сануулах
                        </label>

                        <Button type="submit" loading={isLoading} className="w-full h-11">
                            {isLoading ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    )
}
