"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// ─── escudo principal ─────────────────────────────────────────────────────────

function shieldShape() {
  const s = new THREE.Shape();
  s.moveTo(-1.1, 1.4);
  s.lineTo(1.1, 1.4);
  s.lineTo(1.1, -0.6);
  s.bezierCurveTo(1.1, -1.8, 0.4, -2.4, 0, -2.6);
  s.bezierCurveTo(-0.4, -2.4, -1.1, -1.8, -1.1, -0.6);
  s.closePath();
  return s;
}

function shieldInner() {
  const s = new THREE.Shape();
  s.moveTo(-0.98, 1.28);
  s.lineTo(0.98, 1.28);
  s.lineTo(0.98, -0.55);
  s.bezierCurveTo(0.98, -1.7, 0.35, -2.25, 0, -2.45);
  s.bezierCurveTo(-0.35, -2.25, -0.98, -1.7, -0.98, -0.55);
  s.closePath();
  return s;
}

function Shield() {
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.18;
  });

  const extOpts = { depth: 0.18, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04, bevelSegments: 3 };
  const flatOpts = { depth: 0.02, bevelEnabled: false };

  return (
    <group ref={ref} position={[0, 0.3, 0]}>

      {/* corpo do escudo — preto fosco com bevel */}
      <mesh castShadow>
        <extrudeGeometry args={[shieldShape(), extOpts]} />
        <meshStandardMaterial color="#0f0f0f" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* face frontal dourada fina */}
      <mesh position={[0, 0, 0.19]}>
        <extrudeGeometry args={[shieldInner(), flatOpts]} />
        <meshStandardMaterial color="#C9A84C" metalness={0.95} roughness={0.08} envMapIntensity={3} />
      </mesh>

      {/* borda — aro dourado */}
      <mesh position={[0, 0, -0.01]}>
        <extrudeGeometry args={[(() => {
          const outer = shieldShape();
          outer.holes.push(shieldInner() as unknown as THREE.Path);
          return outer;
        })(), { depth: 0.2, bevelEnabled: false }]} />
        <meshStandardMaterial color="#A07D30" metalness={0.98} roughness={0.05} />
      </mesh>

      {/* divisória horizontal */}
      <mesh position={[0, -0.59, 0.22]}>
        <boxGeometry args={[2.0, 0.06, 0.04]} />
        <meshStandardMaterial color="#F5E6C8" metalness={1} roughness={0.04} />
      </mesh>

      {/* divisória vertical */}
      <mesh position={[0, 0.35, 0.22]}>
        <boxGeometry args={[0.06, 1.9, 0.04]} />
        <meshStandardMaterial color="#F5E6C8" metalness={1} roughness={0.04} />
      </mesh>

      {/* flor de lis — sup esq */}
      <FleurDeLis position={[-0.55, 0.75, 0.22]} scale={0.28} />
      {/* roda — sup dir */}
      <Wheel position={[0.55, 0.75, 0.22]} r={0.32} />
      {/* roda — inf esq */}
      <Wheel position={[-0.55, -1.1, 0.22]} r={0.32} />
      {/* flor de lis — inf dir */}
      <FleurDeLis position={[0.55, -1.1, 0.22]} scale={0.28} />

      {/* elmo no topo */}
      <Helmet />

      {/* pergaminho */}
      <Scroll />

      {/* folhagens */}
      <Foliage side="left" />
      <Foliage side="right" />

      {/* borlas */}
      <Tassel position={[-1.3, -1.35, 0]} />
      <Tassel position={[1.3, -1.35, 0]} />
    </group>
  );
}

// ─── flor de lis ─────────────────────────────────────────────────────────────

function FleurDeLis({ position, scale }: { position: [number, number, number]; scale: number }) {
  const gold = <meshStandardMaterial color="#C9A84C" metalness={0.95} roughness={0.08} />;
  return (
    <group position={position} scale={scale}>
      {/* haste central */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.18, 1.6, 8]} />
        {gold}
      </mesh>
      {/* ponta */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        {gold}
      </mesh>
      {/* pétala esq */}
      <mesh position={[-0.28, 0.15, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        {gold}
      </mesh>
      {/* pétala dir */}
      <mesh position={[0.28, 0.15, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        {gold}
      </mesh>
      {/* base */}
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.22, 0.06, 6, 20]} />
        {gold}
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.3, 8]} />
        {gold}
      </mesh>
    </group>
  );
}

// ─── roda ─────────────────────────────────────────────────────────────────────

function Wheel({ position, r }: { position: [number, number, number]; r: number }) {
  const dark = <meshStandardMaterial color="#0f0f0f" metalness={0.3} roughness={0.7} />;
  const gold = <meshStandardMaterial color="#C9A84C" metalness={0.95} roughness={0.08} />;
  return (
    <group position={position}>
      {/* fundo */}
      <mesh>{/* circulo preto */}
        <circleGeometry args={[r, 32]} />
        {dark}
      </mesh>
      {/* aro */}
      <mesh position={[0, 0, 0.01]}>
        <torusGeometry args={[r, 0.04, 8, 32]} />
        {gold}
      </mesh>
      {/* cubo central */}
      <mesh position={[0, 0, 0.01]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 8]} />
        {gold}
      </mesh>
      {/* 8 raios */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 0.01]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.028, r, 0.02]} />
            {gold}
          </mesh>
        );
      })}
    </group>
  );
}

