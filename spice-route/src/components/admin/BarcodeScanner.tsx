'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { X, Camera } from 'lucide-react'

interface Props {
  onDetected: (barcode: string) => void
  onClose: () => void
}

/**
 * Full-screen camera barcode scanner. Uses ZXing to decode EAN/UPC/Code128 etc.
 * Works on desktop Chrome/Firefox/Edge and mobile Safari/Chrome (requires HTTPS + camera permission).
 */
export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    let cancelled = false

    async function start() {
      try {
        // Prefer the rear camera on phones.
        const devices = await reader.listVideoInputDevices()
        const rear =
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ??
          devices[devices.length - 1]?.deviceId ??
          undefined

        await reader.decodeFromVideoDevice(rear ?? null, videoRef.current!, (result, err) => {
          if (cancelled) return
          if (result) {
            const text = result.getText()?.trim()
            if (text) {
              stop()
              onDetected(text)
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            // NotFoundException just means "no barcode in this frame" — ignore.
          }
        })
        if (!cancelled) setReady(true)
      } catch (e: any) {
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access and try again.'
            : 'Could not start the camera. Make sure the site has camera permission and is on HTTPS.'
        )
      }
    }

    function stop() {
      try { reader.reset() } catch {}
    }

    start()
    return () => { cancelled = true; stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition"
        aria-label="Close scanner"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="text-white/90 text-sm mb-4 flex items-center gap-2">
        <Camera className="h-4 w-4" /> Point the camera at a product barcode
      </div>

      <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-black ring-1 ring-white/20">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        {/* Aiming guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-1/3 border-2 border-saffron-400/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
        </div>
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">Starting camera…</div>
        )}
      </div>

      {error && (
        <p className="mt-4 max-w-md text-center text-sm text-red-300">{error}</p>
      )}

      <button
        onClick={onClose}
        className="mt-6 text-sm text-white/70 hover:text-white underline"
      >
        Cancel
      </button>
    </div>
  )
}
