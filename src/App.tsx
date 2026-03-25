import { useEffect, useMemo, useRef, useState } from 'react';

interface Vector2 {
  x: number;
  y: number;
}

interface EnemyDrone {
  id: number;
  position: Vector2;
  velocity: Vector2;
  baseY: number;
  phase: number;
  active: boolean;
}

interface Missile {
  id: number;
  targetId: number;
  position: Vector2;
  velocity: Vector2;
  speed: number;
  active: boolean;
  launchedAt: number;
}

interface InterceptLog {
  id: number;
  targetId: number;
  launchedAt: number;
  launchCoord: Vector2;
  interceptCoord: Vector2 | null;
  result: 'PENDING' | 'HIT' | 'MISS';
  guidance: 'PURE_PURSUIT' | 'PROPORTIONAL_NAVIGATION';
}

type EnemyPattern = 'STRAIGHT' | 'ZIGZAG';
type GuidanceMode = 'PURE_PURSUIT' | 'PROPORTIONAL_NAVIGATION';
type SimulationStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';

const RADAR_WIDTH = 920;
const RADAR_HEIGHT = 560;
const DEFENSE_X = 110;
const BATTERY: Vector2 = { x: 60, y: RADAR_HEIGHT / 2 };

const MISSILE_SPEED = 230;
const MISSILE_TTL_MS = 9000;
const MISSILE_HIT_RADIUS = 13;
const NAVIGATION_CONSTANT = 3.8;

const FIXED_STEP = 1 / 120;
const MAX_ACCUMULATED_TIME = 0.12;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const distance2D = (a: Vector2, b: Vector2): number => Math.hypot(a.x - b.x, a.y - b.y);
const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;
const crossZ = (a: Vector2, b: Vector2): number => a.x * b.y - a.y * b.x;

const normalizeAngle = (angle: number): number => {
  let result = angle;
  while (result > Math.PI) result -= Math.PI * 2;
  while (result < -Math.PI) result += Math.PI * 2;
  return result;
};

const toUnit = (v: Vector2): Vector2 => {
  const len = Math.hypot(v.x, v.y);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

const scale = (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s });

const solveLeadDirection = (launch: Vector2, targetPos: Vector2, targetVel: Vector2, missileSpeed: number): Vector2 => {
  const r = { x: targetPos.x - launch.x, y: targetPos.y - launch.y };
  const a = dot(targetVel, targetVel) - missileSpeed * missileSpeed;
  const b = 2 * dot(r, targetVel);
  const c = dot(r, r);

  let t = -1;
  if (Math.abs(a) < 1e-6) {
    if (Math.abs(b) > 1e-6) {
      t = -c / b;
    }
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const root = Math.sqrt(disc);
      const t1 = (-b - root) / (2 * a);
      const t2 = (-b + root) / (2 * a);
      const candidates = [t1, t2].filter(value => value > 0);
      if (candidates.length > 0) {
        t = Math.min(...candidates);
      }
    }
  }

  if (t <= 0) {
    return toUnit(r);
  }

  const aimPoint = {
    x: targetPos.x + targetVel.x * t,
    y: targetPos.y + targetVel.y * t,
  };
  return toUnit({ x: aimPoint.x - launch.x, y: aimPoint.y - launch.y });
};

const generateEnemies = (): EnemyDrone[] => {
  const lanes = [120, 220, 320, 440];
  return lanes.map((lane, i) => ({
    id: i + 1,
    position: { x: RADAR_WIDTH - 45 - i * 32, y: lane },
    velocity: { x: -70, y: 0 },
    baseY: lane,
    phase: Math.random() * Math.PI * 2,
    active: true,
  }));
};

