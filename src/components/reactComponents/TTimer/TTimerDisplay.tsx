import type { TTimerPhase } from './types'
import { formatCountdownTime } from './utils'

interface TTimerDisplayProps {
  time: number
  isRunning: boolean
  phase: TTimerPhase
  currentCycle: number
  totalCycles: number
  isComplete: boolean
}

export const TTimerDisplay = ({
  time,
  isRunning,
  phase,
  currentCycle,
  totalCycles,
  isComplete
}: TTimerDisplayProps) => {
  const getDisplayColor = () => {
    if (time <= 10000 && time > 0) {
      return 'text-red-400'
    }
    return phase === 'work' ? 'text-blue-300' : 'text-orange-300'
  }

  return (
    <>
      {/* Time Display */}
      <div
        role="timer"
        aria-live="polite"
        aria-label={`Timer display: ${formatCountdownTime(time)}`}
        className={`mb-6 font-mono text-5xl font-bold ${getDisplayColor()}`}
      >
        {formatCountdownTime(time)}
        <span className="sr-only">
          {isRunning ? 'Timer is running' : 'Timer is stopped'}
          {`, ${phase} phase, cycle ${currentCycle} of ${totalCycles}`}
        </span>
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mb-4 animate-pulse font-bold text-green-400">
          T-Timer Complete! 🎉
        </div>
      )}
    </>
  )
}