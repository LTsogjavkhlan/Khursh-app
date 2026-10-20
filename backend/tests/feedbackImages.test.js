// Feedback photos: validation, storage, cleanup — against a fake image store.
import { test, before, after, beforeEach } from 'node:test'
import { startServer, checker } from './helpers.js'
import { setImageStoreForTests } from '../utils/imageStore.js'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'
import Feedback from '../models/Feedback.js'

// Minimal byte signatures; the fake store never decodes them
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)])
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 2)])
const HEIC = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), Buffer.alloc(200, 3)])
const jpg = (name = 'a.jpg') => ({ name, type: 'image/jpeg', bytes: JPEG })

// Records uploads/deletes; can be told to fail on the Nth upload
let fake
const makeFake = ({ failOn = 0 } = {}) => {
    const state = { uploads: [], removed: [], n: 0 }
    state.upload = async (buffer, { folder, type }) => {
        state.n++
        if (failOn && state.n === failOn) throw new Error('cloudinary down')
        const publicId = `${folder}/img${state.n}`
        state.uploads.push({ folder, type, size: buffer.length, publicId })
        return { url: `https://img.test/${publicId}.jpg`, thumbUrl: `https://img.test/t/${publicId}.jpg`, publicId, width: 100, height: 80 }
    }
    state.remove = async (ids) => { state.removed.push(...ids) }
    return state
}

let h, hoaA, ownerTok, adminTok
const fields = { title: 'Гомдол', description: 'Шат эвдэрсэн', type: 'complaint' }
const submit = (files, token = ownerTok) => h.upload('/api/feedback', { token, fields, files })

before(async () => {
    h = await startServer(5197)
    hoaA = await Hoa.create({ name: 'A' })
    await User.create({ email: 'admin@a.mn', password: 'secret123', firstName: 'Ad', lastName: 'Min', role: 'admin', hoa: hoaA._id, hoaName: 'A' })
    adminTok = await h.login('admin@a.mn')
    ownerTok = await h.register('owner@x.mn')
    const apt = (await h.api('/api/addresses', { token: ownerTok, method: 'POST', body: { hoaName: 'A', apartmentNumber: '1' } })).data
    await h.api(`/api/addresses/admin/${apt._id}/accept`, { token: adminTok, method: 'PUT' })
})
beforeEach(() => { fake = makeFake(); setImageStoreForTests(fake) })
after(async () => { setImageStoreForTests(null); await h.stop() })

test('photos are stored and returned to the resident and the HOA admin', async () => {
    const c = checker()
    const res = await submit([jpg('1.jpg'), { name: '2.png', type: 'image/png', bytes: PNG }, { name: '3.heic', type: 'image/heic', bytes: HEIC }])
    c.check('201', res.status === 201, res)
    c.check('3 images on the feedback', res.data?.feedback?.images?.length === 3)
    c.check('types detected from contents', fake.uploads.map(u => u.type).join() === 'jpeg,png,heic', fake.uploads)
    c.check('stored in this HOA\'s folder', fake.uploads.every(u => u.folder === `hoa/${hoaA._id}/feedback`), fake.uploads[0])
    const mine = (await h.api('/api/feedback/my', { token: ownerTok })).data
    c.check('resident sees images in history', mine[0]?.images?.[0]?.thumbUrl?.startsWith('https://'))
    const all = (await h.api('/api/feedback/admin/all', { token: adminTok })).data
    c.check('admin sees images', all[0]?.images?.length === 3)
    c.done()
})

test('text-only feedback still works, as JSON and as multipart', async () => {
    const c = checker()
    c.check('JSON', (await h.api('/api/feedback', { token: ownerTok, method: 'POST', body: fields })).status === 201)
    const multi = await submit([])
    c.check('multipart without files', multi.status === 201 && multi.data.feedback.images.length === 0, multi)
    c.check('nothing uploaded', fake.uploads.length === 0)
    c.done()
})

test('limits and file checks', async () => {
    const c = checker()
    const before = await Feedback.countDocuments()
    const four = await submit([jpg(), jpg(), jpg(), jpg()])
    c.check('4 photos: 400', four.status === 400, four)
    const big = await submit([{ name: 'big.jpg', type: 'image/jpeg', bytes: Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)]) }])
    c.check('over 5MB: 400', big.status === 400, big)
    const fakeImg = await submit([jpg(), { name: 'evil.jpg', type: 'image/jpeg', bytes: Buffer.from('<script>alert(1)</script> not an image') }])
    c.check('non-image disguised as .jpg: 400', fakeImg.status === 400, fakeImg)
    c.check('wrong field name: 400', (await h.upload('/api/feedback', { token: ownerTok, fields, files: [jpg()], fileField: 'photo' })).status === 400)
    c.check('missing description: 400', (await h.upload('/api/feedback', { token: ownerTok, fields: { title: 'x' }, files: [jpg()] })).status === 400)
    c.check('nothing uploaded for rejected requests', fake.uploads.length === 0, fake.uploads)
    c.check('no feedback saved', (await Feedback.countDocuments()) === before)
    c.check('no login: 401', (await h.upload('/api/feedback', { fields, files: [jpg()] })).status === 401)
    c.done()
})

test('a failed upload leaves nothing behind', async () => {
    const c = checker()
    fake = makeFake({ failOn: 2 })
    setImageStoreForTests(fake)
    const before = await Feedback.countDocuments()
    const res = await submit([jpg('1.jpg'), jpg('2.jpg'), jpg('3.jpg')])
    c.check('502', res.status === 502, res)
    c.check('error does not leak internals', !JSON.stringify(res.data).includes('cloudinary down'))
    c.check('first photo deleted again', fake.removed.length === 1 && fake.removed[0] === fake.uploads[0].publicId, fake)
    c.check('no feedback saved', (await Feedback.countDocuments()) === before)
    c.done()
})

test('without an image store, photos are refused but text still works', async () => {
    const c = checker()
    setImageStoreForTests(null) // and no CLOUDINARY_* env in tests
    const withPhotos = await submit([jpg()])
    c.check('photos: 503 with explanation', withPhotos.status === 503 && /Зураг/.test(withPhotos.data?.message), withPhotos)
    c.check('text-only: 201', (await submit([])).status === 201)
    c.done()
})
