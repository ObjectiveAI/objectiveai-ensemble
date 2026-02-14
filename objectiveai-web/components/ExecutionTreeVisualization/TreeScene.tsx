'use client';

/**
 * TreeScene.tsx - R3F Canvas Scene
 * Renders 3D tree nodes using Three.js
 * DISPLAY ONLY - Does not calculate or modify data
 */

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { LayoutResult, LayoutPosition, TreeNode } from './types';

interface TreeSceneProps {
  layout: LayoutResult | null;
  nodes: TreeNode[];
  canvasHeight: number;
}

/**
 * Individual 3D Node Component
 */
function Node3D({
  position,
  node,
  nodeSize,
}: {
  position: LayoutPosition;
  node: TreeNode;
  nodeSize: { width: number; height: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(hovered ? 1.1 : 1, hovered ? 1.1 : 1, 1),
        0.1
      );
    }
  });

  // Color by node type
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'function':
        return '#6B5CFF'; // Accent
      case 'task':
        return '#8B7FFF'; // Lighter accent
      case 'llm':
        return '#22C55E'; // Success
      case 'output':
        return '#F97316'; // Danger
      case 'vote':
      case 'score':
        return '#EAB308'; // Warning
      default:
        return '#9CA3AF'; // Muted
    }
  };

  return (
    <group position={[position.x - 550, -position.y + 300, 0]}>
      {/* Box geometry */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[nodeSize.width / 100, nodeSize.height / 100, 0.1]} />
        <meshStandardMaterial color={getNodeColor(node.type)} />
      </mesh>

      {/* Label text */}
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.15}
        color={hovered ? '#FFFFFF' : '#1B1B1B'}
        anchorX="center"
        anchorY="middle"
        maxWidth={nodeSize.width / 100 - 0.1}
      >
        {node.label}
      </Text>
    </group>
  );
}

/**
 * Main R3F Scene Component
 */
export function TreeScene({ layout, nodes, canvasHeight }: TreeSceneProps) {
  if (!layout || nodes.length === 0) {
    return (
      <Canvas style={{ width: '100%', height: `${canvasHeight}px` }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <color attach="background" args={['#EDEDF2']} />
        <ambientLight intensity={0.8} />
      </Canvas>
    );
  }

  const nodeSize = { width: 100, height: 50 };

  return (
    <Canvas
      style={{ width: '100%', height: `${canvasHeight}px` }}
      orthographic
      camera={{ position: [0, 0, 100], zoom: 1, far: 10000 }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      {/* Background */}
      <color attach="background" args={['#EDEDF2']} />

      {/* Camera controls */}
      <OrbitControls
        enableRotate={false}
        enableZoom={true}
        enablePan={true}
        autoRotate={false}
      />

      {/* Render nodes */}
      {nodes.map((node) => {
        const position = layout.positions.get(node.id);
        if (!position) return null;

        return (
          <Node3D
            key={node.id}
            position={position}
            node={node}
            nodeSize={nodeSize}
          />
        );
      })}
    </Canvas>
  );
}

export default TreeScene;
