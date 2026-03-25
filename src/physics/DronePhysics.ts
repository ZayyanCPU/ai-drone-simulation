import { Vector3, Quaternion, DroneTelemetry, FlightControls } from '../types';
import { PIDController } from '../math/PIDController';

export class DronePhysics {
  private telemetry: DroneTelemetry;
  private pidRoll: PIDController;
  private pidPitch: PIDController;
  private pidYaw: PIDController;
  private pidAltitude: PIDController;
  
  private readonly GRAVITY = 9.81; // m/s²
  private readonly MASS = 1.5; // kg
  private readonly MAX_THRUST = 30; // Newtons
  private readonly DRAG_COEFFICIENT = 0.1;

  constructor() {
    // Initialize telemetry
    this.telemetry = {
      position: { x: 0, y: 5, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      batteryLevel: 100,
      altitude: 5,
      speed: 0,
      temperature: 25,
      signalStrength: 100,
      gpsAccuracy: 1.5,
    };

    // Initialize PID controllers
    this.pidRoll = new PIDController({ Kp: 1.5, Ki: 0.05, Kd: 0.8 });
    this.pidPitch = new PIDController({ Kp: 1.5, Ki: 0.05, Kd: 0.8 });
    this.pidYaw = new PIDController({ Kp: 2.0, Ki: 0.1, Kd: 0.5 });
    this.pidAltitude = new PIDController({ Kp: 3.0, Ki: 0.2, Kd: 1.2 });
  }

  update(controls: FlightControls, deltaTime: number): void {
    // Calculate thrust force
    const thrustForce = controls.thrust * this.MAX_THRUST;
    
    // Calculate forces
    const gravityForce = this.MASS * this.GRAVITY;
    const netVerticalForce = thrustForce - gravityForce;
    
    // Calculate drag
    const speed = Math.sqrt(
      this.telemetry.velocity.x ** 2 +
      this.telemetry.velocity.y ** 2 +
      this.telemetry.velocity.z ** 2
    );
    const dragForce = this.DRAG_COEFFICIENT * speed ** 2;

    // Update acceleration (F = ma, so a = F/m)
    this.telemetry.acceleration.y = netVerticalForce / this.MASS;
    
    // Apply drag to horizontal velocities
    const dragAccel = dragForce / this.MASS;
    if (speed > 0) {
      this.telemetry.acceleration.x = -(this.telemetry.velocity.x / speed) * dragAccel;
      this.telemetry.acceleration.z = -(this.telemetry.velocity.z / speed) * dragAccel;
    }

    // Apply pitch and roll to create horizontal movement
    this.telemetry.acceleration.x += controls.pitch * 5;
    this.telemetry.acceleration.z += controls.roll * 5;

    // Update velocity
    this.telemetry.velocity.x += this.telemetry.acceleration.x * deltaTime;
    this.telemetry.velocity.y += this.telemetry.acceleration.y * deltaTime;
    this.telemetry.velocity.z += this.telemetry.acceleration.z * deltaTime;

    // Update position
    this.telemetry.position.x += this.telemetry.velocity.x * deltaTime;
    this.telemetry.position.y += this.telemetry.velocity.y * deltaTime;
    this.telemetry.position.z += this.telemetry.velocity.z * deltaTime;

    // Prevent going below ground
    if (this.telemetry.position.y < 0.5) {
      this.telemetry.position.y = 0.5;
      this.telemetry.velocity.y = 0;
      this.telemetry.acceleration.y = 0;
    }

    // Update rotation (simplified)
    this.telemetry.rotation.x = controls.pitch * 0.3;
    this.telemetry.rotation.z = controls.roll * 0.3;
    this.telemetry.rotation.y += controls.yaw * deltaTime * 2;

    // Update derived values
    this.telemetry.altitude = this.telemetry.position.y;
    this.telemetry.speed = speed;

    // Simulate battery drain
    const powerUsage = (Math.abs(controls.thrust) + Math.abs(controls.pitch) + 
                       Math.abs(controls.roll) + Math.abs(controls.yaw)) / 4;
    this.telemetry.batteryLevel -= powerUsage * deltaTime * 0.5;
    this.telemetry.batteryLevel = Math.max(0, this.telemetry.batteryLevel);

    // Simulate temperature variation
    this.telemetry.temperature = 25 + (powerUsage * 15) + (Math.random() - 0.5) * 2;
  }

  getTelemetry(): DroneTelemetry {
    return { ...this.telemetry };
  }

  resetPosition(): void {
    this.telemetry.position = { x: 0, y: 5, z: 0 };
    this.telemetry.velocity = { x: 0, y: 0, z: 0 };
    this.telemetry.acceleration = { x: 0, y: 0, z: 0 };
    this.telemetry.rotation = { x: 0, y: 0, z: 0, w: 1 };
  }
}
