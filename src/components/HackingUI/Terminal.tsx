import { useState, useEffect } from 'react';
import { TerminalCommand } from '../../types';

interface TerminalProps {
  className?: string;
}

const Terminal = ({ className = '' }: TerminalProps) => {
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Predefined hacking commands
  const hackingCommands: TerminalCommand[] = [
    { command: '> Initializing drone control system...', output: 'OK', timestamp: Date.now(), type: 'success' },
    { command: '> Loading neural network weights...', output: 'Model loaded: 847,293 parameters', timestamp: Date.now() + 1000, type: 'info' },
    { command: '> Connecting to GPS satellites...', output: '12 satellites locked', timestamp: Date.now() + 2000, type: 'success' },
    { command: '> Calibrating IMU sensors...', output: 'Gyroscope: OK | Accelerometer: OK | Magnetometer: OK', timestamp: Date.now() + 3000, type: 'success' },
    { command: '> Running system diagnostics...', output: 'All systems nominal', timestamp: Date.now() + 4000, type: 'success' },
    { command: '> Activating AI autopilot module...', output: 'AI ready for autonomous flight', timestamp: Date.now() + 5000, type: 'info' },
    { command: '> Scanning for obstacles...', output: 'Environment map updated', timestamp: Date.now() + 6000, type: 'info' },
    { command: '> Computing optimal flight path...', output: 'Path calculation complete: 23 waypoints', timestamp: Date.now() + 7000, type: 'success' },
    { command: '> Battery status check...', output: 'Battery: 94% | Estimated flight time: 28 minutes', timestamp: Date.now() + 8000, type: 'info' },
    { command: '> System ready for mission execution', output: 'STATUS: OPERATIONAL', timestamp: Date.now() + 9000, type: 'success' },
  ];

  useEffect(() => {
    if (currentIndex >= hackingCommands.length) {
      // Loop back to start
      setTimeout(() => {
        setCommands([]);
        setCurrentIndex(0);
      }, 5000);
      return;
    }

    const timer = setTimeout(() => {
      setCommands(prev => [...prev, hackingCommands[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div className={`bg-cyber-darker/80 border border-cyber-green/30 rounded-lg p-4 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-green/20">
        <div className="w-3 h-3 rounded-full bg-cyber-danger"></div>
        <div className="w-3 h-3 rounded-full bg-cyber-warning"></div>
        <div className="w-3 h-3 rounded-full bg-cyber-green"></div>
        <span className="ml-2 text-xs text-cyber-green/70 font-mono">SYSTEM_TERMINAL_v2.4.1</span>
      </div>
      
      <div className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
        {commands.map((cmd, index) => (
          <div key={index} className="animate-pulse">
            <div className="text-cyber-green/90">{cmd.command}</div>
            <div className={`ml-4 ${
              cmd.type === 'success' ? 'text-cyber-green' :
              cmd.type === 'error' ? 'text-cyber-danger' :
              cmd.type === 'warning' ? 'text-cyber-warning' :
              'text-cyber-cyan'
            }`}>
              {cmd.output}
            </div>
          </div>
        ))}
        {currentIndex < hackingCommands.length && (
          <div className="text-cyber-green/70 terminal-cursor">_</div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
