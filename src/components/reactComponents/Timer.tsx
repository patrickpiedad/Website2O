import { useEffect, useRef, useState } from 'react'

// Constants
const TIMER_CONSTANTS = {
  UPDATE_INTERVAL: 100, // milliseconds
  ALARM_DURATION: 30000, // 30 seconds
  BEEP_INTERVAL: 1000, // 1 second
  ALARM_FREQUENCY: 800, // Hz
  ALERT_FREQUENCY: 1000, // Hz
  BEEP_DURATION: 0.5, // seconds
  ALERT_DURATION: 0.3, // seconds
  VOLUME: 0.3,
  ALERT_VOLUME: 0.4
} as const

const CSS_CLASSES = {
  INPUT_BASE:
    'w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
  INPUT_FULL:
    'w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
  BUTTON_PRIMARY:
    'rounded-lg px-6 py-3 font-semibold shadow-lg transition-colors',
  BUTTON_SMALL: 'rounded px-3 py-1 text-sm transition-colors',
  BUTTON_SECONDARY:
    'rounded-lg border border-gray-600 bg-gray-700 px-6 py-3 font-semibold text-gray-100 shadow-lg transition-colors hover:bg-gray-600',
  CONTAINER:
    'mx-auto max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-2xl',
  SETTINGS_PANEL: 'mb-4 rounded-lg border border-gray-600 bg-gray-800 p-4',
  FLEX_CENTER: 'flex items-center justify-center gap-2',
  FLEX_COL_CENTER: 'flex flex-col items-center'
} as const

// Utility Functions
const minutesSecondsToMs = (minutes: number, seconds: number): number =>
  (minutes * 60 + seconds) * 1000

