import nodemailer from 'nodemailer'

export async function sendOtpEmail(toEmail, code) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    await transporter.sendMail({
        from: `"СӨХ Апп" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Нууц үг сэргээх код',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
                <h2 style="color: #1f2937; margin-bottom: 8px;">Нууц үг сэргээх</h2>
                <p style="color: #6b7280; margin-bottom: 24px;">Доорх 4 оронтой кодыг 15 минутын дотор оруулна уу.</p>
                <div style="background: #2563eb; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 20px; border-radius: 10px; margin-bottom: 24px;">
                    ${code}
                </div>
                <p style="color: #9ca3af; font-size: 13px;">Хэрэв та энэ хүсэлт гаргаагүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
            </div>
        `
    })
}
