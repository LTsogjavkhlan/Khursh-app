// Transparency reports: drafts vs published, HOA isolation, totals,
// notifications and attachments (against a fake file store).
import { test, before, after, beforeEach } from 'node:test'
import { startServer, checker } from './helpers.js'
import { setImageStoreForTests } from '../utils/imageStore.js'
import User from '../models/User.js'
import Hoa from '../models/Hoa.js'
import Notification from '../models/Notification.js'

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)])
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(200, 2)])
const TXT = Buffer.from('just some text, definitely not an image or a pdf')

let fake
const makeFake = ({ failOn = 0 } = {}) => {
    const state = { uploads: [], removed: [], n: 0 }
    state.upload = async (buffer, { folder, type }) => {
        state.n++
        if (failOn && state.n === failOn) throw new Error('cloudinary down')
        const publicId = `${folder}/f${state.n}`
        state.uploads.push({ folder, type, publicId })
        return type === 'pdf'
            ? { url: `https://files.test/${publicId}.pdf`, thumbUrl: null, publicId, resourceType: 'raw' }
            : { url: `https://img.test/${publicId}.jpg`, thumbUrl: `https://img.test/t/${publicId}.jpg`, publicId, resourceType: 'image', width: 10, height: 10 }
    }
    state.remove = async (ids, type = 'image') => { ids.forEach(id => state.removed.push(`${type}:${id}`)) }
    return state
}

let h, hoaA, hoaB, adminA, adminB, residentA, residentB

const FULL = {
    title: '2026 оны 3-р улирлын тайлан',
    summary: 'Лифт засварлаж, хүүхдийн тоглоомын талбай шинэчиллээ.',
    periodStart: '2026-07-01',
    periodEnd: '2026-09-30',
    sections: [
        { kind: 'work', body: 'Хийгдсэн ажлууд', items: [{ label: 'Лифт засвар' }, { label: 'Талбай шинэчлэл', note: '9-р сард' }] },
        { kind: 'income', items: [{ label: 'СӨХ-ийн хураамж', amount: 250000 }, { label: 'Зогсоолын түрээс', amount: 50000 }] },
        { kind: 'expense', items: [{ label: 'Лифтний сэлбэг', amount: 100000 }, { label: 'Цэвэрлэгээ', amount: 20000 }] },
        { kind: 'plan', body: 'Ирэх улиралд дээврийн засвар хийнэ.' },
    ],
}

const create = (body = FULL, token = adminA) => h.api('/api/reports', { token, method: 'POST', body })
const act = (id, action, token = adminA) => h.api(`/api/reports/${id}/${action}`, { token, method: 'PUT' })
const attach = (id, files, token = adminA) => h.upload(`/api/reports/${id}/attachments`, { token, files, fileField: 'files' })

// A resident with an accepted apartment in `hoaName`
const joinHoa = async (email, hoaName, adminTok) => {
    const tok = await h.register(email)
    const apt = (await h.api('/api/addresses', { token: tok, method: 'POST', body: { hoaName, apartmentNumber: '1' } })).data
    await h.api(`/api/addresses/admin/${apt._id}/accept`, { token: adminTok, method: 'PUT' })
    return tok
}

before(async () => {
    h = await startServer(5198)
    hoaA = await Hoa.create({ name: 'A' })
    hoaB = await Hoa.create({ name: 'B' })
    await User.create({ email: 'admin@a.mn', password: 'secret123', firstName: 'A', lastName: 'Admin', role: 'admin', hoa: hoaA._id, hoaName: 'A' })
    await User.create({ email: 'admin@b.mn', password: 'secret123', firstName: 'B', lastName: 'Admin', role: 'admin', hoa: hoaB._id, hoaName: 'B' })
    adminA = await h.login('admin@a.mn')
    adminB = await h.login('admin@b.mn')
    residentA = await joinHoa('res@a.mn', 'A', adminA)
    residentB = await joinHoa('res@b.mn', 'B', adminB)
})
beforeEach(() => { fake = makeFake(); setImageStoreForTests(fake) })
after(async () => { setImageStoreForTests(null); await h.stop() })

test('drafts are invisible to residents; totals are computed by the server', async () => {
    const c = checker()
    const res = await create()
    c.check('201', res.status === 201, res)
    const r = res.data
    c.check('starts as draft', r.status === 'draft')
    c.check('income total', r.totals?.income === 300000, r.totals)
    c.check('expense total', r.totals?.expense === 120000)
    c.check('net', r.totals?.net === 180000)
    c.check('section totals', r.sections[1].total === 300000 && r.sections[0].total === null, r.sections.map(s => s.total))
    c.check('period stored as day', String(r.periodStart).startsWith('2026-07-01'))

    c.check('resident list hides draft', (await h.api('/api/reports', { token: residentA })).data.length === 0)
    c.check('resident cannot open draft', (await h.api(`/api/reports/${r._id}`, { token: residentA })).status === 404)
    c.check('admin list includes draft', (await h.api('/api/reports/admin/all', { token: adminA })).data.some(x => x._id === r._id))
    c.done()
})

