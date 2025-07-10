import { useEffect, useRef, useState } from 'react'

type TimerMode = 'timer' | 'stopwatch' | 'pomodoro'
type PomodoroPhase = 'work' | 'short-break' | 'long-break'

interface PomodoroSettings {
  workTime: number
  shortBreak: number
  longBreak: number
  sessionsUntilLongBreak: number
}

export default function Timer(): JSX.Element {
  const [time, setTime] = useState<number>(0) // Time in milliseconds
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [mode, setMode] = useState<TimerMode>('timer')
  const [inputMinutes, setInputMinutes] = useState<number>(5)
  const [inputSeconds, setInputSeconds] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false)
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Pomodoro state
  const [pomodoroSession, setPomodoroSession] = useState<number>(1)
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work')
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workTime: 25, // minutes
    shortBreak: 5, // minutes
    longBreak: 15, // minutes
    sessionsUntilLongBreak: 4
  })
  const [showPomodoroSettings, setShowPomodoroSettings] =
    useState<boolean>(false)

  // Initialize timer with proper default values
  useEffect(() => {
    if (mode === 'timer') {
      setTime((inputMinutes * 60 + inputSeconds) * 1000)
    } else if (mode === 'pomodoro') {
      setTime(getPomodoroTime())
    } else {
      setTime(0)
    }
  }, [])

  // Format time as MM:SS:MS
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const ms = Math.floor((Math.abs(milliseconds) % 1000) / 10) // Show centiseconds (00-99)
    const sign = milliseconds < 0 ? '-' : ''
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`
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

    const playBeep = (): void => {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContextClass()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        )

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      } catch (error) {
        console.log('Audio not supported')
      }
    }

    // Play initial beep
    playBeep()

    // Continue playing beeps every 2 seconds for 30 seconds
    alarmIntervalRef.current = setInterval(playBeep, 2000)

    // Stop alarm after 30 seconds
    setTimeout(() => {
      stopAlarm()
    }, 30000)
  }

  // Get pomodoro time based on current phase
  const getPomodoroTime = (): number => {
    switch (pomodoroPhase) {
      case 'work':
        return pomodoroSettings.workTime * 60 * 1000
      case 'short-break':
        return pomodoroSettings.shortBreak * 60 * 1000
      case 'long-break':
        return pomodoroSettings.longBreak * 60 * 1000
      default:
        return pomodoroSettings.workTime * 60 * 1000
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
        ? pomodoroSettings.workTime * 60 * 1000
        : newPhase === 'short-break'
          ? pomodoroSettings.shortBreak * 60 * 1000
          : pomodoroSettings.longBreak * 60 * 1000

    setTime(newTime)
  }

  // Start/stop timer
  const toggleTimer = (): void => {
    setIsRunning(!isRunning)
  }

  // Reset timer
  const resetTimer = (): void => {
    setIsRunning(false)
    stopAlarm() // Stop alarm when resetting
    if (mode === 'timer') {
      setTime((inputMinutes * 60 + inputSeconds) * 1000)
    } else if (mode === 'pomodoro') {
      setTime(getPomodoroTime())
    } else {
      setTime(0)
    }
  }

  // Switch between timer and stopwatch modes
  const switchMode = (newMode: TimerMode): void => {
    setMode(newMode)
    setIsRunning(false)
    stopAlarm() // Stop alarm when switching modes

    if (newMode === 'timer') {
      setTime((inputMinutes * 60 + inputSeconds) * 1000)
    } else if (newMode === 'pomodoro') {
      setPomodoroSession(1)
      setPomodoroPhase('work')
      setTime(getPomodoroTime())
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
      setTime((minutes * 60 + inputSeconds) * 1000) // Convert to milliseconds
    }
  }

  const handleSecondsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const seconds = parseInt(e.target.value) || 0
    setInputSeconds(Math.max(0, Math.min(59, seconds))) // Limit to 0-59
    if (!isRunning) {
      setTime((inputMinutes * 60 + seconds) * 1000) // Convert to milliseconds
    }
  }

  // Handle pomodoro settings changes
  const handlePomodoroSettingChange = (
    setting: keyof PomodoroSettings,
    value: string
  ): void => {
    const newSettings = {
      ...pomodoroSettings,
      [setting]: Math.max(1, parseInt(value) || 1)
    }
    setPomodoroSettings(newSettings)

    // Update current timer if not running
    if (!isRunning && mode === 'pomodoro') {
      const newTime =
        setting === 'workTime' && pomodoroPhase === 'work'
          ? newSettings.workTime * 60 * 1000
          : setting === 'shortBreak' && pomodoroPhase === 'short-break'
            ? newSettings.shortBreak * 60 * 1000
            : setting === 'longBreak' && pomodoroPhase === 'long-break'
              ? newSettings.longBreak * 60 * 1000
              : time

      if (newTime !== time) {
        setTime(newTime)
      }
    }
  }

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (mode === 'timer' || mode === 'pomodoro') {
            const newTime = prevTime - 100 // Subtract 100ms
            if (newTime <= 0) {
              setIsRunning(false)
              playAlarm() // Play alarm when timer finishes

              // Handle pomodoro auto-progression
              if (mode === 'pomodoro') {
                setTimeout(() => {
                  handlePomodoroComplete()
                }, 1000)
              }

              return 0
            }
            return newTime
          } else {
            // Stopwatch mode
            return prevTime + 100 // Add 100ms
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
  }, [isRunning, mode, pomodoroPhase, pomodoroSettings])

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
      <div className="mb-6 text-center">
        {/* Mode Switch */}
        <div className="mb-4 flex justify-center">
          <div className="flex rounded-lg border border-gray-600 bg-gray-800 p-1">
            <button
              onClick={() => switchMode('timer')}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                mode === 'timer'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              Timer
            </button>
            <button
              onClick={() => switchMode('stopwatch')}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                mode === 'stopwatch'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              Stopwatch
            </button>
            <button
              onClick={() => switchMode('pomodoro')}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                mode === 'pomodoro'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              Pomodoro
            </button>
          </div>
        </div>

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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="mb-1 block text-gray-300">
                      Work Time (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={pomodoroSettings.workTime}
                      onChange={(e) =>
                        handlePomodoroSettingChange('workTime', e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-300">
                      Short Break (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={pomodoroSettings.shortBreak}
                      onChange={(e) =>
                        handlePomodoroSettingChange(
                          'shortBreak',
                          e.target.value
                        )
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-300">
                      Long Break (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={pomodoroSettings.longBreak}
                      onChange={(e) =>
                        handlePomodoroSettingChange('longBreak', e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-300">
                      Sessions Until Long Break
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={pomodoroSettings.sessionsUntilLongBreak}
                      onChange={(e) =>
                        handlePomodoroSettingChange(
                          'sessionsUntilLongBreak',
                          e.target.value
                        )
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
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
                  className="w-16 rounded-md border border-gray-600 bg-gray-800 px-2 py-2 text-center text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00"
                />
                <span className="mt-1 text-xs text-gray-400">min</span>
              </div>
              <span className="text-xl font-bold text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSeconds}
                  onChange={handleSecondsChange}
                  className="w-16 rounded-md border border-gray-600 bg-gray-800 px-2 py-2 text-center text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00"
                />
                <span className="mt-1 text-xs text-gray-400">sec</span>
              </div>
            </div>
          </div>
        )}

        {/* Time Display */}
        <div
          className={`mb-6 font-mono text-5xl font-bold ${
            (mode === 'timer' || mode === 'pomodoro') &&
            time <= 10000 &&
            time > 0
              ? 'text-red-400'
              : isAlarmPlaying
                ? 'animate-pulse text-red-400'
                : mode === 'pomodoro' && pomodoroPhase === 'work'
                  ? 'text-red-300'
                  : mode === 'pomodoro'
                    ? 'text-green-300'
                    : 'text-gray-100'
          }`}
        >
          {formatTime(time)}
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

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`rounded-lg px-6 py-3 font-semibold shadow-lg transition-colors ${
              isRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>

          <button
            onClick={resetTimer}
            className="rounded-lg border border-gray-600 bg-gray-700 px-6 py-3 font-semibold text-gray-100 shadow-lg transition-colors hover:bg-gray-600"
          >
            Reset
          </button>

          {mode === 'pomodoro' && (
            <button
              onClick={() => {
                setIsRunning(false)
                handlePomodoroComplete()
              }}
              className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
