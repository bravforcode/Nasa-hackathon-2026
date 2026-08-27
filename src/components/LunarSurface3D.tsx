/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Card, StatusPill, IconButton, Button } from './ui';
import { SyntheticPolarTerrain } from '../utils/terrain';
import { Eye, Sun, RotateCw, Compass } from 'lucide-react';

export interface LunarSurface3DProps {
  latDeg?: number;
  lonDeg?: number;
  siteName?: string;
  sunElevationDeg?: number;
  sunAzimuthDeg?: number;
  className?: string;
}

export type ViewPreset = 'orbit' | 'ridge' | 'top';

export const LunarSurface3D: React.FC<LunarSurface3DProps> = ({
  latDeg = -89.9,
  lonDeg = 0.0,
  siteName = 'Shackleton Peak Station Alpha',
  sunElevationDeg = 1.5,
  sunAzimuthDeg = 135,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewPreset, setViewPreset] = useState<ViewPreset>('orbit');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  const terrain = useMemo(() => new SyntheticPolarTerrain(), []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 400;
    const height = 320;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);

    // Apply view preset camera positions
    const applyCameraPreset = (preset: ViewPreset) => {
      if (preset === 'orbit') {
        camera.position.set(0, 35, 45);
        camera.lookAt(0, 0, 0);
      } else if (preset === 'ridge') {
        camera.position.set(0, 4, 25);
        camera.lookAt(0, 8, -20);
      } else if (preset === 'top') {
        camera.position.set(0, 60, 0.01);
        camera.lookAt(0, 0, 0);
      }
    };
    applyCameraPreset(viewPreset);

    // Ambient Earthshine & Cosmic Light
    const ambientLight = new THREE.AmbientLight(0x223344, 0.4);
    scene.add(ambientLight);

    // Sun Directional Light
    const sunRad = (sunAzimuthDeg * Math.PI) / 180;
    const sunElevRad = (sunElevationDeg * Math.PI) / 180;
    const sunDist = 80;
    const sunX = Math.sin(sunRad) * Math.cos(sunElevRad) * sunDist;
    const sunY = Math.max(Math.sin(sunElevRad) * sunDist, 2.5);
    const sunZ = Math.cos(sunRad) * Math.cos(sunElevRad) * sunDist;

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sunLight.position.set(sunX, sunY, sunZ);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    const shadowSize = 40;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Build 3D Displaced Terrain Mesh
    const gridRes = 48;
    const terrainSize = 60;
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, gridRes, gridRes);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Map local coordinates [-30..30] to lat/lon offsets around target
      const offsetLat = latDeg + (z / 30) * 0.15;
      const offsetLon = lonDeg + (x / 30) * 0.15;
      const elevM = terrain.elevationAt(offsetLat, offsetLon);
      // Height scale: meters -> units
      posAttr.setY(i, (elevM / 1000 + 2.5) * 4);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x8892a0,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);

    // Central Relay Mast Marker
    const mastGeom = new THREE.CylinderGeometry(0.3, 0.4, 5, 12);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.2 });
    const mastMesh = new THREE.Mesh(mastGeom, mastMat);
    mastMesh.position.set(0, 12, 0);
    mastMesh.castShadow = true;
    scene.add(mastMesh);

    // Mast Beacon Glow
    const beaconLight = new THREE.PointLight(0x60a5fa, 1.5, 20);
    beaconLight.position.set(0, 15, 0);
    scene.add(beaconLight);

    // Trajectory Waypoint Ribbon
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-18, 6, -15),
      new THREE.Vector3(-8, 8, -5),
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(12, 7, 8),
      new THREE.Vector3(20, 5, 18),
    ]);
    const pathGeom = new THREE.TubeGeometry(pathCurve, 32, 0.25, 8, false);
    const pathMat = new THREE.MeshBasicMaterial({ color: 0x00ff94 });
    const pathMesh = new THREE.Mesh(pathGeom, pathMat);
    scene.add(pathMesh);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isRotating && viewPreset === 'orbit') {
        terrainMesh.rotation.y += 0.003;
        mastMesh.rotation.y += 0.003;
        pathMesh.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height, false);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      mastGeom.dispose();
      mastMat.dispose();
      pathGeom.dispose();
      pathMat.dispose();
    };
  }, [latDeg, lonDeg, sunElevationDeg, sunAzimuthDeg, viewPreset, isRotating, terrain]);

  return (
    <Card
      as="section"
      variant="default"
      aria-label="Interactive 3D WebGL Lunar Surface and Sun Shadowing"
      className={`relative overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] tracking-tight">
              Interactive 3D WebGL Lunar Surface
            </h3>
            <p className="text-3xs text-[var(--color-text-muted)] font-mono">
              {siteName} ({latDeg.toFixed(2)}°S, {lonDeg.toFixed(2)}°E) · Dynamic Sun Shadows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill tone="success">WebGL 3D ACCELERATED</StatusPill>
          <StatusPill tone="accent">SUN: {sunElevationDeg.toFixed(1)}° ELEV</StatusPill>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative my-3 w-full h-[320px] rounded-xl bg-black/60 border border-[var(--color-border-subtle)] overflow-hidden flex items-center justify-center"
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing select-none" />

        {!webglSupported && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-center p-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              WebGL context not available in this environment. 3D surface fallback active.
            </p>
          </div>
        )}

        {/* Viewport Overlay Controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
          <Button
            size="sm"
            variant={viewPreset === 'orbit' ? 'primary' : 'tertiary'}
            onClick={() => setViewPreset('orbit')}
            leftIcon={<RotateCw className="w-3 h-3" />}
          >
            Orbit 360°
          </Button>
          <Button
            size="sm"
            variant={viewPreset === 'ridge' ? 'primary' : 'tertiary'}
            onClick={() => setViewPreset('ridge')}
            leftIcon={<Eye className="w-3 h-3" />}
          >
            Ridge Horizon
          </Button>
          <Button
            size="sm"
            variant={viewPreset === 'top' ? 'primary' : 'tertiary'}
            onClick={() => setViewPreset('top')}
          >
            Top-Down
          </Button>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'text-blue-400 animate-spin' : 'text-slate-400'}`} />}
            aria-label={isRotating ? 'Pause auto rotation' : 'Resume auto rotation'}
            onClick={() => setIsRotating((r) => !r)}
          />
        </div>

        {/* Sun Vector Indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-3xs font-mono text-slate-300">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Solar Azimuth: {sunAzimuthDeg}°</span>
          <span className="text-slate-500">|</span>
          <span>Elevation: {sunElevationDeg}°</span>
        </div>
      </div>
    </Card>
  );
};
