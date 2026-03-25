import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import DroneModel from './DroneModel';
import { DroneState, Vector3 } from '../../types';

interface SceneProps {
  droneState: DroneState;
  targets: Array<{ id: number; position: Vector3; active: boolean }>;
  missiles?: Array<{ id: number; position: Vector3 }>;
  explosions?: Array<{ id: number; position: Vector3; age: number }>;
  interceptPoints?: Vector3[];
}

const Scene = ({
  droneState,
  targets,
  missiles = [],
  explosions = [],
  interceptPoints = [],
}: SceneProps) => {
  const { telemetry } = droneState;

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00d9ff" />

        {/* Drone */}
        <DroneModel
          position={[
            telemetry.position.x,
            telemetry.position.y,
            telemetry.position.z,
          ]}
          rotation={[
            telemetry.rotation.x,
            telemetry.rotation.y,
            telemetry.rotation.z,
          ]}
        />

        {/* Incoming target drones */}
        {targets.filter(target => target.active).map(target => (
          <group key={target.id} position={[target.position.x, target.position.y, target.position.z]}>
            <mesh>
              <sphereGeometry args={[0.45, 20, 20]} />
              <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.7} />
            </mesh>
            <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.75, 24]} />
              <meshBasicMaterial color="#ff6b35" transparent opacity={0.7} />
            </mesh>
          </group>
        ))}

        {/* Active missiles */}
        {missiles.map(missile => (
          <group key={missile.id} position={[missile.position.x, missile.position.y, missile.position.z]}>
            <mesh>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#00d9ff" emissive="#00d9ff" emissiveIntensity={1} />
            </mesh>
          </group>
        ))}

        {/* Explosion visual effects */}
        {explosions.map(explosion => {
          const size = 0.6 + explosion.age * 1.8;
          const alpha = Math.max(0, 1 - explosion.age);
          return (
            <group key={`exp-${explosion.id}`} position={[explosion.position.x, explosion.position.y, explosion.position.z]}>
              <mesh scale={[size, size, size]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial color="#ffaa00" transparent opacity={alpha * 0.8} />
              </mesh>
              <mesh scale={[size * 1.4, size * 1.4, size * 1.4]}>
                <sphereGeometry args={[0.28, 12, 12]} />
                <meshBasicMaterial color="#ff6b35" transparent opacity={alpha * 0.65} />
              </mesh>
            </group>
          );
        })}

        {/* Intercept markers */}
        {interceptPoints.map((point, index) => (
          <group key={`${point.x}-${point.y}-${point.z}-${index}`} position={[point.x, point.y, point.z]}>
            <mesh>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ff6b35" emissiveIntensity={0.8} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]}>
              <ringGeometry args={[0.22, 0.35, 24]} />
              <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
            </mesh>
          </group>
        ))}

        {/* Grid */}
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#00ff41"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#00d9ff"
          fadeDistance={30}
          fadeStrength={1}
          infiniteGrid
        />

        {/* Environment */}
        <Environment preset="night" />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />

        {/* Fog for atmosphere */}
        <fog attach="fog" args={['#0a0e1a', 10, 100]} />
      </Canvas>
    </div>
  );
};

export default Scene;
