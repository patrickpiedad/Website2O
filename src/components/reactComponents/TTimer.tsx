import { useState } from 'react'

type TTimerPhase = 'chill' | 'push'
type TTimerMode = 'cycles' | 'total-time'

type TTimerSettings = {
  chillTimeMinutes: number
  chillTimeSeconds: number
  pushTimeMinutes: number
  pushTimeSeconds: number
  cycles: number
  totalTimeMinutes: number
  totalTimeSeconds: number
  mode: TTimerMode
}

export default function TTimer() {
  const [time, setTime] = useState<number>(0)
  const [inputMinutes, setInputMinutes] = useState<number>(5)
  const [inputSeconds, setInputSeconds] = useState<number>(0)

  const [tTimerPhase, setTTimerPhase] = useState<TTimerPhase>('chill')
  const [tTimerCurrentCycle, setTTimerCurrentCycle] = useState<number>(1)
  const [tTimerSettings, setTTimerSettings] = useState<TTimerSettings>({
    chillTimeMinutes: 1,
    chillTimeSeconds: 0,
    pushTimeMinutes: 0,
    pushTimeSeconds: 15,
    cycles: 20,
    totalTimeMinutes: 20,
    totalTimeSeconds: 0,
    mode: 'cycles'
  })

  const [tTimerTotalElapsed, setTTimerTotalElapsed] = useState<number>(0)
  const [showTTimerSettings, setShowTTimerSettings] = useState<boolean>(true)

  return (
    <main className="shadow-2xl>T-Timer App mx-auto max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6">
      <div className="mb-6 text-center">
        <button
          className="mb-4 text-sm text-blue-400 hover:text-blue-200"
          onClick={() => setShowTTimerSettings(!showTTimerSettings)}
        >
          {showTTimerSettings ? 'Hide' : 'Show'} Settings
        </button>

        {showTTimerSettings && (
          <div className="log mb-4 rounded border border-gray-600 bg-gray-800 p-4">
            <div className="mb-4 border">
              <label className="mb-2 block text-sm text-gray-300">
                Timer Mode
              </label>
              <div className="flex justify-center gap-2">
                <button
                  className={`rounded px-3 py-1 text-sm transition-colors ${
                    tTimerSettings.mode === 'cycles'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Cycles
                </button>
                <button
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
          </div>
        )}
      </div>
    </main>
  )
}
