"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Torus, Sphere } from "@react-three/drei";
import * as THREE from "three";

// ─── escudo heráldico (centro da cena) ────────────────────────────────────────

function Shield() {
  const shieldRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!shieldRef.current) return;
    shieldRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.25;
    shieldRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.06;
  });

  return (
    <group ref={shieldRef}>
      {/* corpo principal do escudo */}
      <mesh position={[0, 0, 0]} castShadow>
        <extrudeGeometry args={[shieldShape(), { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.03 }]} />
        <meshStandardMaterial color="#1a1400" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* superfície dourada (frente) */}
      <mesh position={[0, 0, 0.07]}>
        <extrudeGeometry args={[shieldShapeInner(), { depth: 0.02, bevelEnabled: false }]} />
        <meshStandardMaterial color="#C9A84C" metalness={0.95} roughness={0.1} envMapIntensity={2} />
      </mesh>

      {/* linha divisória horizontal */}
      <mesh position={[0, -0.02, 0.1]}>
        <boxGeometry args={[1.1, 0.03, 0.04]} />
        <meshStandardMaterial color="#F5E6C8" metalness={1} roughness={0.05} />
      </mesh>

      {/* linha divisória vertical */}
      <mesh position={[0, 0.28, 0.1]}>
        <boxGeometry args={[0.03, 1.1, 0.04]} />
        <meshStandardMaterial color="#F5E6C8" metalness={1} roughness={0.05} />
      </mesh>

      {/* quadrante sup-esq — flor de lis */}
      <FleurDeLis position={[-0.28, 0.35, 0.14]} scale={0.22} color="#C9A84C" />

      {/* quadrante sup-dir — roda */}
      <Wheel position={[0.28, 0.35, 0.14]} radius={0.2} color="#0A0A0A" bgColor="#C9A84C" />

      {/* quadrante inf-esq — roda */}
      <Wheel position={[-0.28, -0.18, 0.14]} radius={0.2} color="#0A0A0A" bgColor="#C9A84C" />

      {/* quadrante inf-dir — flor de lis */}
      <FleurDeLis position={[0.28, -0.18, 0.14]} scale={0.22} color="#C9A84C" />

      {/* borda dourada do escudo */}
      <mesh position={[0, 0, -0.01]}>
        <extrudeGeometry args={[shieldBorder(), { depth: 0.14, bevelEnabled: false }]} />
        <meshStandardMaterial color="#A07D30" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* elmo no topo */}
      <Helmet position={[0, 1.15, 0]} />

      {/* pergaminho embaixo */}
      <Banner position={[0, -1.05, 0.05]} />

      {/* folhagens douradas — esquerda e direita */}
      <Foliage position={[-0.85, 0.3, 0]} side="left" />
      <Foliage position={[0.85, 0.3, 0]} side="right" />

      {/* borlas */}
      <Tassel position={[-0.7, -0.65, 0]} />
      <Tassel position={[0.7, -0.65, 0]} />
    </group>
  );
}

// ─── formas do escudo ─────────────────────────────────────────────────────────

function shieldShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.55, 0.75);
  shape.lineTo(0.55, 0.75);
  shape.lineTo(0.55, -0.45);
  shape.quadraticCurveTo(0.55, -0.9, 0, -1.05);
  shape.quadraticCurveTo(-0.55, -0.9, -0.55, -0.45);
  shape.closePath();
  return shape;
}

function shieldShapeInner() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.51, 0.72);
  shape.lineTo(0.51, 0.72);
  shape.lineTo(0.51, -0.43);
  shape.quadraticCurveTo(0.51, -0.86, 0, -1.0);
  shape.quadraticCurveTo(-0.51, -0.86, -0.51, -0.43);
  shape.closePath();
  return shape;
}

function shieldBorder() {
  const outer = shieldShape();
  const inner = shieldShapeInner();
  outer.holes.push(inner as unknown as THREE.Path);
  return outer;
}

// ─── flor de lis ─────────────────────────────────────────────────────────────

function FleurDeLis({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  return (
    <group position={position} scale={scale}>
      {/* pétala central */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.25, 1.2, 6]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* base */}
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.25, 0.08, 6, 16]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* pétalas laterais */}
      <mesh position={[-0.25, 0.1, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.08, 0.15, 0.6, 5]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.25, 0.1, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.08, 0.15, 0.6, 5]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─── roda ─────────────────────────────────────────────────────────────────────

