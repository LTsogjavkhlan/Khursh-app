import User from '../models/User.js'
import Otp from '../models/Otp.js'
import jwt from 'jsonwebtoken'
import { sendOtpEmail } from '../utils/mailer.js'

const generateToken = (id, role, hoaName) => {
    return jwt.sign({ id, role, hoaName: hoaName || null }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    })
}

export const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, hoaName, building, apartmentNumber } = req.body

        // Check if user exists
        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ message: 'User already exists' })
        }

        // Create new user
        user = new User({
            email,
            password,
            firstName,
            lastName,
            phone,
            hoaName,
            building,
            apartmentNumber,
            role: 'user' // Default role
        })

        await user.save()

        const token = generateToken(user._id, user.role, user.hoaName)

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
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
                utilityWaterHeat:   user.utilityWaterHeat   || '',
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const login = async (req, res) => {
    try {
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

        // Check password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const token = generateToken(user._id, user.role, user.hoaName)

        res.json({
            message: 'Login successful',
            token,
            user: {
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
                utilityWaterHeat:   user.utilityWaterHeat   || '',
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password')
        res.json(user)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const requestMembership = async (req, res) => {
    try {
        const { hoaName } = req.body
        if (!hoaName) {
            return res.status(400).json({ message: 'СӨХ-ийн нэрийг сонгоно уу' })
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { hoaName, membershipStatus: 'pending' },
            { new: true }
        ).select('-password')

        if (!user) return res.status(404).json({ message: 'User not found' })

        res.json({ message: 'Хүсэлт амжилттай илгээгдлээ', user })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const changePassword = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const changeEmail = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: 'Имэйл хаяг оруулна уу' })

        const user = await User.findOne({ email: email.toLowerCase() })
        // Always respond OK to prevent email enumeration
        if (!user) return res.json({ message: 'Хэрэв имэйл бүртгэлтэй бол код илгээгдлээ' })

        const code = String(Math.floor(1000 + Math.random() * 9000))
        await Otp.deleteMany({ email: email.toLowerCase() }) // clear old codes
        await Otp.create({ email: email.toLowerCase(), code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) })
        await sendOtpEmail(email.toLowerCase(), code)
        res.json({ message: 'Хэрэв имэйл бүртгэлтэй бол код илгээгдлээ' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { email, code } = req.body
        const otp = await Otp.findOne({ email: email.toLowerCase(), code, used: false })
        if (!otp || otp.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Код буруу эсвэл хугацаа дууссан байна' })
        }
        otp.used = true
        await otp.save()

        // Issue a short-lived reset token
        const resetToken = jwt.sign({ email: email.toLowerCase(), purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' })
        res.json({ resetToken })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' })
        }
        let payload
        try {
            payload = jwt.verify(resetToken, process.env.JWT_SECRET)
        } catch {
            return res.status(400).json({ message: 'Токен хүчингүй эсвэл хугацаа дууссан' })
        }
        if (payload.purpose !== 'reset') {
            return res.status(400).json({ message: 'Буруу токен' })
        }
        const user = await User.findOne({ email: payload.email })
        if (!user) return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' })
        user.password = newPassword
        await user.save()
        res.json({ message: 'Нууц үг амжилттай сэргээгдлээ' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, building, entrance, floor, apartmentNumber, hoaName, utilityElectricity, utilityWaterHeat } = req.body

        // Admins can update hoaName (their organization); regular users must use /request-membership
        const update = { firstName, lastName, phone, building, entrance, floor, apartmentNumber }
        if (req.userRole === 'admin' && hoaName !== undefined) update.hoaName = hoaName
        if (utilityElectricity !== undefined) update.utilityElectricity = utilityElectricity
        if (utilityWaterHeat   !== undefined) update.utilityWaterHeat   = utilityWaterHeat

        const user = await User.findByIdAndUpdate(
            req.userId,
            update,
            { new: true, runValidators: true }
        ).select('-password')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.json({ message: 'Profile updated', user })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
