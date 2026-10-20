import User from '../models/User.js'
import Otp from '../models/Otp.js'
import ApartmentMember from '../models/ApartmentMember.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendOtpEmail } from '../utils/mailer.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { findHoaIdByName } from '../utils/tenant.js'
import Hoa from '../models/Hoa.js'
import { resolveFeatures } from '../config/features.js'

// The token carries identity only. Role and HOA scope are loaded from the
// database on every request by `protect`, so they can never go stale.
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const publicUser = (user) => ({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    hoaName: user.hoaName,
    building: user.building,
    apartmentNumber: user.apartmentNumber,
    membershipStatus: user.membershipStatus,
    role: user.role,
    utilityElectricity: user.utilityElectricity || '',
    utilityWaterHeat: user.utilityWaterHeat || '',
})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const register = asyncHandler(async (req, res) => {
    // HOA membership is never self-assigned at sign-up; residents join via an
    // address/membership request that an HOA admin must approve.
    const { email, password, firstName, lastName, phone, building, apartmentNumber } = req.body

    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Имэйл, нууц үг, нэр, овог шаардлагатай' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Имэйл хаяг буруу байна' })
    }
    if (String(password).length < 6) {
        return res.status(400).json({ message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' })
    }

    let user = await User.findOne({ email: normalizedEmail })
    if (user) {
        return res.status(400).json({ message: 'User already exists' })
    }

    user = new User({
        email: normalizedEmail,
        password,
        firstName,
        lastName,
        phone,
        building,
        apartmentNumber,
        role: 'user'
    })

    await user.save()

    const token = generateToken(user._id)

    res.status(201).json({
        message: 'User registered successfully',
        token,
        user: publicUser(user)
    })
})

export const login = asyncHandler(async (req, res) => {
    const { email: identifier, password } = req.body

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Please provide email and password' })
    }

    // Support both email and phone login
    const isEmail = identifier.includes('@')
    const user = await User.findOne(
        isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }
    )
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user._id)

    res.json({
        message: 'Login successful',
        token,
        user: publicUser(user)
    })
})

export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Re-issue a fresh token so an active session keeps sliding forward
    const token = generateToken(user._id)

    // Whether the user may use apartment features (owner or tenant of any unit)
    const hasApartmentAccess = (await ApartmentMember.countDocuments({ user: user._id })) > 0

    // Which optional features the caller's HOA has (null when not in an HOA)
    const hoa = req.userHoaId ? await Hoa.findById(req.userHoaId).select('features').lean() : null
    const hoaFeatures = hoa ? resolveFeatures(hoa) : null

    res.json({ token, user, hasApartmentAccess, hoaFeatures })
})

export const requestMembership = asyncHandler(async (req, res) => {
    const { hoaName } = req.body
    if (!hoaName) {
        return res.status(400).json({ message: 'СӨХ-ийн нэрийг сонгоно уу' })
    }

    // Admins are assigned to their HOA by a platform admin; letting them
    // request membership would let them move themselves into another HOA.
    if (req.userRole !== 'user') {
        return res.status(403).json({ message: 'Зөвхөн оршин суугч гишүүнчлэл хүсэх боломжтой' })
    }

    const hoa = await findHoaIdByName(hoaName)
    if (!hoa) {
        return res.status(400).json({ message: 'СӨХ олдсонгүй' })
    }
    const user = await User.findByIdAndUpdate(
        req.userId,
        { hoaName: hoaName.trim(), hoa, membershipStatus: 'pending' },
        { new: true }
    ).select('-password')

    if (!user) return res.status(404).json({ message: 'User not found' })

    res.json({ message: 'Хүсэлт амжилттай илгээгдлээ', user })
})

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Бүх талбарыг бөглөнө үү' })
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
        return res.status(401).json({ message: 'Одоогийн нууц үг буруу байна' })
    }

    user.password = newPassword
    await user.save() // pre-save hook will hash it
    res.json({ message: 'Нууц үг амжилттай солигдлоо' })
})

