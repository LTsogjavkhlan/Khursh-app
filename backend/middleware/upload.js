import multer from 'multer'

export const MAX_IMAGES = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// Accepts up to MAX_IMAGES files in the multipart field `images`, held in
// memory only (never written to disk). Requests that aren't multipart pass
// straight through, so plain JSON submissions keep working.
const parser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES, fields: 20 },
}).array('images', MAX_IMAGES)

const MESSAGES = {
    LIMIT_FILE_SIZE: 'Зураг тус бүр 5MB-аас ихгүй байх ёстой',
    LIMIT_FILE_COUNT: `Хамгийн ихдээ ${MAX_IMAGES} зураг хавсаргах боломжтой`,
    LIMIT_UNEXPECTED_FILE: `Хамгийн ихдээ ${MAX_IMAGES} зураг хавсаргах боломжтой`,
}

export const uploadImages = (req, res, next) => {
    parser(req, res, (err) => {
        if (!err) return next()
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: MESSAGES[err.code] || 'Зураг хүлээн авахад алдаа гарлаа' })
        }
        next(err)
    })
}

// ── Report attachments (images and PDFs) ────────────────────────────────────

export const MAX_REPORT_FILES_PER_UPLOAD = 5
export const MAX_REPORT_FILE_BYTES = 10 * 1024 * 1024

const reportParser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_REPORT_FILE_BYTES, files: MAX_REPORT_FILES_PER_UPLOAD, fields: 5 },
}).array('files', MAX_REPORT_FILES_PER_UPLOAD)

const REPORT_MESSAGES = {
    LIMIT_FILE_SIZE: 'Файл тус бүр 10MB-аас ихгүй байх ёстой',
    LIMIT_FILE_COUNT: `Нэг удаад хамгийн ихдээ ${MAX_REPORT_FILES_PER_UPLOAD} файл оруулна`,
    LIMIT_UNEXPECTED_FILE: `Нэг удаад хамгийн ихдээ ${MAX_REPORT_FILES_PER_UPLOAD} файл оруулна`,
}

export const uploadReportFiles = (req, res, next) => {
    reportParser(req, res, (err) => {
        if (!err) return next()
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: REPORT_MESSAGES[err.code] || 'Файл хүлээн авахад алдаа гарлаа' })
        }
        next(err)
    })
}
