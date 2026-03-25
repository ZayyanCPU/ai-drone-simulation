import { PIDCoefficients } from '../types';

export class PIDController {
  private Kp: number;
  private Ki: number;
  private Kd: number;
  private integral: number = 0;
  private previousError: number = 0;
  private lastTime: number = Date.now();

  constructor(coefficients: PIDCoefficients) {
    this.Kp = coefficients.Kp;
    this.Ki = coefficients.Ki;
    this.Kd = coefficients.Kd;
  }

  calculate(setpoint: number, measured: number): number {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    
    if (deltaTime <= 0) return 0;

    // Calculate error
    const error = setpoint - measured;

    // Proportional term
    const P = this.Kp * error;

    // Integral term (with anti-windup)
    this.integral += error * deltaTime;
    this.integral = Math.max(-10, Math.min(10, this.integral)); // Clamp integral
    const I = this.Ki * this.integral;

    // Derivative term
    const derivative = (error - this.previousError) / deltaTime;
    const D = this.Kd * derivative;

    // Update for next iteration
    this.previousError = error;
    this.lastTime = currentTime;

    // Total output
    const output = P + I + D;

    return output;
  }

  reset(): void {
    this.integral = 0;
    this.previousError = 0;
    this.lastTime = Date.now();
  }

  setCoefficients(coefficients: PIDCoefficients): void {
    this.Kp = coefficients.Kp;
    this.Ki = coefficients.Ki;
    this.Kd = coefficients.Kd;
  }

  getCoefficients(): PIDCoefficients {
    return {
      Kp: this.Kp,
      Ki: this.Ki,
      Kd: this.Kd,
    };
  }
}
