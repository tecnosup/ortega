"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";

// ─── partículas cósmicas ──────────────────────────────────────────────────────

function CosmicParticles() {
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null!);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#E8D5A3" size={0.028} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ─── modelo GLB ──────────────────────────────────────────────────────────────

function Knight() {
  const { scene } = useGLTF("/plated_knight_-_medieval.glb");
  const ref = useRef<THREE.Group>(null!);

  // calcula bounding box para normalizar o tamanho do modelo automaticamente
  const { scale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    // normaliza para caber em ~2.8 unidades de altura
    const s = 2.8 / maxDim;
    const c = new THREE.Vector3();
    box.getCenter(c);
    return { scale: s, center: c };
  }, [scene]);

  // ajusta materiais para aspecto metálico dramático
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.envMapIntensity = 2.0;
        }
      }
    });
  }, [scene]);

  // rotação contínua — 1 volta a cada ~20s
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.32;
  });

  return (
    <group ref={ref} scale={scale} position={[-center.x * scale, -center.y * scale, -center.z * scale]}>
      <primitive object={scene} />
    </group>
  );
}

// ─── cena ─────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} color="#1a2035" />

      {/* luz principal fria — lateral direita, simula luz estelar */}
      <directionalLight position={[5, 4, 3]} intensity={4.5} color="#D0E0FF" castShadow />

      {/* rim laranja — reflete capa/detalhes */}
      <directionalLight position={[-3, 1, -2]} intensity={2.0} color="#E06820" />

      {/* fill suave de cima */}
      <directionalLight position={[0, 6, 2]} intensity={1.2} color="#B0C8E8" />

      {/* contra-luz atrás */}
      <directionalLight position={[0, -2, -5]} intensity={0.8} color="#D4601A" />

      {/* point light próximo — ilumina detalhes da armadura */}
      <pointLight position={[2, 2, 5]} intensity={5} color="#C8D8F0" distance={14} decay={2} />

      {/* glow laranja */}
      <pointLight position={[-1.5, 0, 2]} intensity={2.5} color="#D05010" distance={8} decay={2} />

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
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 40 }}
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

useGLTF.preload("/plated_knight_-_medieval.glb");
