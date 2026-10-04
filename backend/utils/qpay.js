import axios from 'axios'

// QPay merchant API (v2). Credentials are read lazily so module load order
// relative to dotenv does not matter.
const baseUrl = () => process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2'

export const isQPayConfigured = () =>
    Boolean(process.env.QPAY_CLIENT_ID && process.env.QPAY_CLIENT_SECRET)

const getAccessToken = async () => {
    const { data } = await axios.post(`${baseUrl()}/auth/token`, null, {
        auth: {
            username: process.env.QPAY_CLIENT_ID,
            password: process.env.QPAY_CLIENT_SECRET,
        },
        timeout: 10_000,
    })
    return data.access_token
}

// Ask QPay itself what has been paid against an invoice. This is the only
// trustworthy source of payment status — the public callback endpoint can be
// called by anyone, so nothing in its request body may be believed.
// Returns { paidAmount, paymentId } where paymentId is the first PAID row's id.
export const checkInvoicePayment = async (qpayInvoiceId) => {
    const token = await getAccessToken()
    const { data } = await axios.post(
        `${baseUrl()}/payment/check`,
        {
            object_type: 'INVOICE',
            object_id: qpayInvoiceId,
            offset: { page_number: 1, page_limit: 100 },
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10_000 }
    )
    const paidRows = (data?.rows || []).filter(r => r.payment_status === 'PAID')
    return {
        paidAmount: paidRows.reduce((sum, r) => sum + Number(r.payment_amount || 0), 0),
        paymentId: paidRows[0]?.payment_id ? String(paidRows[0].payment_id) : null,
    }
}
