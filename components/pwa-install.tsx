'use client'

import { useEffect } from 'react'

export function PWAInstall() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope)
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error)
        })
    }

    // Handle beforeinstallprompt event (Chrome/Edge)
    let deferredPrompt: any
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      console.log('[PWA] Install prompt available')
      
      // You can show a custom install button here
      // For now, we'll just let the browser handle it
    })

    // Log when app is installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully')
      deferredPrompt = null
    })
  }, [])

  return null // This component doesn't render anything
}
