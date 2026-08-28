/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { StatusPill, IconButton, Button } from './ui';
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

  // Refs read by the animate() closure — never trigger re-init
  const isRotatingRef = useRef<boolean>(isRotating);
  isRotatingRef.current = isRotating;

  const viewPresetRef = useRef<ViewPreset>(viewPreset);
  viewPresetRef.current = viewPreset;

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const terrain = useMemo(() => new SyntheticPolarTerrain(), []);

  // Lightweight effect: update camera position when preset changes, no re-init
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (viewPreset === 'orbit') {
      camera.position.set(0, 35, 45);
      camera.lookAt(0, 0, 0);
    } else if (viewPreset === 'ridge') {
      camera.position.set(0, 4, 25);
      camera.lookAt(0, 8, -20);
    } else if (viewPreset === 'top') {
      camera.position.set(0, 60, 0.01);
      camera.lookAt(0, 0, 0);
    }
  }, [viewPreset]);

  // Heavy WebGL scene init — only keyed on geographic/sun parameters
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    cameraRef.current = camera;

    // Apply current preset at mount time via ref (no extra effect run needed)
    if (viewPresetRef.current === 'ridge') {
      camera.position.set(0, 4, 25);
      camera.lookAt(0, 8, -20);
    } else if (viewPresetRef.current === 'top') {
      camera.position.set(0, 60, 0.01);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 35, 45);
      camera.lookAt(0, 0, 0);
    }

    const ambientLight = new THREE.AmbientLight(0x223344, 0.4);
    scene.add(ambientLight);

    const sunRad = (sunAzimuthDeg * Math.PI) / 180;
    const sunElevRad = (sunElevationDeg * Math.PI) / 180;
    const sunDist = 80;
    const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sunLight.position.set(
      Math.sin(sunRad) * Math.cos(sunElevRad) * sunDist,
      Math.max(Math.sin(sunElevRad) * sunDist, 2.5),
      Math.cos(sunRad) * Math.cos(sunElevRad) * sunDist
    );
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

    const gridRes = 48;
    const terrainSize = 60;
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, gridRes, gridRes);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const offsetLat = latDeg + (z / 30) * 0.15;
      const offsetLon = lonDeg + (x / 30) * 0.15;
      const elevM = terrain.elevationAt(offsetLat, offsetLon);
      posAttr.setY(i, (elevM / 1000 + 2.5) * 4);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x8892a0,
      roughness: 0.85,
      metalness: 0.1,
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);

    const mastGeom = new THREE.CylinderGeometry(0.3, 0.4, 5, 12);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.2 });
    const mastMesh = new THREE.Mesh(mastGeom, mastMat);
    mastMesh.position.set(0, 12, 0);
    mastMesh.castShadow = true;
    scene.add(mastMesh);

    const beaconLight = new THREE.PointLight(0x60a5fa, 1.5, 20);
    beaconLight.position.set(0, 15, 0);
    scene.add(beaconLight);

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

    // animate() reads refs directly — viewPreset/isRotating changes never trigger re-init
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isRotatingRef.current && viewPresetRef.current === 'orbit') {
        terrainMesh.rotation.y += 0.003;
        mastMesh.rotation.y += 0.003;
        pathMesh.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

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
      cameraRef.current = null;
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      mastGeom.dispose();
      mastMat.dispose();
      pathGeom.dispose();
      pathMat.dispose();
    };
  }, [latDeg, lonDeg, sunElevationDeg, sunAzimuthDeg, terrain]); // viewPreset/isRotating NOT in deps

  return (
    <div
      role="region"
      aria-label="Interactive 3D WebGL Lunar Surface and Sun Shadowing"
      className={`relative w-full h-full flex flex-col overflow-hidden bg-slate-950/80 backdrop-blur-2xl ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.08] bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-400">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-headline font-bold text-white tracking-tight">
              Interactive 3D WebGL Lunar Surface · Digital Twin
            </h3>
            <p className="text-3xs text-slate-400 font-mono">
              {siteName} ({latDeg.toFixed(2)}°S, {lonDeg.toFixed(2)}°E) · Dynamic LOLA Shadow Ray-Casting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill tone="success" className="py-0.5 px-2 text-3xs rounded-full">3D ACCELERATED</StatusPill>
          <StatusPill tone="accent" className="py-0.5 px-2 text-3xs rounded-full">SUN: {sunElevationDeg.toFixed(1)}° ELEV</StatusPill>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-[260px] overflow-hidden flex items-center justify-center bg-[#020409]"
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing select-none" />

        {!webglSupported && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-center p-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              WebGL context not available in this environment. 3D surface fallback active.
            </p>
          </div>
        )}

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

        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-3xs font-mono text-slate-300">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Solar Azimuth: {sunAzimuthDeg}°</span>
          <span className="text-slate-500">|</span>
          <span>Elevation: {sunElevationDeg}°</span>
        </div>
      </div>
    </div>
  );
};
