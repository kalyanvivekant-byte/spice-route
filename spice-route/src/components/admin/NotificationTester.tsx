'use client'

import { useState } from 'react'

export function NotificationTester() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function run() {
    setBusy(true); setResult(null)
    const res = await fetch('/api/admin/test-notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || undefined, phone: phone || undefined }),
    })
    setResult(await res.json())
    setBusy(false)
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="test email address"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-saffron-500" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31612345678 (optional)"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-saffron-500" />
      </div>
      <button onClick={run} disabled={busy || (!email && !phone)}
        className="bg-saffron-500 hover:bg-saffron-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
        {busy ? 'Sending…' : 'Send test'}
      </button>

      {result && (
        <div className="space-y-2 text-sm">
          {result.email && (
            <div className={`rounded-lg px-3 py-2 ${result.email.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
              <strong>Email:</strong> {result.email.ok ? `sent (id ${result.email.id})` : result.email.error}
              {result.email.from && <div className="text-xs opacity-70 mt-0.5">from {result.email.from}</div>}
            </div>
          )}
          {result.sms && (
            <div className={`rounded-lg px-3 py-2 ${result.sms.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
              <strong>SMS:</strong> {result.sms.ok ? `sent (sid ${result.sms.sid})` : result.sms.error}
            </div>
          )}
          {result.config && (
            <pre className="text-xs text-gray-400 bg-gray-800 rounded-lg p-3 overflow-x-auto">{JSON.stringify(result.config, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  )
}
