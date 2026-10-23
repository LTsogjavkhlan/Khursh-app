import { randomUUID } from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'

// File storage for user uploads (feedback photos, report images and PDFs),
// backed by Cloudinary.
// Credentials are read lazily from the environment, like the rest of config.

const MAX_SIDE = 1600   // longest side after Cloudinary's incoming resize
const THUMB_SIDE = 240

export const isImageStoreConfigured = () => Boolean(
    testStore || (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    )
)

const configure = () => cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

// Identify an image by its first bytes rather than trusting the client's
// filename or Content-Type. Returns 'jpeg' | 'png' | 'webp' | 'heic' | null.
export const sniffImageType = (buf) => {
    if (!buf || buf.length < 12) return null
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
    // HEIC/HEIF (iPhone photos): an ISO-BMFF "ftyp" box with a HEIF brand
    if (buf.toString('ascii', 4, 8) === 'ftyp' &&
        ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(buf.toString('ascii', 8, 12))) return 'heic'
    return null
}

// Report attachments may also be PDFs (receipts, statements)
export const sniffFileType = (buf) => {
    if (buf && buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-') return 'pdf'
    return sniffImageType(buf)
}

// PDFs are stored as "raw" files: Cloudinary blocks PDF delivery from the
// image pipeline on many accounts, while raw files are served as-is. The .pdf
// suffix on the id makes browsers open it as a document.
const uploadRaw = (buffer, { folder }) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'raw', public_id: `${randomUUID()}.pdf` },
        (err, result) => {
            if (err) return reject(err)
            resolve({ url: result.secure_url, thumbUrl: null, publicId: result.public_id, resourceType: 'raw', bytes: result.bytes })
        }
    )
    stream.end(buffer)
})

const realStore = {
    // Upload one image buffer into `folder`. HEIC is converted to JPEG so it
    // displays in every browser; everything is resized to fit MAX_SIDE.
    upload(buffer, { folder, type }) {
        configure()
        if (type === 'pdf') return uploadRaw(buffer, { folder })
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    ...(type === 'heic' ? { format: 'jpg' } : {}),
                    transformation: [{ width: MAX_SIDE, height: MAX_SIDE, crop: 'limit', quality: 'auto' }],
                },
                (err, result) => {
                    if (err) return reject(err)
                    resolve({
                        url: result.secure_url,
                        thumbUrl: cloudinary.url(result.public_id, {
                            secure: true,
                            transformation: [{ width: THUMB_SIDE, height: THUMB_SIDE, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' }],
                        }),
                        publicId: result.public_id,
                        resourceType: 'image',
                        width: result.width,
                        height: result.height,
                    })
                }
            )
            stream.end(buffer)
        })
    },
    async remove(publicIds, resourceType = 'image') {
        if (!publicIds.length) return
        configure()
        await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType })
    },
}

// Tests swap in a fake so they never touch a real Cloudinary account
let testStore = null
export const setImageStoreForTests = (store) => { testStore = store }

const store = () => testStore || realStore

export const uploadImage = (buffer, opts) => store().upload(buffer, opts)

// Best-effort cleanup; never throws (a failed delete only leaves an orphan)
export const deleteImages = async (publicIds, resourceType = 'image') => {
    try {
        await store().remove(publicIds, resourceType)
    } catch {
        // ignore
    }
}
