'use client'

import { useEffect } from 'react'

type TelegramWebApp = {
  ready?: () => void
  expand?: () => void
  disableVerticalSwipes?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
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
      window.scrollTo(0, window.scrollY)
      document.documentElement.scrollLeft = 0
      document.body.scrollLeft = 0
    }

    lockViewport()
    window.setTimeout(lockViewport, 80)
    window.setTimeout(lockViewport, 450)
    window.addEventListener('resize', lockViewport)
    window.addEventListener('orientationchange', lockViewport)

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
