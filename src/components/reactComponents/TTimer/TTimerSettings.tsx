import { CSS_CLASSES } from './constants'
import type {
  TTimerInputs,
  TTimerSettings as TTimerSettingsType
} from './types'
import { formatTimeDisplay } from './utils'

interface TTimerSettingsProps {
  settings: TTimerSettingsType
  inputs: TTimerInputs
  showSettings: boolean
  onToggleSettings: () => void
  onInputChange: (setting: keyof TTimerInputs, value: string) => void
  onInputBlur: (setting: keyof TTimerInputs) => void
  onModeChange: (mode: 'cycles' | 'total-time') => void
}

export const TTimerSettings = ({
  settings,
  inputs,
  showSettings,
  onToggleSettings,
  onInputChange,
  onInputBlur,
  onModeChange
}: TTimerSettingsProps) => {
  return (
    <div className="mb-4">
      <button
        onClick={onToggleSettings}
        aria-expanded={showSettings}
        aria-controls="ttimer-settings"
        className="mb-2 text-sm text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        {showSettings ? 'Hide' : 'Show'} Settings
      </button>

      {showSettings && (
        <div id="ttimer-settings" className={CSS_CLASSES.SETTINGS_PANEL}>
          <div className="mb-4">
            <label className="mb-2 block text-sm text-gray-300">
              Timer Mode
            </label>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => onModeChange('cycles')}
                className={`${CSS_CLASSES.BUTTON_SMALL} ${
                  settings.mode === 'cycles'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Cycles
              </button>
              <button
                onClick={() => onModeChange('total-time')}
                className={`${CSS_CLASSES.BUTTON_SMALL} ${
                  settings.mode === 'total-time'
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
              <label className="mb-2 block text-gray-300">Work Time</label>
              <div className={CSS_CLASSES.FLEX_CENTER}>
                <div className={CSS_CLASSES.FLEX_COL_CENTER}>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={inputs.workTime}
                    onChange={(e) => onInputChange('workTime', e.target.value)}
                    onBlur={() => onInputBlur('workTime')}
                    onFocus={(e) => e.target.select()}
                    className={CSS_CLASSES.INPUT_BASE}
                  />
                  <span className="mt-1 text-xs text-gray-400">min</span>
                </div>
                <span className="text-gray-400">:</span>
                <div className={CSS_CLASSES.FLEX_COL_CENTER}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={inputs.workTimeSeconds}
                    onChange={(e) =>
                      onInputChange('workTimeSeconds', e.target.value)
                    }
                    onBlur={() => onInputBlur('workTimeSeconds')}
                    onFocus={(e) => e.target.select()}
                    className={CSS_CLASSES.INPUT_BASE}
                  />
                  <span className="mt-1 text-xs text-gray-400">sec</span>
                </div>
                <span className="ml-2 text-gray-400">
                  ={' '}
                  {formatTimeDisplay(
                    settings.workTime,
                    settings.workTimeSeconds
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-gray-300">Rest Time</label>
              <div className={CSS_CLASSES.FLEX_CENTER}>
                <div className={CSS_CLASSES.FLEX_COL_CENTER}>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={inputs.restTime}
                    onChange={(e) => onInputChange('restTime', e.target.value)}
                    onBlur={() => onInputBlur('restTime')}
                    onFocus={(e) => e.target.select()}
                    className={CSS_CLASSES.INPUT_BASE}
                  />
                  <span className="mt-1 text-xs text-gray-400">min</span>
                </div>
                <span className="text-gray-400">:</span>
                <div className={CSS_CLASSES.FLEX_COL_CENTER}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={inputs.restTimeSeconds}
                    onChange={(e) =>
                      onInputChange('restTimeSeconds', e.target.value)
                    }
                    onBlur={() => onInputBlur('restTimeSeconds')}
                    onFocus={(e) => e.target.select()}
                    className={CSS_CLASSES.INPUT_BASE}
                  />
                  <span className="mt-1 text-xs text-gray-400">sec</span>
                </div>
                <span className="ml-2 text-gray-400">
                  ={' '}
                  {formatTimeDisplay(
                    settings.restTime,
                    settings.restTimeSeconds
                  )}
                </span>
              </div>
            </div>

            {settings.mode === 'cycles' && (
              <div>
                <label className="mb-1 block text-center text-gray-300">
                  Number of Cycles
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={inputs.cycles}
                  onChange={(e) => onInputChange('cycles', e.target.value)}
                  onBlur={() => onInputBlur('cycles')}
                  onFocus={(e) => e.target.select()}
                  className={CSS_CLASSES.INPUT_FULL}
                />
              </div>
            )}

            {settings.mode === 'total-time' && (
              <div>
                <label className="mb-2 block text-gray-300">Total Time</label>
                <div className={CSS_CLASSES.FLEX_CENTER}>
                  <div className={CSS_CLASSES.FLEX_COL_CENTER}>
                    <input
                      type="number"
                      min="0"
                      max="480"
                      value={inputs.totalTime}
                      onChange={(e) =>
                        onInputChange('totalTime', e.target.value)
                      }
                      onBlur={() => onInputBlur('totalTime')}
                      onFocus={(e) => e.target.select()}
                      className={CSS_CLASSES.INPUT_BASE}
                    />
                    <span className="mt-1 text-xs text-gray-400">min</span>
                  </div>
                  <span className="text-gray-400">:</span>
                  <div className={CSS_CLASSES.FLEX_COL_CENTER}>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={inputs.totalTimeSeconds}
                      onChange={(e) =>
                        onInputChange('totalTimeSeconds', e.target.value)
                      }
                      onBlur={() => onInputBlur('totalTimeSeconds')}
                      onFocus={(e) => e.target.select()}
                      className={CSS_CLASSES.INPUT_BASE}
                    />
                    <span className="mt-1 text-xs text-gray-400">sec</span>
                  </div>
                  <span className="ml-2 text-gray-400">
                    ={' '}
                    {formatTimeDisplay(
                      settings.totalTime,
                      settings.totalTimeSeconds
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
