import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'usepointsfirst@gmail.com'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'PointsFirst <onboarding@resend.dev>',
      to: email,
      subject: "You're on the PointsFirst waitlist",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0D0D0D;">
          <div style="max-width:560px;margin:40px auto;background:#111111;border-radius:16px;overflow:hidden;border:1px solid rgba(232,184,75,0.15);">
            <div style="background:linear-gradient(135deg,#111111 0%,#1C1C1C 100%);padding:32px 32px 28px;border-bottom:1px solid rgba(232,184,75,0.15);">
              <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                <span style="background:linear-gradient(135deg,#E8B84B 0%,#F5D98A 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Points</span><span style="color:white;">First</span>
              </p>
            </div>
            <div style="padding:32px;">
              <h1 style="margin:0 0 12px;color:white;font-size:24px;font-weight:800;">You're on the list.</h1>
              <p style="margin:0 0 16px;color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;">
                You've secured your spot on the PointsFirst waitlist.
                As a <strong style="color:white;">founding member</strong>, you'll get early access and locked-in pricing when we launch.
              </p>
              <p style="margin:0 0 28px;color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;">
                We're building the first flight search that starts with your points — not the destination. We'll be in touch the moment the doors open.
              </p>
              <div style="background:rgba(232,184,75,0.08);border:1px solid rgba(232,184,75,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;font-weight:700;color:#E8B84B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">What to expect</p>
                <ul style="margin:0;padding-left:18px;color:rgba(255,255,255,0.65);font-size:14px;line-height:2.2;">
                  <li>Early access before the public launch</li>
                  <li>Founding member pricing locked in forever</li>
                  <li>A say in what features get built first</li>
                </ul>
              </div>
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.6;">
                You're receiving this because you signed up at usepointsfirst.com.<br/>
                If this was a mistake, just ignore this email.
              </p>
            </div>
            <div style="padding:16px 32px;background:#0D0D0D;border-top:1px solid rgba(232,184,75,0.1);">
              <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;">© 2026 PointsFirst · usepointsfirst.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    await resend.emails.send({
      from: 'PointsFirst Signups <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject: `🎉 New waitlist signup: ${email}`,
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#1A3A8A;">New Waitlist Signup</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</p>
        </div>
      `,
    })

    return Response.json({ success: true })

  } catch (error) {
    console.error('Subscribe error:', error)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
