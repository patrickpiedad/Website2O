import { useEffect, useRef, useState, useCallback } from 'react'
import type { TTimerPhase, TTimerSettings, TTimerInputs } from './types'
import { DEFAULT_SETTINGS, TIMER_CONSTANTS } from './constants'
import { minutesSecondsToMs, playTimerAlert } from './utils'

export const useTTimer = () => {
  const [time, setTime] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [tTimerPhase, setTTimerPhase] = useState<TTimerPhase>('work')
  const [tTimerCurrentCycle, setTTimerCurrentCycle] = useState<number>(1)
  const [tTimerSettings, setTTimerSettings] = useState<TTimerSettings>(DEFAULT_SETTINGS)
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const initialTimeRef = useRef<number>(0)

  // Get T-Timer time based on current phase
  const getTTimerTime = useCallback((): number => {
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
  }, [tTimerPhase, tTimerSettings.workTime, tTimerSettings.workTimeSeconds, tTimerSettings.restTime, tTimerSettings.restTimeSeconds])

  // Handle T-Timer phase completion
  const handleTTimerComplete = useCallback((): void => {
    playTimerAlert()

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
  }, [tTimerPhase, tTimerSettings.restTime, tTimerSettings.restTimeSeconds, tTimerSettings.mode, tTimerCurrentCycle, tTimerSettings.cycles, tTimerSettings.workTime, tTimerSettings.workTimeSeconds])

  // Start/stop timer
  const toggleTimer = useCallback((): void => {
    if (!isRunning) {
      // Starting timer
      setTTimerStartTime(Date.now())
      setTTimerTotalElapsed(0)
      startTimeRef.current = Date.now()
      initialTimeRef.current = time
    }
    setIsRunning(!isRunning)
  }, [isRunning, time])

  // Reset timer
  const resetTimer = useCallback((): void => {
    setIsRunning(false)

    // Reset timestamp tracking
    startTimeRef.current = 0
    initialTimeRef.current = 0

    setTTimerPhase('work')
    setTTimerCurrentCycle(1)
    setTTimerTotalElapsed(0)
    setTime(getTTimerTime())
  }, [getTTimerTime])

  // Handle T-Timer input changes (allow temporary empty values)
  const handleTTimerInputChange = useCallback((
    setting: keyof TTimerInputs,
    value: string
  ): void => {
    setTTimerInputs((prev) => ({
      ...prev,
      [setting]: value
    }))
  }, [])

  // Handle T-Timer input blur (validate and update settings)
  const handleTTimerInputBlur = useCallback((setting: keyof TTimerInputs): void => {
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
    if (!isRunning) {
      setTime(getTTimerTime())
    }
  }, [tTimerInputs, isRunning, getTTimerTime])

  // Handle T-Timer mode changes
  const handleTTimerModeChange = useCallback((tTimerMode: 'cycles' | 'total-time'): void => {
    setTTimerSettings((prev) => ({
      ...prev,
      mode: tTimerMode
    }))

    // Update current timer if not running
    if (!isRunning) {
      setTime(getTTimerTime())
    }
  }, [isRunning, getTTimerTime])

  // Skip current phase
  const skipPhase = useCallback((): void => {
    playTimerAlert()
    handleTTimerComplete()
  }, [handleTTimerComplete])

  // Initialize timer with proper default values
  useEffect(() => {
    setTime(getTTimerTime())
  }, [])

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()

        setTime((prevTime) => {
          // Calculate actual elapsed time based on timestamps
          const elapsed = now - startTimeRef.current
          const newTime = initialTimeRef.current - elapsed

          // Update T-Timer total elapsed time
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

          if (newTime <= 0) {
            // Don't stop running, just handle phase completion
            handleTTimerComplete()
            // The new time will be set by handleTTimerComplete, so return current time for now
            return newTime
          }
          return newTime
        })
      }, TIMER_CONSTANTS.UPDATE_INTERVAL)
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
  }, [isRunning, tTimerPhase, tTimerSettings.mode, tTimerSettings.totalTime, tTimerSettings.totalTimeSeconds, tTimerStartTime, handleTTimerComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const isComplete = !isRunning && (
    (tTimerSettings.mode === 'cycles' && tTimerCurrentCycle > tTimerSettings.cycles) ||
    (tTimerSettings.mode === 'total-time' && 
     tTimerTotalElapsed >= (tTimerSettings.totalTime * 60 + tTimerSettings.totalTimeSeconds) * 1000)
  )


  return {
    // State
    time,
    isRunning,
    tTimerPhase,
    tTimerCurrentCycle,
    tTimerSettings,
    tTimerInputs,
    tTimerTotalElapsed,
    showTTimerSettings,
    isComplete,
    
    // Actions
    toggleTimer,
    resetTimer,
    skipPhase,
    setShowTTimerSettings,
    handleTTimerInputChange,
    handleTTimerInputBlur,
    handleTTimerModeChange
  }
}