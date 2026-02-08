"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import ThinkerFigure, { type ThinkerConfig } from "./ThinkerFigure";

// =============================================================================
// HERO SCENE — Development preview with orbit controls
// =============================================================================
// Phase 1: Single figure with basic lighting for inspection.
// Phase 3 will add the full ensemble + center orb.
// =============================================================================

/** Single figure, centered, with orbit controls for review */
export default function HeroScene({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const figureConfig: ThinkerConfig = {
    scale: 1,
    headTilt: -0.05, // very slight downward contemplation
    shellCoverage: 0.8,
    shellTint: 0.3,
    position: [0, 0, 0],
    rotationY: 0,
  };

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        background: "#1B1B1B",
        ...style,
      }}
    >
      <Canvas
        camera={{
          position: [0, -0.15, 2.8],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#1B1B1B"]} />

        {/* Lighting — soft, directional, slightly below */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[2, 3, 4]}
          intensity={0.8}
          color="#f0f0f5"
        />
        <directionalLight
          position={[-2, 1, -2]}
          intensity={0.3}
          color="#d0d0e0"
        />
        {/* Subtle rim light from below — dignified presence */}
        <pointLight
          position={[0, -2, 1]}
          intensity={0.15}
          color="#6B5CFF"
        />

        <Suspense fallback={null}>
          <ThinkerFigure config={figureConfig} />
          <Environment preset="city" environmentIntensity={0.15} />
        </Suspense>

        {/* Orbit controls for dev inspection */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={6}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
