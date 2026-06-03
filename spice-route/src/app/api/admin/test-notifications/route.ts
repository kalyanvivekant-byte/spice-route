import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import twilio from 'twilio'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

// Diagnostic: actually attempt an email + SMS and return the provider's real result/error.
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { email, phone } = await request.json()

  const out: any = {
    config: {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? '(unset → noreply@spiceroute.eu)',
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? '(unset)',
    },
  }

  // ── Email test ──
  if (email) {
    const key = process.env.RESEND_API_KEY
    if (!key || key === 're_placeholder') {
      out.email = { ok: false, error: 'RESEND_API_KEY not set' }
    } else {
      try {
        const resend = new Resend(key)
        const from = `Spice Route <${process.env.RESEND_FROM_EMAIL ?? 'noreply@spiceroute.eu'}>`
        const { data, error } = await resend.emails.send({
          from, to: email, subject: 'Spice Route test email',
          html: '<p>✅ If you can read this, Resend is working.</p>',
        })
        out.email = error ? { ok: false, error: error.message ?? JSON.stringify(error), from } : { ok: true, id: data?.id, from }
      } catch (e: any) {
        out.email = { ok: false, error: e.message ?? String(e) }
      }
    }
  }

  // ── SMS test ──
  if (phone) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_PHONE_NUMBER
    if (!sid || !token || !from) {
      out.sms = { ok: false, error: 'Twilio env vars incomplete (need SID, AUTH_TOKEN, PHONE_NUMBER)' }
    } else if (!phone.startsWith('+')) {
      out.sms = { ok: false, error: 'Phone must be in +country format (E.164)' }
    } else {
      try {
        const msg = await twilio(sid, token).messages.create({ from, to: phone, body: 'Spice Route test SMS ✅' })
        out.sms = { ok: true, sid: msg.sid }
      } catch (e: any) {
        out.sms = { ok: false, error: e.message ?? String(e) }
      }
    }
  }

  return NextResponse.json(out)
}
