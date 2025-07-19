import { TIMER_CONSTANTS } from './constants'

export const minutesSecondsToMs = (minutes: number, seconds: number): number =>
  (minutes * 60 + seconds) * 1000

export const createAudioBeep = (
  frequency: number,
  duration: number,
  volume: number
): void => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    )

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  } catch (error) {
    console.log('Audio not supported:', error)
  }
}

export const playTimerAlert = (): void => {
  // Triple beep for T-Timer
  createAudioBeep(
    TIMER_CONSTANTS.ALERT_FREQUENCY,
    TIMER_CONSTANTS.ALERT_DURATION,
    TIMER_CONSTANTS.ALERT_VOLUME
  )
  setTimeout(
    () =>
      createAudioBeep(
        TIMER_CONSTANTS.ALERT_FREQUENCY,
        TIMER_CONSTANTS.ALERT_DURATION,
        TIMER_CONSTANTS.ALERT_VOLUME
      ),
    300
  )
  setTimeout(
    () =>
      createAudioBeep(
        TIMER_CONSTANTS.ALERT_FREQUENCY,
        TIMER_CONSTANTS.ALERT_DURATION,
        TIMER_CONSTANTS.ALERT_VOLUME
      ),
    600
  )
}

export const formatTimeDisplay = (minutes: number, seconds: number): string => {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const formatCountdownTime = (milliseconds: number): string => {
  // Clamp negative values to 0 to prevent negative time display
  const clampedMs = Math.max(0, milliseconds)
  const totalSeconds = Math.floor(clampedMs / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}