import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'usepointsfirst@gmail.com'
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
const MAILCHIMP_AUDIENCE_ID = 'fffe0a0321'
const MAILCHIMP_SERVER = 'us16'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // 1. Add subscriber to Mailchimp (triggers welcome automation)
    const mcRes = await fetch(
      `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_address: email, status: 'subscribed' }),
      }
    )

    if (!mcRes.ok) {
      const err = await mcRes.json()
      if (err.title === 'Member Exists') {
        return Response.json({ success: true })
      }
      throw new Error(err.detail)
    }

    // 2. Notify Kenny of the new signup
    await resend.emails.send({
      from: 'PointsFirst Signups <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject: `🎉 New waitlist signup: ${email}`,
      html: `<div style="font-family:sans-serif;padding:20px;"><h2 style="color:#E8B84B;">New Waitlist Signup</h2><p><strong>Email:</strong> ${email}</p><p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</p></div>`,
    })

    return Response.json({ success: true })

  } catch (error) {
    console.error('Subscribe error:', error)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
