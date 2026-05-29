'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

const DISMISS_KEY = 'sr-install-dismissed'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [show, setShow] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already installed → never show.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (standalone) return

    if (localStorage.getItem(DISMISS_KEY) === '1') return

    const ua = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua) // Safari only
    setIsIOS(ios)

    // iOS has no beforeinstallprompt — show the manual hint.
    if (ios) { setShow(true); return }

    const onBIP = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BIPEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBIP)

    const onInstalled = () => { setShow(false); localStorage.setItem(DISMISS_KEY, '1') }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    setShow(false)
    setShowIOSHelp(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  async function install() {
    if (isIOS) { setShowIOSHelp(true); return }
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 inset-x-4 z-40 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-white border border-saffron-200 shadow-lg rounded-2xl p-4 relative">
        <button onClick={dismiss} aria-label="Dismiss" className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-spice flex items-center justify-center text-white text-lg">🌶️</div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Install Spice Route</p>
            <p className="text-xs text-gray-500 mt-0.5">Add our app to your home screen for faster shopping.</p>
          </div>
        </div>

        {showIOSHelp ? (
          <p className="mt-3 text-xs text-gray-600 leading-relaxed">
            Tap the <Share className="inline h-3.5 w-3.5 -mt-0.5" /> <span className="font-medium">Share</span> button in Safari,
            then choose <span className="font-medium">“Add to Home Screen”</span>.
          </p>
        ) : (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={install}
              className="flex items-center gap-1.5 text-sm bg-gradient-spice text-white px-3.5 py-2 rounded-lg hover:opacity-90 transition"
            >
              <Download className="h-4 w-4" /> {isIOS ? 'How to install' : 'Install app'}
            </button>
            <button onClick={dismiss} className="text-sm text-gray-400 hover:text-gray-700">Not now</button>
          </div>
        )}
      </div>
    </div>
  )
}
