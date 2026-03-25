import { DroneTelemetry } from '../../types';

interface HUDProps {
  telemetry: DroneTelemetry;
  isAutonomous: boolean;
}

const HUD = ({ telemetry, isAutonomous }: HUDProps) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-6">
        {/* Left side - Status */}
        <div className="bg-cyber-darker/80 border border-cyber-green/30 rounded-lg p-3 backdrop-blur-sm pointer-events-auto glow-border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isAutonomous ? 'bg-cyber-cyan animate-pulse' : 'bg-cyber-green'}`}></div>
            <span className="text-cyber-green font-mono text-sm">
              {isAutonomous ? 'AI AUTOPILOT' : 'MANUAL CONTROL'}
            </span>
          </div>
        </div>

        {/* Right side - Battery */}
        <div className="bg-cyber-darker/80 border border-cyber-green/30 rounded-lg p-3 backdrop-blur-sm pointer-events-auto glow-border">
          <div className="flex items-center gap-3">
            <span className="text-cyber-green font-mono text-sm">BATTERY</span>
            <div className="w-24 h-4 bg-cyber-dark border border-cyber-green/50 rounded-sm overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  telemetry.batteryLevel > 50 ? 'bg-cyber-green' :
                  telemetry.batteryLevel > 20 ? 'bg-cyber-warning' :
                  'bg-cyber-danger'
                }`}
                style={{ width: `${telemetry.batteryLevel}%` }}
              ></div>
            </div>
            <span className="text-cyber-green font-mono text-sm">{Math.round(telemetry.batteryLevel)}%</span>
          </div>
        </div>
      </div>

      {/* Left panel - Telemetry */}
      <div className="absolute top-24 left-6 bg-cyber-darker/80 border border-cyber-green/30 rounded-lg p-4 backdrop-blur-sm pointer-events-auto glow-border">
        <div className="text-cyber-green font-mono space-y-2 text-sm">
          <div className="text-cyber-cyan font-semibold mb-3 border-b border-cyber-green/20 pb-2">TELEMETRY</div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-cyber-green/70">ALT:</span>
            <span className="text-cyber-green">{telemetry.altitude.toFixed(1)} m</span>
            
            <span className="text-cyber-green/70">SPD:</span>
            <span className="text-cyber-green">{telemetry.speed.toFixed(1)} m/s</span>
            
            <span className="text-cyber-green/70">TEMP:</span>
            <span className="text-cyber-green">{telemetry.temperature.toFixed(0)}°C</span>
            
            <span className="text-cyber-green/70">GPS:</span>
            <span className="text-cyber-green">±{telemetry.gpsAccuracy.toFixed(1)}m</span>
            
            <span className="text-cyber-green/70">SIGNAL:</span>
            <span className="text-cyber-green">{telemetry.signalStrength}%</span>
          </div>
          
          <div className="mt-3 pt-2 border-t border-cyber-green/20">
            <div className="text-cyber-green/70 text-xs">POSITION</div>
            <div className="text-cyber-green text-xs">
              X: {telemetry.position.x.toFixed(2)}<br/>
              Y: {telemetry.position.y.toFixed(2)}<br/>
              Z: {telemetry.position.z.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Velocity Vector */}
      <div className="absolute top-24 right-6 bg-cyber-darker/80 border border-cyber-green/30 rounded-lg p-4 backdrop-blur-sm pointer-events-auto glow-border">
        <div className="text-cyber-green font-mono space-y-2 text-sm">
          <div className="text-cyber-cyan font-semibold mb-3 border-b border-cyber-green/20 pb-2">VELOCITY</div>
          
          <div className="text-cyber-green text-xs">
            VX: {telemetry.velocity.x.toFixed(2)} m/s<br/>
            VY: {telemetry.velocity.y.toFixed(2)} m/s<br/>
            VZ: {telemetry.velocity.z.toFixed(2)} m/s
          </div>
          
          <div className="mt-3 pt-2 border-t border-cyber-green/20">
            <div className="text-cyber-green/70 text-xs">ACCELERATION</div>
            <div className="text-cyber-green text-xs">
              AX: {telemetry.acceleration.x.toFixed(2)}<br/>
              AY: {telemetry.acceleration.y.toFixed(2)}<br/>
              AZ: {telemetry.acceleration.z.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom center - Crosshair */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
        <svg width="60" height="60" className="opacity-50">
          <circle cx="30" cy="30" r="25" fill="none" stroke="#00ff41" strokeWidth="1" />
          <line x1="30" y1="10" x2="30" y2="20" stroke="#00ff41" strokeWidth="1" />
          <line x1="30" y1="40" x2="30" y2="50" stroke="#00ff41" strokeWidth="1" />
          <line x1="10" y1="30" x2="20" y2="30" stroke="#00ff41" strokeWidth="1" />
          <line x1="40" y1="30" x2="50" y2="30" stroke="#00ff41" strokeWidth="1" />
        </svg>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-1 bg-gradient-to-b from-transparent via-cyber-green/20 to-transparent animate-scan"></div>
      </div>
    </div>
  );
};

export default HUD;
