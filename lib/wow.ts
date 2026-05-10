type GoalBurstDetail = {
  title?: string
  subtitle?: string
}

export function triggerGoalBurst(detail: GoalBurstDetail = {}) {
  if (typeof window === 'undefined') return

  const telegram = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred?: (type: string) => void } } } }).Telegram
  telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success')

  window.dispatchEvent(
    new CustomEvent<GoalBurstDetail>('formachi:goal', {
      detail: {
        title: detail.title || 'GOOOL!',
        subtitle: detail.subtitle || "Mahsulot savatga qo'shildi",
      },
    })
  )
}
