# AI Drone Simulation

Important note: This is a test project, and the current interception results are not good.

Small description: A 2D radar-based drone interception simulator that compares missile guidance strategies (Pure Pursuit vs Proportional Navigation) against straight and zigzag enemy flight patterns.

## Overview

This project demonstrates how interception can be modeled as a physics and control problem.
Enemy drones approach from the right side of the radar, while interceptor missiles launch from the defense battery on the left.

The simulation includes:

- 2D radar display with live enemy and missile tracks
- Straight and zigzag enemy movement patterns
- Guidance mode toggle:
  - Pure Pursuit
  - Proportional Navigation (PN)
- Launch and intercept coordinate logging
- Success/failure mission outcome based on defense line crossing

## Why This Demo Matters

The core idea is mathematical guidance, not graphics.

- Pure Pursuit is intuitive but can miss maneuvering targets.
- Proportional Navigation uses line-of-sight rate and closing velocity to improve intercept performance.

This lets you reproduce the exact behavior:

1. Straight + Pure Pursuit often succeeds.
2. Zigzag + Pure Pursuit can fail.
3. Zigzag + PN recovers interception reliability.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Controls

- Start Simulation: starts a fresh run and launches interceptors.
- Reset Zigzag: resets enemies to zigzag mode.
- Reset Straight: resets enemies to straight mode.
- Guidance Mode:
  - Pure Pursuit
  - PN

## Project Goal

Provide a compact, understandable sandbox for guidance-law behavior under target maneuvers, with visible trajectories and coordinate-level outcomes.

## Current Status

This is still an experimental test build. The current results are not good enough for production-level reliability.
