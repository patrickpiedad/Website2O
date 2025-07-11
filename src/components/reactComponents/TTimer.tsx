type TTimerPhase = 'chill' | 'push'
type TTimerMode = 'cycles' | 'total-time'

type TTimerSettings = {
  chillTime: number
  chillTimeSeconds: number
  pushTime: number
  pushTimeSeconds: number
  cycles: number
  totalTime: number
  totalTimeSeconds: number
  mode: TTimerMode
}

export default function () {
  const [time, setTime] = useState<number>(0)
  const [inputMinutes, setInputMinutes] = useState<number>(5)
  const [inputSeconds, setInputSeconds] = useState<number>(0)

  const [tTimerPhase, setTTimerPhase] = useState<tTimerPhase>('chill')
  const [tTimerTotalElapsed, setTTimerTotalElapsed] = useState<number>(0)
  const [showTTimerSettings, setShowTTimerSettings] = useState<boolean>(false)

  return <main>T-Timer App</main>
}
