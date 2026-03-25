import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DroneModelProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

const DroneModel = ({ position, rotation }: DroneModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const propellerRefs = useRef<THREE.Mesh[]>([]);

  // Rotate propellers
  useFrame(() => {
    propellerRefs.current.forEach(propeller => {
      if (propeller) {
        propeller.rotation.y += 0.5;
      }
    });
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={0.5} />
      </mesh>

      {/* Arms */}
      {/* Front-left arm */}
      <mesh position={[0.4, 0, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#00d9ff" />
      </mesh>

      {/* Front-right arm */}
      <mesh position={[-0.4, 0, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#00d9ff" />
      </mesh>

      {/* Back-left arm */}
      <mesh position={[0.4, 0, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#00d9ff" />
      </mesh>

      {/* Back-right arm */}
      <mesh position={[-0.4, 0, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#00d9ff" />
      </mesh>

      {/* Propellers */}
      {[
        [0.4, 0.3, 0.4],
        [-0.4, 0.3, 0.4],
        [0.4, 0.3, -0.4],
        [-0.4, 0.3, -0.4],
      ].map((pos, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) propellerRefs.current[index] = el;
          }}
          position={pos as [number, number, number]}
        >
          <boxGeometry args={[0.4, 0.02, 0.08]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.6}
            emissive="#00ff41"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* LED lights */}
      <pointLight position={[0, 0, 0]} intensity={1} color="#00ff41" distance={5} />
    </group>
  );
};

export default DroneModel;
