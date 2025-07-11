import { useEffect, useRef, useState } from 'react'

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
  const [mode, setMode] = useState<TimerMode>('timer')
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
      setTime((inputMinutes * 60 + inputSeconds) * 1000)
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
    const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const ms = Math.floor((Math.abs(milliseconds) % 1000) / 10) // Show centiseconds (00-99)
    const sign = milliseconds < 0 ? '-' : ''
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`
  }

  // Format time for display (MM:SS format)
  const formatTimeDisplay = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
        console.log(`'Error is:' ${error}`)
      }
    }

    // Play initial beep
    playBeep()

    // Continue playing beeps every 1 seconds for 30 seconds
    alarmIntervalRef.current = setInterval(playBeep, 1000)

    // Stop alarm after 30 seconds
    setTimeout(() => {
      stopAlarm()
    }, 30000)
  }

  // Play T-Timer triple beep
  const playTTimerAlert = (): void => {
    const playBeep = (): void => {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContextClass()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        )

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.log('Audio not supported')
        console.log(`'Error is:' ${error}`)
      }
    }

    // Play 3 beeps with 300ms intervals
    playBeep()
    setTimeout(playBeep, 300)
    setTimeout(playBeep, 600)
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
        return (
          (tTimerSettings.workTime * 60 + tTimerSettings.workTimeSeconds) * 1000
        )
      case 'rest':
        return (
          (tTimerSettings.restTime * 60 + tTimerSettings.restTimeSeconds) * 1000
        )
      default:
        return (
          (tTimerSettings.workTime * 60 + tTimerSettings.workTimeSeconds) * 1000
        )
    }
  }

  // Check if T-Timer should stop
  const shouldTTimerStop = (): boolean => {
    if (tTimerSettings.mode === 'cycles') {
      return tTimerCurrentCycle > tTimerSettings.cycles
    } else {
      const totalTimeMs =
        (tTimerSettings.totalTime * 60 + tTimerSettings.totalTimeSeconds) * 1000
      return tTimerTotalElapsed >= totalTimeMs
    }
  }

  // Handle T-Timer phase completion
  const handleTTimerComplete = (): void => {
    playTTimerAlert()

    if (tTimerPhase === 'work') {
      // Work phase completed, start rest
      setTTimerPhase('rest')
      const newTime =
        (tTimerSettings.restTime * 60 + tTimerSettings.restTimeSeconds) * 1000
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
      const newTime =
        (tTimerSettings.workTime * 60 + tTimerSettings.workTimeSeconds) * 1000
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
      setTime((inputMinutes * 60 + inputSeconds) * 1000)
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
      setTime((inputMinutes * 60 + inputSeconds) * 1000)
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
      [setting]: Math.max(0, parseInt(value) || 0)
    }
    setPomodoroSettings(newSettings)

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
    setTTimerInputs(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  // Handle T-Timer input blur (validate and update settings)
  const handleTTimerInputBlur = (
    setting: keyof TTimerInputs
  ): void => {
    const value = tTimerInputs[setting]
    let numericValue: number
    
    if (value === '' || isNaN(parseInt(value))) {
      numericValue = setting === 'cycles' ? 1 : 0
    } else {
      numericValue = Math.max(setting === 'cycles' ? 1 : 0, parseInt(value))
    }

    // Update the input to show the validated value
    setTTimerInputs(prev => ({
      ...prev,
      [setting]: numericValue.toString()
    }))

    // Update the actual settings
    setTTimerSettings(prev => ({
      ...prev,
      [setting]: numericValue
    }))

    // Update current timer if not running
    if (!isRunning && mode === 't-timer') {
      setTime(getTTimerTime())
    }
  }

  // Handle T-Timer mode changes
  const handleTTimerModeChange = (mode: TTimerMode): void => {
    setTTimerSettings(prev => ({
      ...prev,
      mode
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
            <button
              onClick={() => switchMode('t-timer')}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                mode === 't-timer'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
            >
              T-Timer
            </button>
          </div>
        </div>

        {/* T-Timer Settings */}
        {mode === 't-timer' && (
          <div className="mb-4">
            <button
              onClick={() => setShowTTimerSettings(!showTTimerSettings)}
              className="mb-2 text-sm text-blue-400 hover:text-blue-300"
            >
              {showTTimerSettings ? 'Hide' : 'Show'} Settings
            </button>

            {showTTimerSettings && (
              <div className="mb-4 rounded-lg border border-gray-600 bg-gray-800 p-4">
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
                            handleTTimerInputChange('workTime', e.target.value)
                          }
                          onBlur={() => handleTTimerInputBlur('workTime')}
                          onFocus={(e) => e.target.select()}
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">min</span>
                      </div>
                      <span className="text-gray-400">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={tTimerInputs.workTimeSeconds}
                          onChange={(e) =>
                            handleTTimerInputChange('workTimeSeconds', e.target.value)
                          }
                          onBlur={() => handleTTimerInputBlur('workTimeSeconds')}
                          onFocus={(e) => e.target.select()}
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">sec</span>
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
                            handleTTimerInputChange('restTime', e.target.value)
                          }
                          onBlur={() => handleTTimerInputBlur('restTime')}
                          onFocus={(e) => e.target.select()}
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">min</span>
                      </div>
                      <span className="text-gray-400">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={tTimerInputs.restTimeSeconds}
                          onChange={(e) =>
                            handleTTimerInputChange('restTimeSeconds', e.target.value)
                          }
                          onBlur={() => handleTTimerInputBlur('restTimeSeconds')}
                          onFocus={(e) => e.target.select()}
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">sec</span>
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
                              handleTTimerInputChange('totalTime', e.target.value)
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
                              handleTTimerInputChange('totalTimeSeconds', e.target.value)
                            }
                            onBlur={() => handleTTimerInputBlur('totalTimeSeconds')}
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
                    <label className="mb-2 block text-gray-300">
                      Work Time
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={pomodoroSettings.workTime}
                          onChange={(e) =>
                            handlePomodoroSettingChange(
                              'workTime',
                              e.target.value
                            )
                          }
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">min</span>
                      </div>
                      <span className="text-gray-400">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={pomodoroSettings.workTimeSeconds}
                          onChange={(e) =>
                            handlePomodoroSettingChange(
                              'workTimeSeconds',
                              e.target.value
                            )
                          }
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">sec</span>
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
                    <label className="mb-2 block text-gray-300">
                      Short Break
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={pomodoroSettings.shortBreak}
                          onChange={(e) =>
                            handlePomodoroSettingChange(
                              'shortBreak',
                              e.target.value
                            )
                          }
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">min</span>
                      </div>
                      <span className="text-gray-400">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={pomodoroSettings.shortBreakSeconds}
                          onChange={(e) =>
                            handlePomodoroSettingChange(
                              'shortBreakSeconds',
                              e.target.value
                            )
                          }
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">sec</span>
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
                    <label className="mb-2 block text-gray-300">
                      Long Break
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={pomodoroSettings.longBreak}
                          onChange={(e) =>
                            handlePomodoroSettingChange(
                              'longBreak',
                              e.target.value
                            )
                          }
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">min</span>
                      </div>
                      <span className="text-gray-400">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={pomodoroSettings.longBreakSeconds}
                          onChange={(e) =>
                            handlePomodoroSettingChange(
                              'longBreakSeconds',
                              e.target.value
                            )
                          }
                          className="w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="mt-1 text-xs text-gray-400">sec</span>
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
                          width: `${Math.min(100, (tTimerTotalElapsed / ((tTimerSettings.totalTime * 60 + tTimerSettings.totalTimeSeconds) * 1000)) * 100)}%`
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

          {mode === 't-timer' && (
            <button
              onClick={() => {
                playTTimerAlert()
                handleTTimerComplete()
              }}
              className="rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-purple-700"
            >
              Skip Phase
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
