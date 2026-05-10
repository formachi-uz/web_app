import type { CSSProperties } from 'react'

type Theme = {
  accent: string
  accent2: string
  rgb: string
}

const themes: Record<string, Theme> = {
  'real madrid': { accent: '#f5f1df', accent2: '#d7b66a', rgb: '215,182,106' },
  barcelona: { accent: '#e63b55', accent2: '#2f67ff', rgb: '230,59,85' },
  'atletico madrid': { accent: '#ff3d4d', accent2: '#f7fbff', rgb: '255,61,77' },
  sevilla: { accent: '#ff3d4d', accent2: '#f7fbff', rgb: '255,61,77' },
  valencia: { accent: '#ff9f2d', accent2: '#f7fbff', rgb: '255,159,45' },
  'manchester city': { accent: '#6fcfff', accent2: '#ffffff', rgb: '111,207,255' },
  'manchester united': { accent: '#ff3d4d', accent2: '#d7b66a', rgb: '255,61,77' },
  chelsea: { accent: '#2d66ff', accent2: '#ffffff', rgb: '45,102,255' },
  liverpool: { accent: '#ff3d4d', accent2: '#39ff88', rgb: '255,61,77' },
  arsenal: { accent: '#ff3347', accent2: '#f7fbff', rgb: '255,51,71' },
  tottenham: { accent: '#f7fbff', accent2: '#2d66ff', rgb: '247,251,255' },
  newcastle: { accent: '#f7fbff', accent2: '#111111', rgb: '247,251,255' },
  juventus: { accent: '#f7fbff', accent2: '#111111', rgb: '247,251,255' },
  inter: { accent: '#2d66ff', accent2: '#111111', rgb: '45,102,255' },
  'ac milan': { accent: '#ff3d4d', accent2: '#111111', rgb: '255,61,77' },
  napoli: { accent: '#40b6ff', accent2: '#f7fbff', rgb: '64,182,255' },
  roma: { accent: '#c8782a', accent2: '#ff3d4d', rgb: '200,120,42' },
  'bayern munich': { accent: '#ff3a4b', accent2: '#38a6ff', rgb: '255,58,75' },
  'borussia dortmund': { accent: '#ffe45c', accent2: '#111111', rgb: '255,228,92' },
  'bayer leverkusen': { accent: '#ff3d4d', accent2: '#111111', rgb: '255,61,77' },
  'rb leipzig': { accent: '#ff3d4d', accent2: '#f7fbff', rgb: '255,61,77' },
  'eintracht frankfurt': { accent: '#ff3d4d', accent2: '#111111', rgb: '255,61,77' },
  psg: { accent: '#2b6cff', accent2: '#ff3457', rgb: '43,108,255' },
  marseille: { accent: '#40b6ff', accent2: '#f7fbff', rgb: '64,182,255' },
  monaco: { accent: '#ff3d4d', accent2: '#f7fbff', rgb: '255,61,77' },
  lyon: { accent: '#2d66ff', accent2: '#ff3d4d', rgb: '45,102,255' },
  argentina: { accent: '#7dd7ff', accent2: '#ffffff', rgb: '125,215,255' },
  brazil: { accent: '#ffe45c', accent2: '#22d66f', rgb: '255,228,92' },
  uzbekistan: { accent: '#33d6ff', accent2: '#39ff88', rgb: '51,214,255' },
  portugal: { accent: '#ff3d4d', accent2: '#22d66f', rgb: '255,61,77' },
  france: { accent: '#2d66ff', accent2: '#ff3d4d', rgb: '45,102,255' },
  england: { accent: '#f7fbff', accent2: '#ff3d4d', rgb: '247,251,255' },
  germany: { accent: '#f7fbff', accent2: '#d7b66a', rgb: '247,251,255' },
  spain: { accent: '#ff3d4d', accent2: '#ffe45c', rgb: '255,61,77' },
  italy: { accent: '#2d66ff', accent2: '#22d66f', rgb: '45,102,255' },
  netherlands: { accent: '#ff8a2d', accent2: '#f7fbff', rgb: '255,138,45' },
  nike: { accent: '#f7fbff', accent2: '#39ff88', rgb: '247,251,255' },
  adidas: { accent: '#d7b66a', accent2: '#f7fbff', rgb: '215,182,106' },
  puma: { accent: '#39ff88', accent2: '#f7fbff', rgb: '57,255,136' },
  mizuno: { accent: '#40b6ff', accent2: '#f7fbff', rgb: '64,182,255' },
  'new balance': { accent: '#ff3d4d', accent2: '#f7fbff', rgb: '255,61,77' },
}

export function getTeamThemeStyle(value?: string | null): CSSProperties {
  const key = String(value || '').trim().toLowerCase()
  const theme = themes[key] || { accent: '#39ff88', accent2: '#d7b66a', rgb: '57,255,136' }

  return {
    '--team-accent': theme.accent,
    '--team-accent-2': theme.accent2,
    '--team-rgb': theme.rgb,
  } as CSSProperties
}