const createAudioBeep = (
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

const playTimerAlert = (type: 'single' | 'triple'): void => {
  if (type === 'single') {
    createAudioBeep(
      TIMER_CONSTANTS.ALARM_FREQUENCY,
      TIMER_CONSTANTS.BEEP_DURATION,
      TIMER_CONSTANTS.VOLUME
    )
  } else {
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
}

type TimerMode = 'timer' | 'stopwatch' | 'pomodoro' | 't-timer'
type PomodoroPhase = 'work' | 'short-break' | 'long-break'
type TTimerPhase = 'work' | 'rest'
type TTimerMode = 'cycles' | 'total-time'

interface PomodoroSettings {
  workTime: number
  workTimeSeconds: number
  shortBreak: number
  shortBreakSeconds: number
  longBreak: number
  longBreakSeconds: number
  sessionsUntilLongBreak: number
}

// Temporary Pomodoro input values (can be empty strings)
interface PomodoroInputs {
  workTime: string
  workTimeSeconds: string
  shortBreak: string
  shortBreakSeconds: string
  longBreak: string
  longBreakSeconds: string
  sessionsUntilLongBreak: string
}

interface TTimerSettings {
  workTime: number // minutes
  workTimeSeconds: number // seconds
  restTime: number // minutes
  restTimeSeconds: number // seconds
  cycles: number
  totalTime: number // minutes
  totalTimeSeconds: number // seconds
  mode: TTimerMode
}

// Temporary input values (can be empty strings)
interface TTimerInputs {
  workTime: string
  workTimeSeconds: string
  restTime: string
  restTimeSeconds: string
  cycles: string
  totalTime: string
  totalTimeSeconds: string
}

export default function Timer() {
  const [time, setTime] = useState<number>(0) // Time in milliseconds
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [mode, setMode] = useState<TimerMode>('t-timer')
  const [inputMinutes, setInputMinutes] = useState<number>(5)
  const [inputSeconds, setInputSeconds] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false)
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Timestamp tracking for accurate timing
  const startTimeRef = useRef<number>(0)
  const initialTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // Pomodoro state
  const [pomodoroSession, setPomodoroSession] = useState<number>(1)
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work')
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workTime: 25, // minutes
    workTimeSeconds: 0, // seconds
    shortBreak: 5, // minutes
    shortBreakSeconds: 0, // seconds
    longBreak: 15, // minutes
    longBreakSeconds: 0, // seconds
    sessionsUntilLongBreak: 4
  })
  const [showPomodoroSettings, setShowPomodoroSettings] =
    useState<boolean>(false)
  const [pomodoroInputs, setPomodoroInputs] = useState<PomodoroInputs>({
    workTime: '25',
    workTimeSeconds: '0',
    shortBreak: '5',
    shortBreakSeconds: '0',
    longBreak: '15',
    longBreakSeconds: '0',
    sessionsUntilLongBreak: '4'
  })

  // T-Timer state
  const [tTimerPhase, setTTimerPhase] = useState<TTimerPhase>('work')
  const [tTimerCurrentCycle, setTTimerCurrentCycle] = useState<number>(1)
  const [tTimerSettings, setTTimerSettings] = useState<TTimerSettings>({
    workTime: 1, // minutes
    workTimeSeconds: 0, // seconds
    restTime: 0, // minutes
    restTimeSeconds: 15, // seconds
    cycles: 20,
    totalTime: 20, // minutes
    totalTimeSeconds: 0, // seconds
    mode: 'cycles'
  })
  const [tTimerInputs, setTTimerInputs] = useState<TTimerInputs>({
    workTime: '1',
    workTimeSeconds: '0',
    restTime: '0',
    restTimeSeconds: '15',
    cycles: '20',
    totalTime: '20',
    totalTimeSeconds: '0'
  })
  const [tTimerStartTime, setTTimerStartTime] = useState<number>(0)
  const [tTimerTotalElapsed, setTTimerTotalElapsed] = useState<number>(0)
  const [showTTimerSettings, setShowTTimerSettings] = useState<boolean>(false)

  // Initialize timer with proper default values
  useEffect(() => {
    if (mode === 'timer') {
      setTime(minutesSecondsToMs(inputMinutes, inputSeconds))
    } else if (mode === 'pomodoro') {
      setTime(getPomodoroTime())
    } else if (mode === 't-timer') {
      setTime(getTTimerTime())
    } else {
      setTime(0)
    }
  }, [])

  // Format time as MM:SS:MS
  const formatTime = (milliseconds: number): string => {
    // Clamp negative values to 0 to prevent negative time display
    const clampedMs = Math.max(0, milliseconds)
    const totalSeconds = Math.floor(clampedMs / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const ms = Math.floor((clampedMs % 1000) / 10) // Show centiseconds (00-99)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`
  }

  // Format time for display (MM:SS format)
  const formatTimeDisplay = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Format time for countdown timers (MM:SS format without centiseconds)
  const formatCountdownTime = (milliseconds: number): string => {
    // Clamp negative values to 0 to prevent negative time display
    const clampedMs = Math.max(0, milliseconds)
    const totalSeconds = Math.floor(clampedMs / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Stop alarm
  const stopAlarm = (): void => {
    setIsAlarmPlaying(false)
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current)
      alarmIntervalRef.current = null
    }
  }

  // Play alarm sound when timer finishes
  const playAlarm = (): void => {
    setIsAlarmPlaying(true)

    // Play initial beep
    playTimerAlert('single')

    // Continue playing beeps every 1 seconds for 30 seconds
    alarmIntervalRef.current = setInterval(
      () => playTimerAlert('single'),
      TIMER_CONSTANTS.BEEP_INTERVAL
    )

    // Stop alarm after 30 seconds
    setTimeout(() => {
      stopAlarm()
    }, TIMER_CONSTANTS.ALARM_DURATION)
  }

  // Get pomodoro time based on current phase
  const getPomodoroTime = (): number => {
    switch (pomodoroPhase) {
      case 'work':
        return (
          (pomodoroSettings.workTime * 60 + pomodoroSettings.workTimeSeconds) *
          1000
        )
      case 'short-break':
        return (
          (pomodoroSettings.shortBreak * 60 +
            pomodoroSettings.shortBreakSeconds) *
          1000
        )
      case 'long-break':
        return (
          (pomodoroSettings.longBreak * 60 +
            pomodoroSettings.longBreakSeconds) *
          1000
        )
      default:
        return (
          (pomodoroSettings.workTime * 60 + pomodoroSettings.workTimeSeconds) *
          1000
        )
    }
  }

  // Get T-Timer time based on current phase
  const getTTimerTime = (): number => {
    switch (tTimerPhase) {
      case 'work':
        return minutesSecondsToMs(
          tTimerSettings.workTime,
          tTimerSettings.workTimeSeconds
        )
      case 'rest':
        return minutesSecondsToMs(
          tTimerSettings.restTime,
          tTimerSettings.restTimeSeconds
        )
      default:
        return minutesSecondsToMs(
          tTimerSettings.workTime,
          tTimerSettings.workTimeSeconds
        )
    }
  }

  // Handle T-Timer phase completion
  const handleTTimerComplete = (): void => {
    playTimerAlert('triple')

    if (tTimerPhase === 'work') {
      // Work phase completed, start rest
      setTTimerPhase('rest')
      const newTime = minutesSecondsToMs(
        tTimerSettings.restTime,
        tTimerSettings.restTimeSeconds
      )
      setTime(newTime)
      // Reset timestamp tracking for new phase
      setTimeout(() => {
        startTimeRef.current = Date.now()
        initialTimeRef.current = newTime
      }, 0)
    } else {
      // Rest phase completed, check if we should stop before incrementing cycle
      if (
        tTimerSettings.mode === 'cycles' &&
        tTimerCurrentCycle >= tTimerSettings.cycles
      ) {
        setIsRunning(false)
        return
      }

      // Start next work cycle
      const nextCycle = tTimerCurrentCycle + 1
      setTTimerCurrentCycle(nextCycle)
      setTTimerPhase('work')
      const newTime = minutesSecondsToMs(
        tTimerSettings.workTime,
        tTimerSettings.workTimeSeconds
      )
      setTime(newTime)
      // Reset timestamp tracking for new phase
      setTimeout(() => {
        startTimeRef.current = Date.now()
        initialTimeRef.current = newTime
      }, 0)
    }
  }

  // Handle pomodoro phase completion
  const handlePomodoroComplete = (): void => {
    let newPhase: PomodoroPhase
    let newSession = pomodoroSession

    if (pomodoroPhase === 'work') {
      // Work session completed
      if (pomodoroSession % pomodoroSettings.sessionsUntilLongBreak === 0) {
        newPhase = 'long-break'
      } else {
        newPhase = 'short-break'
      }
    } else {
      // Break completed
      newPhase = 'work'
      if (pomodoroPhase === 'short-break' || pomodoroPhase === 'long-break') {
        newSession = pomodoroSession + 1
      }
    }

    setPomodoroPhase(newPhase)
    setPomodoroSession(newSession)

    // Calculate time for the new phase
    const newTime =
      newPhase === 'work'
        ? (pomodoroSettings.workTime * 60 + pomodoroSettings.workTimeSeconds) *
          1000
        : newPhase === 'short-break'
          ? (pomodoroSettings.shortBreak * 60 +
              pomodoroSettings.shortBreakSeconds) *
            1000
          : (pomodoroSettings.longBreak * 60 +
              pomodoroSettings.longBreakSeconds) *
            1000

    setTime(newTime)
    // Reset timestamp tracking for new phase
    startTimeRef.current = Date.now()
    initialTimeRef.current = newTime
  }

  // Start/stop timer
  const toggleTimer = (): void => {
    if (!isRunning) {
      // Starting timer
      if (mode === 't-timer') {
        setTTimerStartTime(Date.now())
        setTTimerTotalElapsed(0)
      }
      startTimeRef.current = Date.now()
      initialTimeRef.current = time
      pausedTimeRef.current = 0
    } else {
      // Pausing timer
      pausedTimeRef.current = time
    }
    setIsRunning(!isRunning)
  }

  // Reset timer
  const resetTimer = (): void => {
    setIsRunning(false)
    stopAlarm() // Stop alarm when resetting

    // Reset timestamp tracking
    startTimeRef.current = 0
    initialTimeRef.current = 0
    pausedTimeRef.current = 0

    if (mode === 'timer') {
      setTime(minutesSecondsToMs(inputMinutes, inputSeconds))
    } else if (mode === 'pomodoro') {
      setTime(getPomodoroTime())
    } else if (mode === 't-timer') {
      setTTimerPhase('work')
      setTTimerCurrentCycle(1)
      setTTimerTotalElapsed(0)
      setTime(getTTimerTime())
    } else {
      setTime(0)
    }
  }

  // Switch between timer modes
  const switchMode = (newMode: TimerMode): void => {
    setMode(newMode)
    setIsRunning(false)
    stopAlarm() // Stop alarm when switching modes

    // Reset timestamp tracking
    startTimeRef.current = 0
    initialTimeRef.current = 0
    pausedTimeRef.current = 0

    if (newMode === 'timer') {
      setTime(minutesSecondsToMs(inputMinutes, inputSeconds))
    } else if (newMode === 'pomodoro') {
      setPomodoroSession(1)
      setPomodoroPhase('work')
      setTime(getPomodoroTime())
    } else if (newMode === 't-timer') {
      setTTimerPhase('work')
      setTTimerCurrentCycle(1)
      setTTimerTotalElapsed(0)
      setTime(getTTimerTime())
    } else {
      setTime(0)
    }
  }

  // Handle timer input changes
  const handleMinutesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const minutes = parseInt(e.target.value) || 0
    setInputMinutes(Math.max(0, Math.min(59, minutes))) // Limit to 0-59
    if (!isRunning) {
      setTime(minutesSecondsToMs(minutes, inputSeconds))
    }
  }

  const handleSecondsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const seconds = parseInt(e.target.value) || 0
    setInputSeconds(Math.max(0, Math.min(59, seconds))) // Limit to 0-59
    if (!isRunning) {
      setTime(minutesSecondsToMs(inputMinutes, seconds))
    }
  }

  // Handle Pomodoro input changes (allow temporary empty values)
  const handlePomodoroInputChange = (
    setting: keyof PomodoroInputs,
    value: string
  ): void => {
    setPomodoroInputs((prev) => ({
      ...prev,
      [setting]: value
    }))
  }

  // Handle Pomodoro input blur (validate and update settings)
  const handlePomodoroInputBlur = (setting: keyof PomodoroInputs): void => {
    const value = pomodoroInputs[setting]
    let numericValue: number

    if (value === '' || isNaN(parseInt(value))) {
      numericValue = setting === 'sessionsUntilLongBreak' ? 1 : 0
    } else {
      numericValue = Math.max(
        setting === 'sessionsUntilLongBreak' ? 1 : 0,
        parseInt(value)
      )
    }

    // Update the input to show the validated value
    setPomodoroInputs((prev) => ({
      ...prev,
      [setting]: numericValue.toString()
    }))

    // Update the actual settings
    setPomodoroSettings((prev) => ({
      ...prev,
      [setting]: numericValue
    }))

    // Update current timer if not running
    if (!isRunning && mode === 'pomodoro') {
      setTime(getPomodoroTime())
    }
  }

  // Handle T-Timer input changes (allow temporary empty values)
  const handleTTimerInputChange = (
    setting: keyof TTimerInputs,
    value: string
  ): void => {
    setTTimerInputs((prev) => ({
      ...prev,
      [setting]: value
    }))
  }

  // Handle T-Timer input blur (validate and update settings)
  const handleTTimerInputBlur = (setting: keyof TTimerInputs): void => {
    const value = tTimerInputs[setting]
    let numericValue: number

    if (value === '' || isNaN(parseInt(value))) {
      numericValue = setting === 'cycles' ? 1 : 0
    } else {
      numericValue = Math.max(setting === 'cycles' ? 1 : 0, parseInt(value))
    }

    // Update the input to show the validated value
    setTTimerInputs((prev) => ({
      ...prev,
      [setting]: numericValue.toString()
    }))

    // Update the actual settings
    setTTimerSettings((prev) => ({
      ...prev,
      [setting]: numericValue
    }))

    // Update current timer if not running
    if (!isRunning && mode === 't-timer') {
      setTime(getTTimerTime())
    }
  }

  // Handle T-Timer mode changes
  const handleTTimerModeChange = (tTimerMode: TTimerMode): void => {
    setTTimerSettings((prev) => ({
      ...prev,
      mode: tTimerMode
    }))

    // Update current timer if not running
    if (!isRunning && mode === 't-timer') {
      setTime(getTTimerTime())
    }
  }

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()

        setTime((prevTime) => {
          if (mode === 'timer' || mode === 'pomodoro' || mode === 't-timer') {
            // Calculate actual elapsed time based on timestamps
            const elapsed = now - startTimeRef.current
            const newTime = initialTimeRef.current - elapsed

            // Update T-Timer total elapsed time
            if (mode === 't-timer') {
              setTTimerTotalElapsed(Date.now() - tTimerStartTime)

              // Check if total time limit reached
              if (tTimerSettings.mode === 'total-time') {
                const totalTimeMs =
                  (tTimerSettings.totalTime * 60 +
                    tTimerSettings.totalTimeSeconds) *
                  1000
                if (Date.now() - tTimerStartTime >= totalTimeMs) {
                  setIsRunning(false)
                  return 0
                }
              }
            }

            if (newTime <= 0) {
              if (mode === 'timer') {
                setIsRunning(false)
                playAlarm() // Play alarm when timer finishes
                return 0
              } else if (mode === 'pomodoro') {
                setIsRunning(false)
                playAlarm() // Play alarm when timer finishes
                setTimeout(() => {
                  handlePomodoroComplete()
                }, 1000)
                return 0
              } else if (mode === 't-timer') {
                // Don't stop running, just handle phase completion
                handleTTimerComplete()
                // The new time will be set by handleTTimerComplete, so return current time for now
                return newTime
              }
            }
            return newTime
          } else {
            // Stopwatch mode - calculate elapsed time from start
            const elapsed = now - startTimeRef.current
            return elapsed
          }
        })
      }, 100) // Update every 100ms
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [
    isRunning,
    mode,
    pomodoroPhase,
    pomodoroSettings,
    tTimerPhase,
    tTimerSettings,
    tTimerStartTime
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-2xl">
      <h1 className="text-center">Timer</h1>
      <div className="mb-6 text-center">
        {/* Mode Switch */}
        <div className="mb-4 flex justify-center">
          <div
            role="tablist"
            aria-label="Timer mode selection"
            className="flex rounded-lg border border-gray-600 bg-gray-800 p-1"
          >
            <button
              role="tab"
              aria-selected={mode === 'timer'}
              aria-controls="timer-content"
              onClick={() => switchMode('timer')}
              className={`rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                mode === 'timer'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              Timer
            </button>
            <button
              role="tab"
              aria-selected={mode === 'stopwatch'}
              aria-controls="timer-content"
              onClick={() => switchMode('stopwatch')}
              className={`rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                mode === 'stopwatch'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              Stopwatch
            </button>
            <button
              role="tab"
              aria-selected={mode === 'pomodoro'}
              aria-controls="timer-content"
              onClick={() => switchMode('pomodoro')}
              className={`rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                mode === 'pomodoro'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              Pomodoro
            </button>
            <button
              role="tab"
              aria-selected={mode === 't-timer'}
              aria-controls="timer-content"
              onClick={() => switchMode('t-timer')}
              className={`rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                mode === 't-timer'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              T-Timer
            </button>
          </div>
        </div>
        {/* Timer Content */}
        <div
          id="timer-content"
          role="tabpanel"
          aria-labelledby={`${mode}-tab`}
          className="timer-content"
        >
          {/* T-Timer Settings */}
          {mode === 't-timer' && (
            <div className="mb-4">
              <button
                onClick={() => setShowTTimerSettings(!showTTimerSettings)}
                aria-expanded={showTTimerSettings}
                aria-controls="ttimer-settings"
                className="mb-2 text-sm text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {showTTimerSettings ? 'Hide' : 'Show'} Settings
              </button>

              {showTTimerSettings && (
                <div
                  id="ttimer-settings"
                  className="mb-4 rounded-lg border border-gray-600 bg-gray-800 p-4"
                >
                  <div className="mb-4">
                    <label className="mb-2 block text-sm text-gray-300">
                      Timer Mode
                    </label>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleTTimerModeChange('cycles')}
                        className={`rounded px-3 py-1 text-sm transition-colors ${
                          tTimerSettings.mode === 'cycles'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Cycles
                      </button>
                      <button
                        onClick={() => handleTTimerModeChange('total-time')}
                        className={`rounded px-3 py-1 text-sm transition-colors ${
                          tTimerSettings.mode === 'total-time'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Total Time
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <label className="mb-2 block text-gray-300">
                        Work Time
                      </label>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={tTimerInputs.workTime}
                            onChange={(e) =>
                              handleTTimerInputChange(
                                'workTime',
                                e.target.value
                              )
                            }
                            onBlur={() => handleTTimerInputBlur('workTime')}
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            min
                          </span>
                        </div>
                        <span className="text-gray-400">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={tTimerInputs.workTimeSeconds}
                            onChange={(e) =>
                              handleTTimerInputChange(
                                'workTimeSeconds',
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleTTimerInputBlur('workTimeSeconds')
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            sec
                          </span>
                        </div>
                        <span className="ml-2 text-gray-400">
                          ={' '}
                          {formatTimeDisplay(
                            tTimerSettings.workTime,
                            tTimerSettings.workTimeSeconds
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-gray-300">
                        Rest Time
                      </label>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={tTimerInputs.restTime}
                            onChange={(e) =>
                              handleTTimerInputChange(
                                'restTime',
                                e.target.value
                              )
                            }
                            onBlur={() => handleTTimerInputBlur('restTime')}
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            min
                          </span>
                        </div>
                        <span className="text-gray-400">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={tTimerInputs.restTimeSeconds}
                            onChange={(e) =>
                              handleTTimerInputChange(
                                'restTimeSeconds',
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleTTimerInputBlur('restTimeSeconds')
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            sec
                          </span>
                        </div>
                        <span className="ml-2 text-gray-400">
                          ={' '}
                          {formatTimeDisplay(
                            tTimerSettings.restTime,
                            tTimerSettings.restTimeSeconds
                          )}
                        </span>
                      </div>
                    </div>

                    {tTimerSettings.mode === 'cycles' && (
                      <div>
                        <label className="mb-1 block text-center text-gray-300">
                          Number of Cycles
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={tTimerInputs.cycles}
                          onChange={(e) =>
                            handleTTimerInputChange('cycles', e.target.value)
                          }
                          onBlur={() => handleTTimerInputBlur('cycles')}
                          onFocus={(e) => e.target.select()}
                          className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {tTimerSettings.mode === 'total-time' && (
                      <div>
                        <label className="mb-2 block text-gray-300">
                          Total Time
                        </label>
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="480"
                              value={tTimerInputs.totalTime}
                              onChange={(e) =>
                                handleTTimerInputChange(
                                  'totalTime',
                                  e.target.value
                                )
                              }
                              onBlur={() => handleTTimerInputBlur('totalTime')}
                              onFocus={(e) => e.target.select()}
                              className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="mt-1 text-xs text-gray-400">
                              min
                            </span>
                          </div>
                          <span className="text-gray-400">:</span>
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={tTimerInputs.totalTimeSeconds}
                              onChange={(e) =>
                                handleTTimerInputChange(
                                  'totalTimeSeconds',
                                  e.target.value
                                )
                              }
                              onBlur={() =>
                                handleTTimerInputBlur('totalTimeSeconds')
                              }
                              onFocus={(e) => e.target.select()}
                              className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="mt-1 text-xs text-gray-400">
                              sec
                            </span>
                          </div>
                          <span className="ml-2 text-gray-400">
                            ={' '}
                            {formatTimeDisplay(
                              tTimerSettings.totalTime,
                              tTimerSettings.totalTimeSeconds
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pomodoro Settings */}
          {mode === 'pomodoro' && (
            <div className="mb-4">
              <button
                onClick={() => setShowPomodoroSettings(!showPomodoroSettings)}
                className="mb-2 text-sm text-blue-400 hover:text-blue-300"
              >
                {showPomodoroSettings ? 'Hide' : 'Show'} Settings
              </button>

              {showPomodoroSettings && (
                <div className="mb-4 rounded-lg border border-gray-600 bg-gray-800 p-4">
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <label className="mb-2 block text-center text-gray-300">
                        Work Time
                      </label>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={pomodoroInputs.workTime}
                            onChange={(e) =>
                              handlePomodoroInputChange(
                                'workTime',
                                e.target.value
                              )
                            }
                            onBlur={() => handlePomodoroInputBlur('workTime')}
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            min
                          </span>
                        </div>
                        <span className="text-gray-400">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={pomodoroInputs.workTimeSeconds}
                            onChange={(e) =>
                              handlePomodoroInputChange(
                                'workTimeSeconds',
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handlePomodoroInputBlur('workTimeSeconds')
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            sec
                          </span>
                        </div>
                        <span className="ml-2 text-gray-400">
                          ={' '}
                          {formatTimeDisplay(
                            pomodoroSettings.workTime,
                            pomodoroSettings.workTimeSeconds
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-center text-gray-300">
                        Short Break
                      </label>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={pomodoroInputs.shortBreak}
                            onChange={(e) =>
                              handlePomodoroInputChange(
                                'shortBreak',
                                e.target.value
                              )
                            }
                            onBlur={() => handlePomodoroInputBlur('shortBreak')}
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            min
                          </span>
                        </div>
                        <span className="text-gray-400">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={pomodoroInputs.shortBreakSeconds}
                            onChange={(e) =>
                              handlePomodoroInputChange(
                                'shortBreakSeconds',
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handlePomodoroInputBlur('shortBreakSeconds')
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            sec
                          </span>
                        </div>
                        <span className="ml-2 text-gray-400">
                          ={' '}
                          {formatTimeDisplay(
                            pomodoroSettings.shortBreak,
                            pomodoroSettings.shortBreakSeconds
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-center text-gray-300">
                        Long Break
                      </label>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={pomodoroInputs.longBreak}
                            onChange={(e) =>
                              handlePomodoroInputChange(
                                'longBreak',
                                e.target.value
                              )
                            }
                            onBlur={() => handlePomodoroInputBlur('longBreak')}
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            min
                          </span>
                        </div>
                        <span className="text-gray-400">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={pomodoroInputs.longBreakSeconds}
                            onChange={(e) =>
                              handlePomodoroInputChange(
                                'longBreakSeconds',
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handlePomodoroInputBlur('longBreakSeconds')
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="mt-1 text-xs text-gray-400">
                            sec
                          </span>
                        </div>
                        <span className="ml-2 text-gray-400">
                          ={' '}
                          {formatTimeDisplay(
                            pomodoroSettings.longBreak,
                            pomodoroSettings.longBreakSeconds
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-center text-gray-300">
                        Sessions Until Long Break
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={pomodoroInputs.sessionsUntilLongBreak}
                        onChange={(e) =>
                          handlePomodoroInputChange(
                            'sessionsUntilLongBreak',
                            e.target.value
                          )
                        }
                        onBlur={() =>
                          handlePomodoroInputBlur('sessionsUntilLongBreak')
                        }
                        onFocus={(e) => e.target.select()}
                        className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* T-Timer Status */}
          {mode === 't-timer' && (
            <div className="mb-4 rounded-lg border border-gray-600 bg-gray-800 p-3">
              <div className="mb-2 text-sm text-gray-300">
                {tTimerSettings.mode === 'cycles'
                  ? `Cycle ${tTimerCurrentCycle}/${tTimerSettings.cycles}`
                  : `Total: ${Math.floor(tTimerTotalElapsed / 60000)}:${Math.floor(
                      (tTimerTotalElapsed % 60000) / 1000
                    )
                      .toString()
                      .padStart(
                        2,
                        '0'
                      )}/${formatTimeDisplay(tTimerSettings.totalTime, tTimerSettings.totalTimeSeconds)}`}{' '}
                • {tTimerPhase === 'work' ? 'Work Time' : 'Rest Time'}
              </div>
              <div className="mb-2 flex justify-center">
                <div className="flex max-w-full flex-wrap justify-center gap-1">
                  {tTimerSettings.mode === 'cycles' &&
                    tTimerSettings.cycles <= 10 &&
                    [...Array(tTimerSettings.cycles)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-full ${
                          i < tTimerCurrentCycle - 1
                            ? 'bg-green-500'
                            : i === tTimerCurrentCycle - 1
                              ? tTimerPhase === 'work'
                                ? 'bg-blue-500'
                                : 'bg-orange-500'
                              : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  {tTimerSettings.mode === 'cycles' &&
                    tTimerSettings.cycles > 10 && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-2 w-32 rounded-full bg-gray-600">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (tTimerCurrentCycle / tTimerSettings.cycles) * 100)}%`
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-400">
                          Cycle {tTimerCurrentCycle} of {tTimerSettings.cycles}
                        </div>
                      </div>
                    )}
                  {tTimerSettings.mode === 'total-time' && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-2 w-32 rounded-full bg-gray-600">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (tTimerTotalElapsed / minutesSecondsToMs(tTimerSettings.totalTime, tTimerSettings.totalTimeSeconds)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`text-xs font-medium ${
                  tTimerPhase === 'work' ? 'text-blue-400' : 'text-orange-400'
                }`}
              >
                {tTimerPhase === 'work' ? 'Focus Time!' : 'Rest Time!'}
              </div>
            </div>
          )}

          {/* Pomodoro Status */}
          {mode === 'pomodoro' && (
            <div className="mb-4 rounded-lg border border-gray-600 bg-gray-800 p-3">
              <div className="mb-2 text-sm text-gray-300">
                Session {pomodoroSession} •{' '}
                {pomodoroPhase === 'work'
                  ? 'Work Time'
                  : pomodoroPhase === 'short-break'
                    ? 'Short Break'
                    : 'Long Break'}
              </div>
              <div className="mb-2 flex justify-center gap-2">
                {[...Array(pomodoroSettings.sessionsUntilLongBreak)].map(
                  (_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full ${
                        i <
                        (pomodoroSession - 1) %
                          pomodoroSettings.sessionsUntilLongBreak
                          ? 'bg-green-500'
                          : i ===
                                (pomodoroSession - 1) %
                                  pomodoroSettings.sessionsUntilLongBreak &&
                              pomodoroPhase === 'work'
                            ? 'bg-blue-500'
                            : 'bg-gray-600'
                      }`}
                    />
                  )
                )}
              </div>
              <div
                className={`text-xs font-medium ${
                  pomodoroPhase === 'work' ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {pomodoroPhase === 'work' ? 'Focus Time!' : 'Break Time!'}
              </div>
            </div>
          )}

          {/* Timer Input (only show in timer mode) */}
          {mode === 'timer' && !isRunning && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Set Timer:
              </label>
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={inputMinutes}
                    onChange={handleMinutesChange}
                    aria-label="Timer minutes"
                    aria-describedby="minutes-help"
                    className="w-16 rounded-md border border-gray-600 bg-gray-800 px-2 py-2 text-center text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00"
                  />
                  <span
                    id="minutes-help"
                    className="mt-1 text-xs text-gray-400"
                  >
                    min
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-400">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={inputSeconds}
                    onChange={handleSecondsChange}
                    aria-label="Timer seconds"
                    aria-describedby="seconds-help"
                    className="w-16 rounded-md border border-gray-600 bg-gray-800 px-2 py-2 text-center text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00"
                  />
                  <span
                    id="seconds-help"
                    className="mt-1 text-xs text-gray-400"
                  >
                    sec
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Time Display */}
          <div
            role="timer"
            aria-live="polite"
            aria-label={`Timer display: ${mode === 'stopwatch' ? formatTime(time) : formatCountdownTime(time)}`}
            className={`mb-6 font-mono text-5xl font-bold ${
              (mode === 'timer' || mode === 'pomodoro' || mode === 't-timer') &&
              time <= 10000 &&
              time > 0
                ? 'text-red-400'
                : isAlarmPlaying
                  ? 'animate-pulse text-red-400'
                  : mode === 'pomodoro' && pomodoroPhase === 'work'
                    ? 'text-red-300'
                    : mode === 'pomodoro'
                      ? 'text-green-300'
                      : mode === 't-timer' && tTimerPhase === 'work'
                        ? 'text-blue-300'
                        : mode === 't-timer'
                          ? 'text-orange-300'
                          : 'text-gray-100'
            }`}
          >
            {mode === 'stopwatch'
              ? formatTime(time)
              : formatCountdownTime(time)}
            <span className="sr-only">
              {isRunning ? 'Timer is running' : 'Timer is stopped'}
              {mode === 'pomodoro' && `, ${pomodoroPhase} phase`}
              {mode === 't-timer' &&
                `, ${tTimerPhase} phase, cycle ${tTimerCurrentCycle} of ${tTimerSettings.cycles}`}
            </span>
          </div>

          {/* Timer finished message */}
          {(mode === 'timer' || mode === 'pomodoro') &&
            time === 0 &&
            isRunning === false && (
              <div className="mb-4 animate-pulse font-bold text-red-400">
                {mode === 'pomodoro'
                  ? pomodoroPhase === 'work'
                    ? 'Work session complete!'
                    : 'Break time over!'
                  : "Time's up!"}
                {isAlarmPlaying && (
                  <button
                    onClick={stopAlarm}
                    className="ml-3 rounded-md bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
                  >
                    Stop Alarm
                  </button>
                )}
              </div>
            )}

          {/* T-Timer finished message */}
          {mode === 't-timer' &&
            !isRunning &&
            ((tTimerSettings.mode === 'cycles' &&
              tTimerCurrentCycle > tTimerSettings.cycles) ||
              (tTimerSettings.mode === 'total-time' &&
                tTimerTotalElapsed >=
                  (tTimerSettings.totalTime * 60 +
                    tTimerSettings.totalTimeSeconds) *
                    1000)) && (
              <div className="mb-4 animate-pulse font-bold text-green-400">
                T-Timer Complete! 🎉
              </div>
            )}

          {/* Controls */}
          <div
            className="flex justify-center gap-4"
            role="group"
            aria-label="Timer controls"
          >
            <button
              onClick={toggleTimer}
              aria-label={`${isRunning ? 'Pause' : 'Start'} timer`}
              className={`rounded-lg px-6 py-3 font-semibold shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                isRunning
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>

            <button
              onClick={resetTimer}
              aria-label="Reset timer"
              className="rounded-lg border border-gray-600 bg-gray-700 px-6 py-3 font-semibold text-gray-100 shadow-lg transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Reset
            </button>

            {mode === 'pomodoro' && (
              <button
                onClick={() => {
                  setIsRunning(false)
                  handlePomodoroComplete()
                }}
                aria-label={`Skip current ${pomodoroPhase} session`}
                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Skip
              </button>
            )}

            {mode === 't-timer' && (
              <button
                onClick={() => {
                  playTimerAlert('triple')
                  handleTTimerComplete()
                }}
                aria-label={`Skip current ${tTimerPhase} phase`}
                className="rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Skip Phase
              </button>
            )}
          </div>
        </div>{' '}
        {/* End Timer Content */}
      </div>
    </div>
  )
}