function App() {
  const [status, setStatus] = useState<SimulationStatus>('IDLE');
  const [enemyPattern, setEnemyPattern] = useState<EnemyPattern>('STRAIGHT');
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>('PURE_PURSUIT');
  const [enemies, setEnemies] = useState<EnemyDrone[]>(generateEnemies());
  const [missiles, setMissiles] = useState<Missile[]>([]);
  const [logs, setLogs] = useState<InterceptLog[]>([]);
  const [simTime, setSimTime] = useState(0);

  const missileCounterRef = useRef(1);
  const enemiesRef = useRef<EnemyDrone[]>(generateEnemies());
  const missilesRef = useRef<Missile[]>([]);
  const simTimeRef = useRef(0);
  const guidanceRef = useRef<GuidanceMode>('PURE_PURSUIT');

  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  const clearLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    runningRef.current = false;
    lastFrameRef.current = null;
    accumulatorRef.current = 0;
  };

  useEffect(() => {
    guidanceRef.current = guidanceMode;
  }, [guidanceMode]);

  const updateLog = (id: number, updater: (log: InterceptLog) => InterceptLog) => {
    setLogs(prev => prev.map(log => (log.id === id ? updater(log) : log)));
  };

  const launchMissileAt = (enemy: EnemyDrone) => {
    const missileId = missileCounterRef.current++;
    const now = performance.now();
    const direction = solveLeadDirection(BATTERY, enemy.position, enemy.velocity, MISSILE_SPEED);

    const missile: Missile = {
      id: missileId,
      targetId: enemy.id,
      position: { ...BATTERY },
      velocity: scale(direction, MISSILE_SPEED),
      speed: MISSILE_SPEED,
      active: true,
      launchedAt: now,
    };

    setMissiles(prev => {
      const next = [...prev, missile];
      missilesRef.current = next;
      return next;
    });

    const newLog: InterceptLog = {
      id: missileId,
      targetId: enemy.id,
      launchedAt: Date.now(),
      launchCoord: { ...BATTERY },
      interceptCoord: null,
      result: 'PENDING',
      guidance: guidanceRef.current,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 24));
  };

  const resetSimulation = (nextPattern: EnemyPattern) => {
    clearLoop();
    setStatus('IDLE');
    setEnemyPattern(nextPattern);
    const nextEnemies = generateEnemies();
    enemiesRef.current = nextEnemies;
    setEnemies(nextEnemies);
    missilesRef.current = [];
    setMissiles([]);
    setLogs([]);
    simTimeRef.current = 0;
    setSimTime(0);
    missileCounterRef.current = 1;
  };

  const startSimulation = () => {
    clearLoop();
    setStatus('RUNNING');
    const nextEnemies = generateEnemies();
    enemiesRef.current = nextEnemies;
    setEnemies(nextEnemies);
    missilesRef.current = [];
    setMissiles([]);
    setLogs([]);
    simTimeRef.current = 0;
    setSimTime(0);
    missileCounterRef.current = 1;
    nextEnemies.forEach(enemy => launchMissileAt(enemy));
    runningRef.current = true;
  };

  const integrationStep = (delta: number) => {
    const now = performance.now();
    simTimeRef.current += delta;

    const updatedEnemies = enemiesRef.current.map(enemy => {
      if (!enemy.active) return enemy;

      const x = enemy.position.x + enemy.velocity.x * delta;
      if (enemyPattern === 'ZIGZAG') {
        const amp = 82;
        const omega = 2.65;
        const y = enemy.baseY + amp * Math.sin(omega * simTimeRef.current + enemy.phase);
        const vy = amp * omega * Math.cos(omega * simTimeRef.current + enemy.phase);
        return {
          ...enemy,
          position: { x, y },
          velocity: { x: enemy.velocity.x, y: vy },
        };
      }

      return {
        ...enemy,
        position: { x, y: enemy.position.y },
        velocity: { x: enemy.velocity.x, y: 0 },
      };
    });

    const updatedMissiles = missilesRef.current.map(missile => {
      if (!missile.active) return missile;

      const target = updatedEnemies.find(enemy => enemy.id === missile.targetId && enemy.active);
      if (!target) {
        return { ...missile, active: false };
      }

      const relPos = {
        x: target.position.x - missile.position.x,
        y: target.position.y - missile.position.y,
      };
      const relVel = {
        x: target.velocity.x - missile.velocity.x,
        y: target.velocity.y - missile.velocity.y,
      };

      const speed = missile.speed;
      const heading = Math.atan2(missile.velocity.y, missile.velocity.x);
      let nextHeading = heading;

      if (guidanceRef.current === 'PURE_PURSUIT') {
        const desiredHeading = Math.atan2(relPos.y, relPos.x);
        const headingErr = normalizeAngle(desiredHeading - heading);
        const maxTurnRate = 1.2;
        nextHeading = heading + clamp(headingErr, -maxTurnRate * delta, maxTurnRate * delta);
      } else {
        const r2 = relPos.x * relPos.x + relPos.y * relPos.y;
        const losRate = r2 > 1e-3 ? crossZ(relPos, relVel) / r2 : 0;
        const closingVel = r2 > 1e-3 ? -dot(relPos, relVel) / Math.sqrt(r2) : 0;
        const lateralAccel = NAVIGATION_CONSTANT * closingVel * losRate;
        const turnRate = clamp(lateralAccel / Math.max(speed, 1), -5.2, 5.2);
        nextHeading = heading + turnRate * delta;
      }

      const nextVelocity = {
        x: Math.cos(nextHeading) * speed,
        y: Math.sin(nextHeading) * speed,
      };
      const nextPosition = {
        x: missile.position.x + nextVelocity.x * delta,
        y: missile.position.y + nextVelocity.y * delta,
      };

      const expired = now - missile.launchedAt > MISSILE_TTL_MS;
      if (expired) {
        updateLog(missile.id, log => (
          log.result === 'PENDING' ? { ...log, result: 'MISS', interceptCoord: nextPosition } : log
        ));
        return {
          ...missile,
          active: false,
          position: nextPosition,
          velocity: nextVelocity,
        };
      }

      return {
        ...missile,
        position: nextPosition,
        velocity: nextVelocity,
      };
    });

    const resolvedEnemies = [...updatedEnemies];
    const resolvedMissiles = updatedMissiles.map(missile => {
      if (!missile.active) return missile;
      const targetIndex = resolvedEnemies.findIndex(enemy => enemy.id === missile.targetId && enemy.active);
      if (targetIndex === -1) {
        return { ...missile, active: false };
      }

      const target = resolvedEnemies[targetIndex];
      if (distance2D(missile.position, target.position) > MISSILE_HIT_RADIUS) {
        return missile;
      }

      resolvedEnemies[targetIndex] = {
        ...target,
        active: false,
      };
      updateLog(missile.id, log => (
        log.result === 'PENDING' ? { ...log, result: 'HIT', interceptCoord: target.position } : log
      ));
      return { ...missile, active: false };
    });

    const anyEnemyReachedDefense = resolvedEnemies.some(enemy => enemy.active && enemy.position.x <= DEFENSE_X);
    const allEnemiesNeutralized = resolvedEnemies.every(enemy => !enemy.active);

    if (anyEnemyReachedDefense) {
      setStatus('FAILED');
      clearLoop();
      setLogs(prev => prev.map(log => (
        log.result === 'PENDING' ? { ...log, result: 'MISS' as const } : log
      )));
    } else if (allEnemiesNeutralized) {
      setStatus('SUCCESS');
      clearLoop();
    }

    enemiesRef.current = resolvedEnemies;
    missilesRef.current = resolvedMissiles;
  };

  useEffect(() => {
    if (!runningRef.current || status !== 'RUNNING') return;

    const tick = (time: number) => {
      if (!runningRef.current) return;

      const previous = lastFrameRef.current ?? time;
      const elapsed = clamp((time - previous) / 1000, 0, MAX_ACCUMULATED_TIME);
      lastFrameRef.current = time;
      accumulatorRef.current += elapsed;

      while (accumulatorRef.current >= FIXED_STEP) {
        integrationStep(FIXED_STEP);
        accumulatorRef.current -= FIXED_STEP;
      }

      setSimTime(simTimeRef.current);
      setEnemies([...enemiesRef.current]);
      setMissiles([...missilesRef.current]);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => clearLoop();
  }, [status, enemyPattern]);

  useEffect(() => () => clearLoop(), []);

  const activeEnemyCount = useMemo(() => enemies.filter(enemy => enemy.active).length, [enemies]);
  const activeMissileCount = useMemo(() => missiles.filter(missile => missile.active).length, [missiles]);

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-green p-3 md:p-5 overflow-y-auto">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_370px] gap-4">
        <section className="bg-cyber-darker/90 border border-cyber-green/25 rounded-xl p-3 md:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold font-mono">2D Radar Intercept Simulator</h1>
              <p className="text-cyber-green/75 text-sm font-mono">Math-guided missile interception against straight and zigzag targets.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="px-3 py-2 text-sm rounded border border-cyber-cyan text-cyber-cyan bg-cyber-cyan/15 hover:bg-cyber-cyan/25 disabled:opacity-50"
                onClick={startSimulation}
                disabled={status === 'RUNNING'}
              >
                Start Simulation
              </button>
              <button
                className="px-3 py-2 text-sm rounded border border-cyber-warning text-cyber-warning bg-cyber-warning/15 hover:bg-cyber-warning/25"
                onClick={() => resetSimulation('ZIGZAG')}
              >
                Reset Zigzag
              </button>
              <button
                className="px-3 py-2 text-sm rounded border border-cyber-green text-cyber-green bg-cyber-green/15 hover:bg-cyber-green/25"
                onClick={() => resetSimulation('STRAIGHT')}
              >
                Reset Straight
              </button>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-cyber-green/80">Guidance:</span>
              <button
                className={`px-3 py-1 rounded border ${guidanceMode === 'PURE_PURSUIT' ? 'border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan' : 'border-cyber-green/40 text-cyber-green/80'}`}
                onClick={() => setGuidanceMode('PURE_PURSUIT')}
              >
                Pure Pursuit
              </button>
              <button
                className={`px-3 py-1 rounded border ${guidanceMode === 'PROPORTIONAL_NAVIGATION' ? 'border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan' : 'border-cyber-green/40 text-cyber-green/80'}`}
                onClick={() => setGuidanceMode('PROPORTIONAL_NAVIGATION')}
              >
                PN
              </button>
            </div>
            <div className="flex items-center gap-4 text-cyber-green/80">
              <span>Pattern: {enemyPattern}</span>
              <span className={status === 'SUCCESS' ? 'text-cyber-green' : status === 'FAILED' ? 'text-cyber-danger' : 'text-cyber-cyan'}>
                Status: {status}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-cyber-green/30 bg-[#081019] overflow-auto">
            <svg viewBox={`0 0 ${RADAR_WIDTH} ${RADAR_HEIGHT}`} className="w-full min-w-[760px] h-auto aspect-[23/14]">
              <rect x="0" y="0" width={RADAR_WIDTH} height={RADAR_HEIGHT} fill="#081019" />

              {[1, 2, 3, 4].map(r => (
                <circle key={r} cx={BATTERY.x} cy={BATTERY.y} r={r * 112} fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="1" />
              ))}

              {[...Array(10)].map((_, i) => (
                <line key={`v-${i}`} x1={(i * RADAR_WIDTH) / 9} y1={0} x2={(i * RADAR_WIDTH) / 9} y2={RADAR_HEIGHT} stroke="rgba(0,255,65,0.08)" />
              ))}
              {[...Array(8)].map((_, i) => (
                <line key={`h-${i}`} x1={0} y1={(i * RADAR_HEIGHT) / 7} x2={RADAR_WIDTH} y2={(i * RADAR_HEIGHT) / 7} stroke="rgba(0,255,65,0.08)" />
              ))}

              <line x1={DEFENSE_X} y1={0} x2={DEFENSE_X} y2={RADAR_HEIGHT} stroke="#ffaa00" strokeWidth="2" />

              <circle cx={BATTERY.x} cy={BATTERY.y} r="10" fill="#00ff41" />
              <text x={BATTERY.x + 16} y={BATTERY.y + 4} fill="#00ff41" fontSize="12" fontFamily="monospace">
                Defense Battery
              </text>

              {enemies.filter(enemy => enemy.active).map(enemy => (
                <g key={`enemy-${enemy.id}`}>
                  <polygon points={`${enemy.position.x},${enemy.position.y - 10} ${enemy.position.x + 12},${enemy.position.y} ${enemy.position.x},${enemy.position.y + 10}`} fill="#ff6b35" />
                  <text x={enemy.position.x + 14} y={enemy.position.y + 4} fill="#ff6b35" fontSize="11" fontFamily="monospace">E{enemy.id}</text>
                </g>
              ))}

              {missiles.filter(missile => missile.active).map(missile => (
                <g key={`missile-${missile.id}`}>
                  <circle cx={missile.position.x} cy={missile.position.y} r="5" fill="#00d9ff" />
                  <circle cx={missile.position.x} cy={missile.position.y} r="9" fill="none" stroke="#00d9ff" strokeOpacity="0.35" />
                </g>
              ))}
            </svg>
          </div>
        </section>

        <aside className="bg-cyber-darker/90 border border-cyber-green/25 rounded-xl p-4 flex flex-col gap-3 xl:max-h-[88vh]">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-cyber-dark border border-cyber-green/25 rounded p-2">
              <div className="text-cyber-green/75">Simulation Time</div>
              <div className="text-cyber-cyan">{simTime.toFixed(2)} s</div>
            </div>
            <div className="bg-cyber-dark border border-cyber-green/25 rounded p-2">
              <div className="text-cyber-green/75">Status</div>
              <div className="text-cyber-cyan">{status}</div>
            </div>
            <div className="bg-cyber-dark border border-cyber-green/25 rounded p-2">
              <div className="text-cyber-green/75">Active Enemies</div>
              <div className="text-cyber-cyan">{activeEnemyCount}</div>
            </div>
            <div className="bg-cyber-dark border border-cyber-green/25 rounded p-2">
              <div className="text-cyber-green/75">Active Missiles</div>
              <div className="text-cyber-cyan">{activeMissileCount}</div>
            </div>
          </div>

          <div className="text-xs font-mono text-cyber-green/80 bg-cyber-dark border border-cyber-green/25 rounded p-3 space-y-1">
            <div>Legend:</div>
            <div>Green dot = battery, orange triangles = enemy drones, cyan dots = interceptors.</div>
            <div>Zigzag + Pure Pursuit can fail. Zigzag + PN should recover interception.</div>
          </div>

          <div className="min-h-0 flex-1 max-h-[48vh] xl:max-h-none overflow-y-auto bg-cyber-dark border border-cyber-green/25 rounded p-3">
            <div className="text-cyber-cyan font-mono text-sm mb-2">Intercept Coordinate Log</div>
            {logs.length === 0 && <div className="text-cyber-green/70 text-sm font-mono">No events yet.</div>}
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="text-xs font-mono border border-cyber-green/20 rounded p-2 bg-black/35">
                  <div className="flex justify-between text-cyber-green/80">
                    <span>T-{log.targetId}</span>
                    <span className={log.result === 'HIT' ? 'text-cyber-green' : log.result === 'MISS' ? 'text-cyber-danger' : 'text-cyber-warning'}>{log.result}</span>
                  </div>
                  <div className="text-cyber-cyan">Guidance: {log.guidance}</div>
                  <div className="text-cyber-cyan">Launch: ({log.launchCoord.x.toFixed(1)}, {log.launchCoord.y.toFixed(1)})</div>
                  <div className="text-cyber-cyan">
                    Intercept: {log.interceptCoord ? `(${log.interceptCoord.x.toFixed(1)}, ${log.interceptCoord.y.toFixed(1)})` : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