// ─── elmo ─────────────────────────────────────────────────────────────────────

function Helmet() {
  const silver = <meshStandardMaterial color="#6A6A6A" metalness={0.97} roughness={0.12} envMapIntensity={2} />;
  const darkSilver = <meshStandardMaterial color="#444" metalness={0.97} roughness={0.18} />;
  return (
    <group position={[0, 2.0, 0]}>
      {/* casco principal */}
      <mesh castShadow>
        <capsuleGeometry args={[0.42, 0.5, 10, 20]} />
        {silver}
      </mesh>
      {/* garda-pescoço */}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.5, 0.56, 0.3, 12]} />
        {silver}
      </mesh>
      {/* viseira — frente */}
      <mesh position={[0, -0.12, 0.38]}>
        <boxGeometry args={[0.7, 0.32, 0.1]} />
        {darkSilver}
      </mesh>
      {/* fendas da viseira */}
      {[-0.18, 0, 0.18].map((x, i) => (
        <mesh key={i} position={[x, -0.12, 0.45]}>
          <boxGeometry args={[0.09, 0.05, 0.04]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* penacho dourado */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.28, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#C9A84C" metalness={0.6} roughness={0.6} />
      </mesh>
      {/* detalhe topo */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.22, 8]} />
        <meshStandardMaterial color="#C9A84C" metalness={0.98} roughness={0.05} />
      </mesh>
    </group>
  );
}

// ─── pergaminho ───────────────────────────────────────────────────────────────

function Scroll() {
  const parch = <meshStandardMaterial color="#F0DFA8" metalness={0.05} roughness={0.8} />;
  return (
    <group position={[0, -2.95, 0.05]}>
      <mesh>
        <boxGeometry args={[2.5, 0.42, 0.06]} />
        {parch}
      </mesh>
      <mesh position={[-1.3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.42, 10]} />
        {parch}
      </mesh>
      <mesh position={[1.3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.42, 10]} />
        {parch}
      </mesh>
    </group>
  );
}

// ─── folhagem ─────────────────────────────────────────────────────────────────

function Foliage({ side }: { side: "left" | "right" }) {
  const d = side === "left" ? -1 : 1;
  const gold = <meshStandardMaterial color="#C9A84C" metalness={0.92} roughness={0.1} />;
  const arcs = [
    { y: 0.8, rx: 0.2, ry: -0.1 * d, rz: 0.5 * d, scale: 1.1 },
    { y: 0.2, rx: 0.3, ry: -0.15 * d, rz: 0.7 * d, scale: 1.0 },
    { y: -0.4, rx: 0.35, ry: -0.2 * d, rz: 0.9 * d, scale: 0.9 },
    { y: -1.0, rx: 0.25, ry: -0.15 * d, rz: 1.1 * d, scale: 0.75 },
  ];
  return (
    <group position={[d * 1.35, 0.2, -0.05]}>
      {arcs.map((a, i) => (
        <mesh key={i} position={[d * i * 0.1, a.y, 0]} rotation={[a.rx, a.ry, a.rz]} scale={a.scale}>
          <torusGeometry args={[0.38, 0.07, 5, 14, Math.PI * 1.1]} />
          {gold}
        </mesh>
      ))}
      {/* bolota */}
      <mesh position={[d * 0.22, -1.35, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        {gold}
      </mesh>
    </group>
  );
}

// ─── borla ────────────────────────────────────────────────────────────────────

function Tassel({ position }: { position: [number, number, number] }) {
  const gold = <meshStandardMaterial color="#C9A84C" metalness={0.9} roughness={0.15} />;
  const silver = <meshStandardMaterial color="#888" metalness={0.95} roughness={0.1} />;
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        {silver}
      </mesh>
      <mesh>
        <sphereGeometry args={[0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        {gold}
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.04, -0.18 - (i % 3) * 0.06, Math.sin(a) * 0.04]}>
            <boxGeometry args={[0.015, 0.18, 0.015]} />
            {gold}
          </mesh>
        );
      })}
    </group>
  );
}

// ─── partículas ───────────────────────────────────────────────────────────────

function Particles() {
  const count = 100;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null!);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.03; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#C9A84C" size={0.02} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ─── cena ─────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      {/* luz ambiente quente muito suave */}
      <ambientLight intensity={0.15} color="#2a1500" />

      {/* luz principal dourada — vem da frente-cima-direita */}
      <directionalLight position={[3, 5, 5]} intensity={4} color="#C9A84C" castShadow />

      {/* fill lateral esquerdo — prata fria */}
      <directionalLight position={[-4, 2, 2]} intensity={1.8} color="#d0d8e8" />

      {/* rim light atrás */}
      <directionalLight position={[0, -2, -4]} intensity={1.2} color="#C9A84C" />

      {/* point central — ilumina o escudo de perto */}
      <pointLight position={[0, 0, 4]} intensity={5} color="#E2C06A" distance={12} decay={2} />

      {/* spot de cima */}
      <spotLight position={[0, 10, 3]} intensity={8} color="#C9A84C" angle={0.25} penumbra={0.7} castShadow />

      <Particles />

      <Float speed={1.2} rotationIntensity={0.06} floatIntensity={0.4}>
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
        camera={{ position: [0, 0, 7], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.6,
        }}
        shadows
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