test('only HOA admins can manage reports', async () => {
    const c = checker()
    c.check('resident cannot create', (await create(FULL, residentA)).status === 403)
    c.check('resident cannot list drafts', (await h.api('/api/reports/admin/all', { token: residentA })).status === 403)
    const r = (await create()).data
    c.check('resident cannot publish', (await act(r._id, 'publish', residentA)).status === 403)
    c.check('resident cannot attach', (await attach(r._id, [{ name: 'a.jpg', type: 'image/jpeg', bytes: JPEG }], residentA)).status === 403)
    c.check('nothing uploaded', fake.uploads.length === 0)
    c.check('anonymous rejected', (await h.api('/api/reports')).status === 401)
    c.done()
})

test('publish, notify once, unpublish', async () => {
    const c = checker()
    const r = (await create({ ...FULL, title: 'Publish flow' })).data
    const before = await Notification.countDocuments({ type: 'report', hoa: hoaA._id })

    const pub = await act(r._id, 'publish')
    c.check('published', pub.status === 200 && pub.data.status === 'published' && pub.data.publishedAt, pub)
    const list = (await h.api('/api/reports', { token: residentA })).data
    const mine = list.find(x => x._id === r._id)
    c.check('resident sees it', Boolean(mine))
    c.check('resident view has totals', mine?.totals?.net === 180000)
    c.check('resident view hides editing trail', mine && !('createdBy' in mine) && !('status' in mine), mine && Object.keys(mine))
    c.check('resident can open it', (await h.api(`/api/reports/${r._id}`, { token: residentA })).status === 200)
    c.check('one notification', await Notification.countDocuments({ type: 'report', hoa: hoaA._id }) === before + 1)

    const un = await act(r._id, 'unpublish')
    c.check('unpublished', un.data.status === 'draft' && un.data.publishedAt === null)
    c.check('hidden again', !(await h.api('/api/reports', { token: residentA })).data.some(x => x._id === r._id))
    c.check('detail 404 again', (await h.api(`/api/reports/${r._id}`, { token: residentA })).status === 404)

    await act(r._id, 'publish')
    c.check('re-publish does not notify again', await Notification.countDocuments({ type: 'report', hoa: hoaA._id }) === before + 1)
    const notif = (await h.api('/api/notifications', { token: residentA })).data
    c.check('resident received it', notif.some(n => n.type === 'report' && n.message === 'Publish flow'))
    c.done()
})

test('an empty report cannot be published', async () => {
    const c = checker()
    const r = (await create({ title: 'Хоосон' })).data
    const res = await act(r._id, 'publish')
    c.check('400', res.status === 400, res)
    c.check('still draft', (await h.api(`/api/reports/admin/${r._id}`, { token: adminA })).data.status === 'draft')
    c.done()
})

test('reports never cross HOAs', async () => {
    const c = checker()
    const r = (await create({ ...FULL, title: 'A only' })).data
    await act(r._id, 'publish')
    c.check('other HOA resident sees nothing', !(await h.api('/api/reports', { token: residentB })).data.some(x => x._id === r._id))
    c.check('other HOA resident cannot open', (await h.api(`/api/reports/${r._id}`, { token: residentB })).status === 404)
    c.check('other HOA admin cannot read', (await h.api(`/api/reports/admin/${r._id}`, { token: adminB })).status === 404)
    c.check('other HOA admin cannot edit', (await h.api(`/api/reports/${r._id}`, { token: adminB, method: 'PUT', body: FULL })).status === 404)
    c.check('other HOA admin cannot unpublish', (await act(r._id, 'unpublish', adminB)).status === 404)
    c.check('other HOA admin cannot delete', (await h.api(`/api/reports/${r._id}`, { token: adminB, method: 'DELETE' })).status === 404)
    c.check('still published', (await h.api(`/api/reports/${r._id}`, { token: residentA })).status === 200)
    c.done()
})

