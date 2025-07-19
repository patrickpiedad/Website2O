export type TTimerPhase = 'work' | 'rest'
export type TTimerMode = 'cycles' | 'total-time'

export interface TTimerSettings {
  workTime: number // minutes
  workTimeSeconds: number // seconds
  restTime: number // minutes
  restTimeSeconds: number // seconds
  cycles: number
  totalTime: number // minutes
  totalTimeSeconds: number // seconds
  mode: TTimerMode
}

export interface TTimerInputs {
  workTime: string
  workTimeSeconds: string
  restTime: string
  restTimeSeconds: string
  cycles: string
  totalTime: string
  totalTimeSeconds: string
}

export interface TTimerState {
  time: number
  isRunning: boolean
  phase: TTimerPhase
  currentCycle: number
  startTime: number
  totalElapsed: number
  showSettings: boolean
}