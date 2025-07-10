import { useEffect, useRef, useState } from 'react';

export default function Timer() {
  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('timer'); // 'timer' or 'stopwatch'
  const [inputMinutes, setInputMinutes] = useState(5);
  const intervalRef = useRef(null);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/stop timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setTime(mode === 'timer' ? inputMinutes * 60 : 0);
  };

  // Switch between timer and stopwatch modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTime(newMode === 'timer' ? inputMinutes * 60 : 0);
  };

  // Handle timer input change
  const handleInputChange = (e) => {
    const minutes = parseInt(e.target.value) || 0;
    setInputMinutes(minutes);
    if (!isRunning) {
      setTime(minutes * 60);
    }
  };

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          if (mode === 'timer') {
            const newTime = prevTime - 1;
            if (newTime <= 0) {
              setIsRunning(false);
              // Timer finished - you could add notification here
              return 0;
            }
            return newTime;
          } else {
            // Stopwatch mode
            return prevTime + 1;
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // Initialize time when component mounts
  useEffect(() => {
    if (mode === 'timer') {
      setTime(inputMinutes * 60);
    }
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-700 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Timer App</h2>
        
        {/* Mode Switch */}
        <div className="flex justify-center mb-4">
          <div className="bg-gray-600 rounded-lg p-1 flex">
            <button
              onClick={() => switchMode('timer')}
              className={`px-4 py-2 rounded-md transition-colors ${
                mode === 'timer' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-200 hover:text-white'
              }`}
            >
              Timer
            </button>
            <button
              onClick={() => switchMode('stopwatch')}
              className={`px-4 py-2 rounded-md transition-colors ${
                mode === 'stopwatch' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-200 hover:text-white'
              }`}
            >
              Stopwatch
            </button>
          </div>
        </div>

        {/* Timer Input (only show in timer mode) */}
        {mode === 'timer' && !isRunning && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Set Timer (minutes):
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={inputMinutes}
              onChange={handleInputChange}
              className="w-20 px-3 py-2 border border-gray-500 bg-gray-600 text-white rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Time Display */}
        <div className={`text-6xl font-mono font-bold mb-6 ${
          mode === 'timer' && time <= 10 && time > 0 ? 'text-red-400' : 'text-white'
        }`}>
          {formatTime(time)}
        </div>

        {/* Timer finished message */}
        {mode === 'timer' && time === 0 && (
          <div className="text-red-400 font-bold mb-4">Time's up!</div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={resetTimer}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}