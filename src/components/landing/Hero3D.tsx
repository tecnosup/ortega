"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// ─── materiais ────────────────────────────────────────────────────────────────

const SILVER = { color: "#B0B8C8", metalness: 0.97, roughness: 0.08, envMapIntensity: 2.5 };
const SILVER_DARK = { color: "#70787E", metalness: 0.96, roughness: 0.18 };
const SILVER_EDGE = { color: "#D8E0EC", metalness: 1, roughness: 0.04 };
const GOLD = { color: "#C9A84C", metalness: 0.98, roughness: 0.06 };
const DARK_VISOR = { color: "#0A0A12", metalness: 0.4, roughness: 0.3 };
const ORANGE_CAPE = { color: "#D4601A", metalness: 0.0, roughness: 0.9 };
const ORANGE_CAPE_INNER = { color: "#A03010", metalness: 0.0, roughness: 0.95 };

// ─── elmo ─────────────────────────────────────────────────────────────────────

function Helmet() {
  return (
    <group position={[0, 1.55, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.46, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0, -0.28, -0.05]} castShadow>
        <capsuleGeometry args={[0.42, 0.35, 10, 18]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
      <mesh position={[0, -0.02, 0.38]} castShadow>
        <boxGeometry args={[0.72, 0.15, 0.12]} />
        <meshStandardMaterial {...DARK_VISOR} />
      </mesh>
      {[-0.26, -0.5, -0.74].map((y, i) => (
        <mesh key={i} position={[0, y * 0.05 + 0.02, 0.43]}>
          <boxGeometry args={[0.6, 0.035, 0.04]} />
          <meshStandardMaterial color="#000008" />
        </mesh>
      ))}
      <mesh position={[0, -0.1, 0.42]}>
        <boxGeometry args={[0.06, 0.22, 0.05]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
      <mesh position={[-0.44, -0.3, 0.15]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.18, 0.28, 0.32]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0.44, -0.3, 0.15]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.18, 0.28, 0.32]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[0.15, 0, 0]}>
        <capsuleGeometry args={[0.055, 0.55, 6, 10]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, 0.72, 0.04]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <torusGeometry args={[0.44, 0.03, 8, 30]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
    </group>
  );
}

// ─── torso ────────────────────────────────────────────────────────────────────

function Torso() {
  return (
    <group position={[0, 0.6, 0]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.42, 0.55, 10, 20]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0, 0.08, 0.35]}>
        <boxGeometry args={[0.68, 0.62, 0.1]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0, 0.08, 0.41]}>
        <boxGeometry args={[0.04, 0.6, 0.03]} />
        <meshStandardMaterial {...SILVER_EDGE} />
      </mesh>
      <mesh position={[-0.58, 0.42, 0]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.22, 0.28, 8, 14]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[-0.58, 0.28, 0.08]} rotation={[0.2, 0, -0.3]}>
        <capsuleGeometry args={[0.19, 0.18, 6, 12]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
      <mesh position={[0.58, 0.42, 0]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.22, 0.28, 8, 14]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0.58, 0.28, 0.08]} rotation={[0.2, 0, 0.3]}>
        <capsuleGeometry args={[0.19, 0.18, 6, 12]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
      {[-0.12, 0, 0.12].map((x, i) => (
        <mesh key={i} position={[x, -0.28, 0.34]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.2, 0.14, 0.06]} />
          <meshStandardMaterial {...SILVER_DARK} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0.42]}>
        <torusGeometry args={[0.1, 0.025, 6, 20]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, 0.22, 0.44]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
    </group>
  );
}

// ─── braços ───────────────────────────────────────────────────────────────────

function Arm({ side }: { side: "left" | "right" }) {
  const d = side === "left" ? -1 : 1;
  const rot = side === "left" ? 0.25 : -0.25;
  return (
    <group position={[d * 0.7, 0.42, 0.05]} rotation={[0.1, 0, rot]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.16, 0.42, 8, 14]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0, -0.34, 0.06]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
      <mesh position={[d * 0.08, -0.7, 0.06]} rotation={[0.15, 0, d * 0.15]}>
        <capsuleGeometry args={[0.13, 0.38, 8, 12]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[d * 0.14, -1.06, 0.1]} rotation={[0.1, 0, d * 0.2]}>
        <boxGeometry args={[0.2, 0.28, 0.18]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
    </group>
  );
}

