export const TIMER_CONSTANTS = {
  UPDATE_INTERVAL: 100, // milliseconds
  ALERT_FREQUENCY: 1000, // Hz
  ALERT_DURATION: 0.3, // seconds
  ALERT_VOLUME: 0.4
} as const

export const CSS_CLASSES = {
  INPUT_BASE:
    'w-16 rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
  INPUT_FULL:
    'w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-center text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
  BUTTON_PRIMARY:
    'rounded-lg px-6 py-3 font-semibold shadow-lg transition-colors',
  BUTTON_SMALL: 'rounded px-3 py-1 text-sm transition-colors',
  CONTAINER:
    'mx-auto max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-2xl',
  SETTINGS_PANEL: 'mb-4 rounded-lg border border-gray-600 bg-gray-800 p-4',
  FLEX_CENTER: 'flex items-center justify-center gap-2',
  FLEX_COL_CENTER: 'flex flex-col items-center'
} as const

export const DEFAULT_SETTINGS = {
  workTime: 1, // minutes
  workTimeSeconds: 0, // seconds
  restTime: 0, // minutes
  restTimeSeconds: 15, // seconds
  cycles: 20,
  totalTime: 20, // minutes
  totalTimeSeconds: 0, // seconds
  mode: 'cycles' as const
}