test('edits replace content; status and HOA cannot be smuggled in; bad input rejected', async () => {
    const c = checker()
    const r = (await create()).data
    const upd = await h.api(`/api/reports/${r._id}`, {
        token: adminA, method: 'PUT',
        body: { title: 'Шинэчилсэн', sections: [{ kind: 'expense', items: [{ label: 'Будаг', amount: 5000 }] }], status: 'published', hoa: String(hoaB._id) },
    })
    c.check('200', upd.status === 200, upd)
    c.check('title updated', upd.data.title === 'Шинэчилсэн')
    c.check('sections replaced', upd.data.sections.length === 1 && upd.data.totals.expense === 5000 && upd.data.totals.income === null)
    c.check('net only with both sides', upd.data.totals.net === null)
    c.check('status not changed by edit', upd.data.status === 'draft')
    c.check('hoa not changed', String(upd.data.hoa) === String(hoaA._id))

    const bad = (body) => h.api(`/api/reports/${r._id}`, { token: adminA, method: 'PUT', body })
    c.check('negative amount', (await bad({ title: 'x', sections: [{ kind: 'income', items: [{ label: 'a', amount: -1 }] }] })).status === 400)
    c.check('unknown section kind', (await bad({ title: 'x', sections: [{ kind: 'secret' }] })).status === 400)
    c.check('reversed period', (await bad({ title: 'x', periodStart: '2026-09-01', periodEnd: '2026-08-01' })).status === 400)
    c.check('missing title', (await bad({ title: '  ' })).status === 400)
    c.check('malformed id', (await h.api('/api/reports/nope', { token: residentA })).status === 400)
    c.done()
})

test('attachments: images and PDFs, contents checked, cleaned up on removal', async () => {
    const c = checker()
    const r = (await create()).data
    const res = await attach(r._id, [
        { name: 'баримт.jpg', type: 'image/jpeg', bytes: JPEG },
        { name: 'тайлан.pdf', type: 'application/pdf', bytes: PDF },
    ])
    c.check('201', res.status === 201, res)
    const atts = res.data?.attachments || []
    c.check('two attachments', atts.length === 2)
    c.check('kinds detected from contents', atts.map(a => a.kind).join() === 'image,pdf', atts)
    c.check('Cyrillic file names kept', atts.map(a => a.name).join() === 'баримт.jpg,тайлан.pdf', atts.map(a => a.name))
    c.check('stored per report', fake.uploads.every(u => u.folder === `hoa/${hoaA._id}/reports/${r._id}`))

    const rejected = await attach(r._id, [{ name: 'evil.pdf', type: 'application/pdf', bytes: TXT }])
    c.check('non-image/pdf rejected', rejected.status === 400, rejected)
    c.check('nothing extra uploaded', fake.uploads.length === 2)

    await act(r._id, 'publish')
    const pubView = (await h.api(`/api/reports/${r._id}`, { token: residentA })).data
    c.check('resident sees attachments without storage ids', pubView.attachments.length === 2 && !('publicId' in pubView.attachments[0]))

    const pdfId = atts.find(a => a.kind === 'pdf')._id
    const del = await h.api(`/api/reports/${r._id}/attachments/${pdfId}`, { token: adminA, method: 'DELETE' })
    c.check('attachment removed', del.status === 200 && del.data.attachments.length === 1)
    c.check('pdf deleted from storage as raw', fake.removed.some(x => x.startsWith('raw:')), fake.removed)

    const gone = await h.api(`/api/reports/${r._id}`, { token: adminA, method: 'DELETE' })
    c.check('report deleted', gone.status === 200)
    c.check('remaining image deleted from storage', fake.removed.some(x => x.startsWith('image:')), fake.removed)
    c.check('report gone for admin', (await h.api(`/api/reports/admin/${r._id}`, { token: adminA })).status === 404)
    c.done()
})

test('a failed upload leaves nothing behind', async () => {
    const c = checker()
    fake = makeFake({ failOn: 2 }); setImageStoreForTests(fake)
    const r = (await create()).data
    const res = await attach(r._id, [
        { name: 'a.jpg', type: 'image/jpeg', bytes: JPEG },
        { name: 'b.jpg', type: 'image/jpeg', bytes: JPEG },
    ])
    c.check('502', res.status === 502, res)
    c.check('first upload cleaned up', fake.removed.length === 1, fake.removed)
    c.check('no attachments saved', (await h.api(`/api/reports/admin/${r._id}`, { token: adminA })).data.attachments.length === 0)
    c.done()
})

test('newest published first, limit honoured', async () => {
    const c = checker()
    const a = (await create({ ...FULL, title: 'Older' })).data
    const b = (await create({ ...FULL, title: 'Newer' })).data
    await act(a._id, 'publish')
    await new Promise(r => setTimeout(r, 10))
    await act(b._id, 'publish')
    const one = (await h.api('/api/reports?limit=1', { token: residentA })).data
    c.check('limit 1', one.length === 1)
    c.check('newest first', one[0]?.title === 'Newer', one[0]?.title)
    c.done()
})
