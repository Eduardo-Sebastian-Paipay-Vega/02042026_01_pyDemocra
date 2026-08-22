import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles } from '@react-three/drei';
import type { Mesh } from 'three';

function AnimatedShape() {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * (hovered ? 1 : 0.2);
      meshRef.current.rotation.y += delta * (hovered ? 1 : 0.3);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh
        ref={meshRef}
        scale={active ? 1.2 : 1}
        onClick={() => setActive(!active)}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <icosahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial 
          color={hovered ? '#38bdf8' : '#818cf8'} 
          wireframe={hovered} 
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

export default function Scene3D() {
  return (
    <div className="w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <p className="text-white font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          WebGL Canvas
        </p>
        <p className="text-slate-400 text-sm">Interactúa con el modelo</p>
      </div>
      
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <AnimatedShape />
        
        <Sparkles count={100} scale={10} size={2} speed={0.4} opacity={0.5} color="#38bdf8" />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}
