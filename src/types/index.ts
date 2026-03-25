// Vector3 type for 3D positions
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Quaternion for rotations
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

// Drone telemetry data
export interface DroneTelemetry {
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  rotation: Quaternion;
  batteryLevel: number; // 0-100
  altitude: number; // meters
  speed: number; // m/s
  temperature: number; // celsius
  signalStrength: number; // 0-100
  gpsAccuracy: number; // meters
}

// Drone state
export interface DroneState {
  telemetry: DroneTelemetry;
  isFlying: boolean;
  isAutonomous: boolean;
  currentMission: string | null;
  lastUpdate: number; // timestamp
}

// Flight controls
export interface FlightControls {
  thrust: number; // 0-1
  roll: number; // -1 to 1
  pitch: number; // -1 to 1
  yaw: number; // -1 to 1
}

// AI decision data
export interface AIDecision {
  action: string;
  confidence: number;
  reasoning: string;
  timestamp: number;
}

// Mission waypoint
export interface Waypoint {
  id: string;
  position: Vector3;
  action: 'hover' | 'scan' | 'land' | 'continue';
  duration: number; // seconds
  completed: boolean;
}

// Obstacle for pathfinding
export interface Obstacle {
  position: Vector3;
  radius: number;
  type: 'static' | 'dynamic';
}

// PID controller coefficients
export interface PIDCoefficients {
  Kp: number; // Proportional gain
  Ki: number; // Integral gain
  Kd: number; // Derivative gain
}

// Neural network layer info
export interface NeuralLayer {
  name: string;
  neurons: number;
  activation: string;
}

// Terminal command
export interface TerminalCommand {
  command: string;
  output: string;
  timestamp: number;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Detected object (computer vision simulation)
export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position3D: Vector3;
  color: string;
}
