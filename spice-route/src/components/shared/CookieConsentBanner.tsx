'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type ConsentState = {
  necessary: true
  analytics: boolean
  marketing: boolean
}

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent')
    if (!stored) setShow(true)
  }, [])

  function saveConsent(c: ConsentState) {
    localStorage.setItem('cookie-consent', JSON.stringify(c))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShow(false)
    // Fire consent events for analytics tools
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('consent', 'update', {
        analytics_storage: c.analytics ? 'granted' : 'denied',
        ad_storage: c.marketing ? 'granted' : 'denied',
      })
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t shadow-lg p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <p className="font-semibold text-sm">🍪 We use cookies</p>
            <p className="text-xs text-muted-foreground mt-1">
              We use necessary cookies to make our site work. We'd also like to set optional analytics and
              marketing cookies to help us improve it. These won't be set unless you enable them.
              See our{' '}
              <a href="/cookies" className="underline">Cookie Policy</a>.
            </p>

            {expanded && (
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked disabled className="opacity-50" />
                  <span><strong>Necessary</strong> – Required for the site to function</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  />
                  <span><strong>Analytics</strong> – Help us understand how visitors use our site</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  />
                  <span><strong>Marketing</strong> – Used to show relevant ads and campaigns</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide' : 'Manage preferences'}
            </Button>
            {expanded ? (
              <Button size="sm" onClick={() => saveConsent(consent)}>
                Save preferences
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveConsent({ necessary: true, analytics: false, marketing: false })}
                >
                  Reject all
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveConsent({ necessary: true, analytics: true, marketing: true })}
                >
                  Accept all
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
