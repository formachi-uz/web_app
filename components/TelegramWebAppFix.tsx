'use client'

import { useEffect } from 'react'

type TelegramWebApp = {
  initData?: string
  initDataUnsafe?: {
    user?: {
      id?: number
      first_name?: string
      last_name?: string
      username?: string
    }
  }
  ready?: () => void
  expand?: () => void
  disableVerticalSwipes?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
}

type TelegramProfile = {
  registered: boolean
  telegram_id?: number
  full_name?: string
  username?: string
  phone?: string
}

const PROFILE_KEY = 'formachi:telegram-profile'

function setReactInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  if (!value || element.value.trim()) return
  const prototype = Object.getPrototypeOf(element)
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
  descriptor?.set?.call(element, value)
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

function autofillCheckout(profile: TelegramProfile) {
  if (!window.location.pathname.startsWith('/checkout')) return

  const fill = () => {
    const nameInput = document.querySelector<HTMLInputElement>('input[placeholder*="Musurmon"], input[placeholder*="ism"]')
    const phoneInput = document.querySelector<HTMLInputElement>('input[type="tel"]')

    if (profile.full_name && nameInput) setReactInputValue(nameInput, profile.full_name)
    if (profile.phone && phoneInput) setReactInputValue(phoneInput, profile.phone)
  }

  fill()
  window.setTimeout(fill, 120)
  window.setTimeout(fill, 600)
}

export default function TelegramWebAppFix() {
  useEffect(() => {
    const win = window as Window & { Telegram?: { WebApp?: TelegramWebApp } }
    const webApp = win.Telegram?.WebApp

    webApp?.ready?.()
    webApp?.expand?.()
    webApp?.disableVerticalSwipes?.()
    webApp?.setHeaderColor?.('#02050b')
    webApp?.setBackgroundColor?.('#02050b')

    const lockViewport = () => {
      const width = `${window.innerWidth}px`
      document.documentElement.style.width = width
      document.documentElement.style.maxWidth = width
      document.documentElement.style.overflowX = 'hidden'
      document.body.style.width = width
      document.body.style.maxWidth = width
      document.body.style.overflowX = 'hidden'
      document.documentElement.scrollLeft = 0
      document.body.scrollLeft = 0
    }

    lockViewport()
    window.setTimeout(lockViewport, 80)
    window.setTimeout(lockViewport, 450)
    window.addEventListener('resize', lockViewport)
    window.addEventListener('orientationchange', lockViewport)

    const fallbackUser = webApp?.initDataUnsafe?.user
    if (fallbackUser?.id) {
      const fallbackProfile: TelegramProfile = {
        registered: false,
        telegram_id: fallbackUser.id,
        full_name: [fallbackUser.first_name, fallbackUser.last_name].filter(Boolean).join(' ').trim(),
        username: fallbackUser.username || '',
        phone: '',
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(fallbackProfile))
      autofillCheckout(fallbackProfile)
    }

    if (webApp?.initData) {
      fetch('/api/telegram/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: webApp.initData }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile: TelegramProfile | null) => {
          if (!profile?.telegram_id) return
          localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
          autofillCheckout(profile)
        })
        .catch(() => undefined)
    } else {
      try {
        const cached = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as TelegramProfile | null
        if (cached) autofillCheckout(cached)
      } catch {
        // ignore corrupted local storage
      }
    }

    return () => {
      window.removeEventListener('resize', lockViewport)
      window.removeEventListener('orientationchange', lockViewport)
      document.documentElement.style.width = ''
      document.documentElement.style.maxWidth = ''
      document.documentElement.style.overflowX = ''
      document.body.style.width = ''
      document.body.style.maxWidth = ''
      document.body.style.overflowX = ''
    }
  }, [])

  return null
}