function Wheel({ position, radius, color, bgColor }: { position: [number, number, number]; radius: number; color: string; bgColor: string }) {
  const spokes = 8;
  return (
    <group position={position}>
      {/* fundo */}
      <mesh>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color={bgColor} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* aro */}
      <mesh>
        <torusGeometry args={[radius, 0.025, 6, 32]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.1} />
      </mesh>
      {/* centro */}
      <mesh>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.05} />
      </mesh>
      {/* raios */}
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (i / spokes) * Math.PI * 2;
        return (
          <mesh key={i} rotation={[0, 0, angle]} position={[Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5, 0.002]}>
            <boxGeometry args={[0.018, radius, 0.01]} />
            <meshStandardMaterial color={color} metalness={0.95} roughness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── elmo ─────────────────────────────────────────────────────────────────────

function Helmet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* casco */}
      <mesh>
        <capsuleGeometry args={[0.22, 0.3, 8, 16]} />
        <meshStandardMaterial color="#5A5A5A" metalness={0.95} roughness={0.15} envMapIntensity={2} />
      </mesh>
      {/* viseira */}
      <mesh position={[0, -0.1, 0.18]}>
        <boxGeometry args={[0.36, 0.18, 0.06]} />
        <meshStandardMaterial color="#4A4A4A" metalness={0.98} roughness={0.08} />
      </mesh>
      {/* fendas da viseira */}
      {[-0.06, 0, 0.06].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0.22]}>
          <boxGeometry args={[0.04, 0.03, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.8} />
        </mesh>
      ))}
      {/* penacho (cabelo) */}
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.18, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <MeshDistortMaterial color="#D4A843" distort={0.3} speed={2} roughness={0.8} />
      </mesh>
      {/* guarda pescoço */}
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.14, 8]} />
        <meshStandardMaterial color="#505050" metalness={0.92} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─── banner / pergaminho ──────────────────────────────────────────────────────

function Banner({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.3, 0.22, 0.04]} />
        <meshStandardMaterial color="#F5E6C8" metalness={0.1} roughness={0.7} />
      </mesh>
      {/* enrolamentos */}
      <mesh position={[-0.68, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.22, 8]} />
        <meshStandardMaterial color="#E8D4A8" metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[0.68, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.22, 8]} />
        <meshStandardMaterial color="#E8D4A8" metalness={0.1} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── folhagem ─────────────────────────────────────────────────────────────────

function Foliage({ position, side }: { position: [number, number, number]; side: "left" | "right" }) {
  const dir = side === "left" ? -1 : 1;
  return (
    <group position={position}>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[dir * i * 0.12, Math.sin(i * 0.8) * 0.18, -0.05 * i]}
          rotation={[0.2 * i, dir * 0.3 * i, dir * (0.3 + i * 0.25)]}
        >
          <torusGeometry args={[0.14 + i * 0.04, 0.035, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#C9A84C" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ─── borla ────────────────────────────────────────────────────────────────────

function Tassel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#8A8A8A" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.09, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        <meshStandardMaterial color="#C9A84C" metalness={0.9} roughness={0.15} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.03, -0.12 - Math.random() * 0.08, Math.sin((i / 8) * Math.PI * 2) * 0.03]}>
          <boxGeometry args={[0.012, 0.14, 0.012]} />
          <meshStandardMaterial color="#C9A84C" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── partículas de ouro ───────────────────────────────────────────────────────

function GoldParticles() {
  const count = 80;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null!);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#C9A84C" size={0.022} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

// ─── cena completa ────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} color="#0a0500" />
      <directionalLight position={[3, 6, 4]} intensity={3} color="#C9A84C" castShadow />
      <directionalLight position={[-4, 3, -2]} intensity={1.5} color="#F5E6C8" />
      <pointLight position={[0, 4, 3]} intensity={4} color="#C9A84C" distance={10} />
      <pointLight position={[0, -2, 2]} intensity={1.5} color="#8A8A8A" distance={6} />
      <spotLight position={[0, 8, 0]} intensity={5} color="#C9A84C" angle={0.3} penumbra={0.8} castShadow />

      <GoldParticles />

      <Float speed={1.0} rotationIntensity={0.08} floatIntensity={0.35}>
        <Shield />
      </Float>
    </>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export default function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.2, 4.5], fov: 40 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
        shadows
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
