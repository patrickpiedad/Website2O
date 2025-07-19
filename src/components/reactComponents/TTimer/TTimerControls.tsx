import { CSS_CLASSES } from './constants'
import type { TTimerPhase } from './types'

interface TTimerControlsProps {
  isRunning: boolean
  phase: TTimerPhase
  onToggleTimer: () => void
  onResetTimer: () => void
  onSkipPhase: () => void
}

export const TTimerControls = ({
  isRunning,
  phase,
  onToggleTimer,
  onResetTimer,
  onSkipPhase
}: TTimerControlsProps) => {
  return (
    <div
      className="flex justify-center gap-4"
      role="group"
      aria-label="Timer controls"
    >
      <button
        onClick={onToggleTimer}
        aria-label={`${isRunning ? 'Pause' : 'Start'} timer`}
        className={`${CSS_CLASSES.BUTTON_PRIMARY} ${
          isRunning
            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900`}
      >
        {isRunning ? 'Pause' : 'Start'}
      </button>

      <button
        onClick={onResetTimer}
        aria-label="Reset timer"
        className="rounded-lg border border-gray-600 bg-gray-700 px-6 py-3 font-semibold text-gray-100 shadow-lg transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Reset
      </button>

      <button
        onClick={onSkipPhase}
        aria-label={`Skip current ${phase} phase`}
        className="rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Skip Phase
      </button>
    </div>
  )
}