// ─── pernas ───────────────────────────────────────────────────────────────────

function Leg({ side }: { side: "left" | "right" }) {
  const d = side === "left" ? -1 : 1;
  return (
    <group position={[d * 0.22, -0.45, 0]} rotation={[0, 0, d * 0.08]}>
      <mesh position={[0, -0.05, 0.08]}>
        <capsuleGeometry args={[0.22, 0.28, 8, 14]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0, -0.44, 0.12]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
      <mesh position={[0, -0.76, 0.06]} rotation={[0.12, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.36, 8, 12]} />
        <meshStandardMaterial {...SILVER} />
      </mesh>
      <mesh position={[0, -1.1, 0.1]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.26, 0.18, 0.38]} />
        <meshStandardMaterial {...SILVER_DARK} />
      </mesh>
    </group>
  );
}

// ─── capa ─────────────────────────────────────────────────────────────────────

function Cape() {
  const capeGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.6, 0);
    shape.bezierCurveTo(-0.9, -0.5, -1.1, -1.4, -0.85, -2.4);
    shape.bezierCurveTo(-0.72, -3.0, -0.4, -3.4, 0, -3.5);
    shape.bezierCurveTo(0.4, -3.4, 0.72, -3.0, 0.85, -2.4);
    shape.bezierCurveTo(1.1, -1.4, 0.9, -0.5, 0.6, 0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape, 20);
  }, []);

  const capeRef = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (!capeRef.current) return;
    const t = s.clock.elapsedTime;
    capeRef.current.rotation.z = Math.sin(t * 0.7) * 0.04;
    capeRef.current.rotation.x = Math.sin(t * 0.5) * 0.03;
  });

  return (
    <group ref={capeRef} position={[-0.02, 0.92, -0.38]}>
      <mesh>
        <primitive object={capeGeo} />
        <meshStandardMaterial {...ORANGE_CAPE} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.12, -0.5, 0.02]} rotation={[0.1, 0.05, 0.1]}>
        <planeGeometry args={[0.55, 1.8, 2, 6]} />
        <meshStandardMaterial {...ORANGE_CAPE_INNER} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.04, 0.01]}>
        <torusGeometry args={[0.64, 0.025, 6, 30, Math.PI]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
    </group>
  );
}

// ─── partículas cósmicas ──────────────────────────────────────────────────────

function CosmicParticles() {
  const count = 180;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 7 - 2;
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null!);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.018;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#E8D5A3" size={0.025} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// ─── cavaleiro — rotação contínua em loop ─────────────────────────────────────

function Knight() {
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // rotação contínua, ~20 segundos por volta completa
    ref.current.rotation.y += delta * 0.32;
  });

  return (
    <group ref={ref} position={[0, 0.4, 0]}>
      <Cape />
      <Helmet />
      <Torso />
      <Arm side="left" />
      <Arm side="right" />
      <Leg side="left" />
      <Leg side="right" />
    </group>
  );
}

// ─── cena ─────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ambientLight intensity={0.08} color="#1a2035" />
      <directionalLight position={[5, 4, 3]} intensity={5} color="#D0E0FF" castShadow />
      <directionalLight position={[-3, 1, -2]} intensity={2.2} color="#E06820" />
      <directionalLight position={[0, 6, 2]} intensity={1.4} color="#B0C8E8" />
      <directionalLight position={[0, -2, -5]} intensity={1.0} color="#D4601A" />
      <pointLight position={[2, 2, 5]} intensity={6} color="#C8D8F0" distance={14} decay={2} />
      <pointLight position={[-1.5, 0, 2]} intensity={3} color="#D05010" distance={8} decay={2} />

      <CosmicParticles />

      <Float speed={0.8} rotationIntensity={0} floatIntensity={0.5}>
        <Knight />
      </Float>
    </>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export default function Hero3D() {
  return (
    <div className="w-full h-full" style={{ pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0.5, 6.5], fov: 44 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.8,
        }}
        shadows
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