export const changeEmail = asyncHandler(async (req, res) => {
    const { newEmail, currentPassword } = req.body
    if (!newEmail || !currentPassword) {
        return res.status(400).json({ message: 'Бүх талбарыг бөглөнө үү' })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
        return res.status(401).json({ message: 'Нууц үг буруу байна' })
    }

    const existing = await User.findOne({ email: newEmail.toLowerCase() })
    if (existing) {
        return res.status(400).json({ message: 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна' })
    }

    user.email = newEmail.toLowerCase()
    await user.save()

    const updatedUser = await User.findById(req.userId).select('-password')
    res.json({ message: 'Имэйл амжилттай солигдлоо', user: updatedUser })
})

/*OTP section*/
const OTP_TTL_MS = 15 * 60 * 1000
const OTP_MAX_ATTEMPTS = 5         // wrong guesses allowed per code
const OTP_MAX_PER_WINDOW = 3       // codes per email per OTP_TTL_MS window
const OTP_GENERIC_MESSAGE = 'Хэрэв имэйл бүртгэлтэй бол код илгээгдлээ'

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex')

const codeMatches = (code, codeHash) => {
    const a = Buffer.from(hashCode(code), 'hex')
    const b = Buffer.from(codeHash, 'hex')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const forgotPassword = asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase()

    // Same response whether or not the account exists, so this can't be used
    // to discover registered emails.
    const user = await User.findOne({ email })
    if (!user) return res.json({ message: OTP_GENERIC_MESSAGE })

    // Cap how many codes one email can receive. Without this an attacker could
    // keep requesting fresh codes to get a fresh set of guesses each time.
    const recent = await Otp.countDocuments({ email, createdAt: { $gt: new Date(Date.now() - OTP_TTL_MS) } })
    if (recent >= OTP_MAX_PER_WINDOW) return res.json({ message: OTP_GENERIC_MESSAGE })

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
    // Supersede older codes rather than deleting them, so they still count
    // toward the per-email cap above until they expire.
    await Otp.updateMany({ email, used: false }, { used: true })
    await Otp.create({ email, codeHash: hashCode(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) })
    await sendOtpEmail(email, code)
    res.json({ message: OTP_GENERIC_MESSAGE })
})

export const verifyOtp = asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase()
    const invalid = () => res.status(400).json({ message: 'Код буруу эсвэл хугацаа дууссан байна' })

    // Count the attempt atomically before comparing, so parallel guesses can't
    // slip past the attempt limit.
    const otp = await Otp.findOneAndUpdate(
        { email, used: false, verified: false, expiresAt: { $gt: new Date() }, attempts: { $lt: OTP_MAX_ATTEMPTS } },
        { $inc: { attempts: 1 } },
        { sort: { createdAt: -1 }, new: true }
    )
    if (!otp || !codeMatches(req.body.code, otp.codeHash)) return invalid()

    // Mark verified exactly once; the reset token below is bound to this doc
    const verified = await Otp.findOneAndUpdate(
        { _id: otp._id, verified: false },
        { verified: true, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
        { new: true }
    )
    if (!verified) return invalid()

    const resetToken = jwt.sign(
        { email, otp: String(verified._id), purpose: 'reset' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    )
    res.json({ resetToken })
})

export const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body
    let payload
    try {
        payload = jwt.verify(resetToken, process.env.JWT_SECRET)
    } catch {
        return res.status(400).json({ message: 'Токен хүчингүй эсвэл хугацаа дууссан' })
    }
    if (payload.purpose !== 'reset' || !payload.otp) {
        return res.status(400).json({ message: 'Буруу токен' })
    }

    // Consume the verified code atomically: a reset token works exactly once
    const consumed = await Otp.findOneAndUpdate(
        { _id: payload.otp, email: payload.email, verified: true, used: false, expiresAt: { $gt: new Date() } },
        { used: true }
    )
    if (!consumed) {
        return res.status(400).json({ message: 'Токен хүчингүй эсвэл хугацаа дууссан' })
    }

    const user = await User.findOne({ email: payload.email })
    if (!user) return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' })
    user.password = newPassword
    await user.save()
    res.json({ message: 'Нууц үг амжилттай сэргээгдлээ' })
})

export const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, building, entrance, floor, apartmentNumber, utilityElectricity, utilityWaterHeat } = req.body

    // HOA is never editable here: residents use /request-membership and admins
    // are assigned to their HOA by a platform admin.
    const update = { firstName, lastName, phone, building, entrance, floor, apartmentNumber }
    if (utilityElectricity !== undefined) update.utilityElectricity = utilityElectricity
    if (utilityWaterHeat !== undefined) update.utilityWaterHeat = utilityWaterHeat

    const user = await User.findByIdAndUpdate(
        req.userId,
        update,
        { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
        return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'Profile updated', user })
})
