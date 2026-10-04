import { z } from 'zod'

// ── Shared helpers ───────────────────────────────────────────────────────────
// Always trim BEFORE min-length checks so whitespace-only values are rejected.

const optionalTrimmed = z.string().trim().optional().or(z.literal(''))

const requiredStr = (msg, max = 200) =>
    z.string({ error: msg }).trim().min(1, msg).max(max)

const email = z
    .string({ error: 'Имэйл хаяг шаардлагатай' })
    .trim()
    .toLowerCase()
    .email('Имэйл хаяг буруу байна')
    .max(254)

const password = z
    .string({ error: 'Нууц үг шаардлагатай' })
    .min(6, 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой')
    .max(128, 'Нууц үг хэт урт байна')

const objectId = z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Буруу ID')

const month = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Сар "YYYY-MM" хэлбэртэй байх ёстой')

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
    email,
    password,
    firstName: requiredStr('Нэр шаардлагатай', 80),
    lastName:  requiredStr('Овог шаардлагатай', 80),
    phone: optionalTrimmed,
    building: optionalTrimmed,
    apartmentNumber: optionalTrimmed,
})

export const loginSchema = z.object({
    // Supports email OR phone as the identifier
    email: requiredStr('Имэйл эсвэл утас шаардлагатай', 254),
    password: z.string({ error: 'Нууц үг шаардлагатай' }).min(1, 'Нууц үг шаардлагатай').max(128),
})

export const requestMembershipSchema = z.object({
    hoaName: requiredStr('СӨХ-ийн нэрийг сонгоно уу', 120),
})

export const changePasswordSchema = z.object({
    currentPassword: z.string({ error: 'Одоогийн нууц үг шаардлагатай' }).min(1),
    newPassword: password,
})

export const changeEmailSchema = z.object({
    newEmail: email,
    currentPassword: z.string({ error: 'Нууц үг шаардлагатай' }).min(1),
})

export const forgotPasswordSchema = z.object({ email })

export const verifyOtpSchema = z.object({
    email,
    code: z.string({ error: 'Код шаардлагатай' }).trim().regex(/^\d{6}$/, 'Код 6 оронтой байх ёстой'),
})

export const resetPasswordSchema = z.object({
    resetToken: z.string({ error: 'Токен шаардлагатай' }).min(1),
    newPassword: password,
})

export const updateProfileSchema = z.object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName:  z.string().trim().min(1).max(80).optional(),
    phone: optionalTrimmed,
    building: optionalTrimmed,
    entrance: optionalTrimmed,
    floor: optionalTrimmed,
    apartmentNumber: optionalTrimmed,
    utilityElectricity: optionalTrimmed,
    utilityWaterHeat: optionalTrimmed,
}).strict()

// ── Address / apartment ──────────────────────────────────────────────────────

export const createAddressSchema = z.object({
    hoaName: requiredStr('СӨХ-ийн нэр шаардлагатай', 120),
    building: optionalTrimmed,
    entrance: optionalTrimmed,
    floor: optionalTrimmed,
    apartmentNumber: optionalTrimmed,
})

export const inviteTenantSchema = z.object({
    contact: requiredStr('Имэйл эсвэл утасны дугаар оруулна уу', 254),
})

// Route params for /api/apartments — each is validated only when present
export const apartmentParamsSchema = z.object({
    addressId: objectId.optional(),
    inviteId: objectId.optional(),
    userId: objectId.optional(),
})

// ── Platform admin: HOA admin management ────────────────────────────────────

export const createHoaSchema = z.object({
    name: requiredStr('СӨХ-ийн нэр шаардлагатай', 120),
    address: optionalTrimmed,
    adminFirstName: requiredStr('Админы нэр шаардлагатай', 80),
    adminLastName: requiredStr('Админы овог шаардлагатай', 80),
    adminEmail: email,
    adminPassword: password,
    adminPhone: optionalTrimmed,
})

export const createHoaAdminSchema = z.object({
    email,
    password,
    firstName: requiredStr('Нэр шаардлагатай', 80),
    lastName: requiredStr('Овог шаардлагатай', 80),
    phone: optionalTrimmed,
})

