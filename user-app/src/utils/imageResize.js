// Shrink a photo in the browser before upload: phone photos are often 3–8 MB,
// which is slow on mobile data. Returns a JPEG File no larger than `maxSide`
// on its longest edge, or the original file if the browser can't decode it
// (e.g. HEIC outside Safari — the server/Cloudinary handles those).
export async function resizeImage(file, { maxSide = 1600, quality = 0.85 } = {}) {
    let bitmap
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
        return file
    }

    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    // Already small and already JPEG: keep the original bytes
    if (scale === 1 && file.type === 'image/jpeg') {
        bitmap.close?.()
        return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
}
