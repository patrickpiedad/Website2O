import type { TTimerPhase, TTimerSettings } from './types'
import { formatTimeDisplay, minutesSecondsToMs } from './utils'

interface TTimerStatusProps {
  settings: TTimerSettings
  phase: TTimerPhase
  currentCycle: number
  totalElapsed: number
}

export const TTimerStatus = ({
  settings,
  phase,
  currentCycle,
  totalElapsed
}: TTimerStatusProps) => {
  return (
    <div className="mb-4 rounded-lg border border-gray-600 bg-gray-800 p-3">
      <div className="mb-2 text-sm text-gray-300">
        {settings.mode === 'cycles'
          ? `Cycle ${currentCycle}/${settings.cycles}`
          : `Total: ${Math.floor(totalElapsed / 60000)}:${Math.floor(
              (totalElapsed % 60000) / 1000
            )
              .toString()
              .padStart(
                2,
                '0'
              )}/${formatTimeDisplay(settings.totalTime, settings.totalTimeSeconds)}`}{' '}
        • {phase === 'work' ? 'Work Time' : 'Rest Time'}
      </div>
      
      <div className="mb-2 flex justify-center">
        <div className="flex max-w-full flex-wrap justify-center gap-1">
          {settings.mode === 'cycles' &&
            settings.cycles <= 10 &&
            [...Array(settings.cycles)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-6 rounded-full ${
                  i < currentCycle - 1
                    ? 'bg-green-500'
                    : i === currentCycle - 1
                      ? phase === 'work'
                        ? 'bg-blue-500'
                        : 'bg-orange-500'
                      : 'bg-gray-600'
                }`}
              />
            ))}
          
          {settings.mode === 'cycles' &&
            settings.cycles > 10 && (
              <div className="flex flex-col items-center gap-1">
                <div className="h-2 w-32 rounded-full bg-gray-600">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (currentCycle / settings.cycles) * 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Cycle {currentCycle} of {settings.cycles}
                </div>
              </div>
            )}
          
          {settings.mode === 'total-time' && (
            <div className="flex flex-col items-center gap-1">
              <div className="h-2 w-32 rounded-full bg-gray-600">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (totalElapsed / minutesSecondsToMs(settings.totalTime, settings.totalTimeSeconds)) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div
        className={`text-xs font-medium ${
          phase === 'work' ? 'text-blue-400' : 'text-orange-400'
        }`}
      >
        {phase === 'work' ? 'Focus Time!' : 'Rest Time!'}
      </div>
    </div>
  )
}