export const promoteHoaAdminSchema = z.object({
    identifier: requiredStr('Имэйл, утас эсвэл ID оруулна уу', 254),
})

// ── Payments ─────────────────────────────────────────────────────────────────

export const updatePaymentSettingsSchema = z.object({
    monthlyFee: z.coerce.number().positive().max(50_000_000).optional(),
    dueDay: z.coerce.number().int().min(1).max(28).optional(),
    description: z.string().trim().max(200).optional(),
})

export const generateBillsSchema = z.object({
    month,
})

export const generateBillForUserSchema = z.object({
    userId: objectId,
    month,
})

// Only the id is read — status is always verified against QPay's API
export const qpayCallbackSchema = z.object({
    invoiceId: objectId,
})

// ── Feedback / maintenance ───────────────────────────────────────────────────

export const submitFeedbackSchema = z.object({
    title: requiredStr('Гарчиг шаардлагатай', 200),
    description: requiredStr('Тайлбар шаардлагатай', 5000),
    type: z.enum(['complaint', 'suggestion', 'maintenance', 'other']).optional(),
})

export const respondFeedbackSchema = z.object({
    adminResponse: requiredStr('Хариулт шаардлагатай', 5000),
})

export const feedbackStatusSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved'], { error: 'Төлөв шаардлагатай' }),
})

// ── Vehicles ─────────────────────────────────────────────────────────────────

export const addVehicleSchema = z.object({
    plate: requiredStr('Улсын дугаар шаардлагатай', 20),
    model: optionalTrimmed,
    color: optionalTrimmed,
    isPrimary: z.boolean().optional(),
})

export const addGuestPassSchema = z.object({
    plate: requiredStr('Улсын дугаар шаардлагатай', 20),
    expiresAt: z.string({ error: 'Дуусах огноо шаардлагатай' }).min(1),
})

// ── Admin content ────────────────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
    title: requiredStr('Гарчиг шаардлагатай', 200),
    content: requiredStr('Агуулга шаардлагатай', 10000),
})

export const updateAnnouncementSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(10000).optional(),
}).strict()

export const createEventSchema = z.object({
    title: requiredStr('Гарчиг шаардлагатай', 200),
    description: optionalTrimmed,
    date: z.string({ error: 'Огноо шаардлагатай' }).min(1),
    time: optionalTrimmed,
    location: optionalTrimmed,
})

export const updateEventSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: optionalTrimmed,
    date: z.string().min(1).optional(),
    time: optionalTrimmed,
    location: optionalTrimmed,
}).strict()

export const createNotificationSchema = z.object({
    title: requiredStr('Гарчиг шаардлагатай', 200),
    message: requiredStr('Мессеж шаардлагатай', 2000),
    type: z.enum(['announcement', 'payment', 'event', 'general', 'feedback', 'maintenance']).optional(),
})

const CONTACT_CATEGORIES = ['hoa', 'heating', 'electricity', 'water', 'plumbing', 'elevator', 'security', 'internet', 'other']

export const createContactSchema = z.object({
    name: requiredStr('Үйлчилгээний нэрийг оруулна уу', 120),
    category: z.enum(CONTACT_CATEGORIES).optional(),
    phone: optionalTrimmed,
    email: z.union([z.literal(''), z.string().trim().email('Имэйл хаяг буруу байна')]).optional(),
    description: optionalTrimmed,
    order: z.coerce.number().int().min(0).max(9999).optional(),
})

export const updateContactSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    category: z.enum(CONTACT_CATEGORIES).optional(),
    phone: optionalTrimmed,
    email: z.union([z.literal(''), z.string().trim().email('Имэйл хаяг буруу байна')]).optional(),
    description: optionalTrimmed,
    order: z.coerce.number().int().min(0).max(9999).optional(),
})

// ── Group chat ───────────────────────────────────────────────────────────────

export const sendChatMessageSchema = z.object({
    content: requiredStr('Мессеж хоосон байж болохгүй', 2000),
})

export const createRuleSchema = z.object({
    title: requiredStr('Дүрмийн гарчгийг оруулна уу', 200),
    items: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
    order: z.coerce.number().int().min(0).max(9999).optional(),
})

export const updateRuleSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    items: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
    order: z.coerce.number().int().min(0).max(9999).optional(),
})
