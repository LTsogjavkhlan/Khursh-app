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
