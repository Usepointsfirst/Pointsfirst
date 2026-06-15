import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// The email address you want new signup notifications sent to
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'pointsfirstapp@gmail.com'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // 1. Send confirmation email to the person who signed up
    await resend.emails.send({
      from: 'PointsFirst <onboarding@resend.dev>',  // Update to hello@usepointsfirst.com after domain verification
      to: email,
      subject: "You're on the PointsFirst waitlist 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F3F4F6;">
          <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#0A1628 0%,#1A3A8A 100%);padding:32px 32px 28px;">
              <p style="margin:0;color:white;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                Points<span style="color:#60A5FA;">First</span>
              </p>
            </div>

            <!-- Body -->
            <div style="padding:32px;">
              <h1 style="margin:0 0 12px;color:#111827;font-size:24px;font-weight:800;">
                You're in! 🎉
              </h1>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                You've secured your spot on the PointsFirst waitlist.
                As a <strong>founding member</strong>, you'll get early access and
                locked-in pricing when we launch — forever.
              </p>
              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.6;">
                We're building the first flight search that actually starts with your
                credit card points — not the destination. We'll be in touch the moment
                the doors open.
              </p>

              <!-- What to expect -->
              <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;font-weight:700;color:#1A3A8A;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">
                  What to expect
                </p>
                <ul style="margin:0;padding-left:18px;color:#4B5563;font-size:14px;line-height:2;">
                  <li>Early access before the public launch</li>
                  <li>Founding member pricing locked in forever</li>
                  <li>A say in what features get built first</li>
                </ul>
              </div>

              <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.6;">
                You're receiving this because you signed up at usepointsfirst.com.<br/>
                If this was a mistake, just ignore this email.
              </p>
            </div>

            <!-- Footer -->
            <div style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #F3F4F6;">
              <p style="margin:0;color:#9CA3AF;font-size:11px;">
                © 2026 PointsFirst · usepointsfirst.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    // 2. Notify yourself of the new signup
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
