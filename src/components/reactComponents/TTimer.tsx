import { TTimerControls } from './TTimer/TTimerControls'
import { TTimerDisplay } from './TTimer/TTimerDisplay'
import { TTimerSettings } from './TTimer/TTimerSettings'
import { TTimerStatus } from './TTimer/TTimerStatus'
import { CSS_CLASSES } from './TTimer/constants'
import { useTTimer } from './TTimer/useTTimer'

export default function TTimer() {
  const {
    time,
    isRunning,
    tTimerPhase,
    tTimerCurrentCycle,
    tTimerSettings,
    tTimerInputs,
    tTimerTotalElapsed,
    showTTimerSettings,
    isComplete,
    toggleTimer,
    resetTimer,
    skipPhase,
    setShowTTimerSettings,
    handleTTimerInputChange,
    handleTTimerInputBlur,
    handleTTimerModeChange
  } = useTTimer()

  return (
    <div className={CSS_CLASSES.CONTAINER}>
      <div className="mb-6 text-center">
        <h1 className="mb-4 text-center text-2xl font-bold text-white">
          T-Timer
        </h1>

        <TTimerSettings
          settings={tTimerSettings}
          inputs={tTimerInputs}
          showSettings={showTTimerSettings}
          onToggleSettings={() => setShowTTimerSettings(!showTTimerSettings)}
          onInputChange={handleTTimerInputChange}
          onInputBlur={handleTTimerInputBlur}
          onModeChange={handleTTimerModeChange}
        />

        <TTimerStatus
          settings={tTimerSettings}
          phase={tTimerPhase}
          currentCycle={tTimerCurrentCycle}
          totalElapsed={tTimerTotalElapsed}
        />

        <TTimerDisplay
          time={time}
          isRunning={isRunning}
          phase={tTimerPhase}
          currentCycle={tTimerCurrentCycle}
          totalCycles={tTimerSettings.cycles}
          isComplete={isComplete}
        />

        <TTimerControls
          isRunning={isRunning}
          phase={tTimerPhase}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          onSkipPhase={skipPhase}
        />
      </div>
    </div>
  )
}
