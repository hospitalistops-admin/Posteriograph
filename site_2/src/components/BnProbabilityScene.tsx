import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { StateEmbedding } from "../types";
import { formatPercent } from "../lib/cases";

interface MarkerObject {
  group: THREE.Group;
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  hitTarget: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  swirlGuide: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  label: THREE.Sprite;
  basePositions: Float32Array;
  phases: Float32Array;
}

export type CameraPreset = "front" | "top" | "side" | "reset";

interface Props {
  embeddings: StateEmbedding[];
  onNodeClick?: (embedding: StateEmbedding) => void;
  fullscreen?: boolean;
  cameraPreset?: CameraPreset;
  onClose?: () => void;
}

const X_SCALE = 9;
const Y_SCALE = 8;
const Z_SCALE = 9;
const PARTICLE_COUNT = 170;

export function BnProbabilityScene({
  embeddings,
  onNodeClick,
  fullscreen = false,
  cameraPreset = "reset",
  onClose
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const embeddingsRef = useRef(embeddings);
  const onNodeClickRef = useRef(onNodeClick);
  const markersRef = useRef<Map<string, MarkerObject>>(new Map());
  const yawRef = useRef(0.35);
  const pitchRef = useRef(0);
  const updateCameraRef = useRef<() => void>(() => {});
  const [selectedState, setSelectedState] = useState(embeddings[0]?.state ?? "EColi");

  embeddingsRef.current = embeddings;
  onNodeClickRef.current = onNodeClick;

  const selected = useMemo(
    () => embeddings.find((embedding) => embedding.state === selectedState) ?? embeddings[0],
    [embeddings, selectedState]
  );

  useEffect(() => {
    switch (cameraPreset) {
      case "front":
        yawRef.current = 0;
        pitchRef.current = 0;
        break;
      case "top":
        yawRef.current = 0;
        pitchRef.current = -5.5;
        break;
      case "side":
        yawRef.current = Math.PI / 2;
        pitchRef.current = 0.5;
        break;
      case "reset":
      default:
        yawRef.current = 0.35;
        pitchRef.current = 0;
        break;
    }
    updateCameraRef.current();
  }, [cameraPreset]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const container = mount;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#08080d");
    scene.fog = new THREE.Fog("#08080d", 18, 36);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(8, 7, 13);
    camera.lookAt(0, 2.7, 0);

    const ambient = new THREE.HemisphereLight("#00d4ff", "#ff00ff", 1.9);
    scene.add(ambient);
    const key = new THREE.DirectionalLight("#00ff88", 2.8);
    key.position.set(5, 9, 6);
    scene.add(key);

    const grid = new THREE.GridHelper(10, 10, "#00ff88", "#233044");
    scene.add(grid);
    scene.add(makeAxis(new THREE.Vector3(-5, 0, 0), new THREE.Vector3(5, 0, 0), "#ff00ff"));
    scene.add(makeAxis(new THREE.Vector3(0, 0, -5), new THREE.Vector3(0, 0, 5), "#00d4ff"));
    scene.add(makeAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 8.4, 0), "#00ff88"));
    scene.add(makeTextSprite("X  history contribution", "#ff00ff", new THREE.Vector3(5.85, -0.35, 0), 0.92));
    scene.add(makeTextSprite("Z  urine-test contribution", "#00d4ff", new THREE.Vector3(0, -0.35, 5.82), 0.92));
    scene.add(makeTextSprite("Y  b10 posterior probability", "#00ff88", new THREE.Vector3(0.45, 8.75, 0), 0.92));
    scene.add(makeTextSprite("history argues against", "#ff00ff", new THREE.Vector3(-5.25, 0.34, 0), 0.58));
    scene.add(makeTextSprite("history supports", "#ff00ff", new THREE.Vector3(5.15, 0.34, 0), 0.58));
    scene.add(makeTextSprite("urine argues against", "#00d4ff", new THREE.Vector3(0, 0.34, -5.45), 0.58));
    scene.add(makeTextSprite("urine supports", "#00d4ff", new THREE.Vector3(0, 0.34, 5.45), 0.58));

    scene.add(makeFloorPlane(0xff00ff, Math.PI / 2, 0.14));
    scene.add(makeFloorPlane(0x00d4ff, 0, 0.12));
    scene.add(makePoleMarker(new THREE.Vector3(-5.5, 0, 0), "#ff00ff", "H−"));
    scene.add(makePoleMarker(new THREE.Vector3(5.5, 0, 0), "#ff00ff", "H+"));
    scene.add(makePoleMarker(new THREE.Vector3(0, 0, -5.5), "#00d4ff", "U−"));
    scene.add(makePoleMarker(new THREE.Vector3(0, 0, 5.5), "#00d4ff", "U+"));
    scene.add(makePoleMarker(new THREE.Vector3(0, 8.8, 0), "#00ff88", "P↑"));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown = false;
    let lastX = 0;
    let dragged = false;
    let animationFrame = 0;

    embeddingsRef.current.forEach((embedding) => {
      const marker = makeMarker(embedding);
      markersRef.current.set(embedding.state, marker);
      scene.add(marker.group);
    });

    function resize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function updateCamera() {
      const radius = fullscreen ? 18 : 16;
      camera.position.x = Math.sin(yawRef.current) * radius;
      camera.position.z = Math.cos(yawRef.current) * radius;
      camera.position.y = 7 + pitchRef.current;
      camera.lookAt(0, 2.8, 0);
    }
    updateCameraRef.current = updateCamera;

    function onPointerMove(event: PointerEvent) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      if (pointerDown) {
        const movement = event.clientX - lastX;
        if (Math.abs(movement) > 2) dragged = true;
        yawRef.current += movement * 0.008;
        lastX = event.clientX;
        updateCamera();
      }
    }

    function onPointerDown(event: PointerEvent) {
      pointerDown = true;
      dragged = false;
      lastX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function onPointerUp(event: PointerEvent) {
      pointerDown = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
      if (dragged) return;
      raycaster.setFromCamera(pointer, camera);
      const targets = [...markersRef.current.values()].map((marker) => marker.hitTarget);
      const hit = raycaster.intersectObjects(targets)[0];
      if (hit?.object.userData.state) {
        const state = hit.object.userData.state as string;
        const embedding = embeddingsRef.current.find((item) => item.state === state);
        setSelectedState(state);
        if (embedding) onNodeClickRef.current?.(embedding);
      }
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", resize);
    resize();

    function animate(time: number) {
      const seconds = time / 1000;
      embeddingsRef.current.forEach((embedding) => {
        const marker = markersRef.current.get(embedding.state);
        if (!marker) return;
        const position = embeddingToPosition(embedding);
        marker.group.position.lerp(position, 0.12);
        marker.points.material.color.set(embedding.color);
        marker.swirlGuide.material.color.set(embedding.color);
        marker.swirlGuide.material.opacity = 0.1 + embedding.decompensationRisk * 0.48;
        animateParticleCloud(marker, embedding, seconds);
        marker.swirlGuide.rotation.y = seconds * swirlSpeed(embedding);
        marker.swirlGuide.rotation.z = Math.sin(seconds * 0.6 + marker.phases[0]) * 0.15;
        marker.hitTarget.scale.setScalar(cloudSpread(embedding) * 1.45);
        marker.group.scale.setScalar(0.9 + embedding.posterior * 0.52);
      });
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      markersRef.current.clear();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [fullscreen]);

  return (
    <section
      className={fullscreen ? "scene-shell scene-fullscreen cyber-panel" : "scene-shell cyber-panel"}
      aria-label="Guided 3D Bayesian network probability demo"
    >
      <div className="scene-canvas" ref={mountRef} />
      {fullscreen ? (
        <div className="orientation-hud">
          <div>
            <span className="axis-tag magenta">X · history</span>
            <span className="axis-tag cyan">Z · urine</span>
            <span className="axis-tag green">Y · posterior</span>
          </div>
          <p>Drag to orbit · pole flags mark axis directions · click a cloud to inspect</p>
        </div>
      ) : null}
      <div className="scene-readout">
        <span>Selected b10 cloud</span>
        <strong>{selected?.label}</strong>
        <div className="node-card-grid">
          <NodeMetric label="BN probability" value={formatPercent(selected?.posterior ?? 0, 1)} />
          <NodeMetric label="History contribution" value={formatSignedPercent(selected?.historyDelta ?? 0)} />
          <NodeMetric label="Urine-test contribution" value={formatSignedPercent(selected?.urineDelta ?? 0)} />
          <NodeMetric label="Sound brightness" value={`${selected?.audioFrequency ?? 0} Hz`} />
          <NodeMetric label="Decomp composite" value={formatPercent(selected?.decompensationRisk ?? 0, 1)} />
          <NodeMetric label="Cloud spread" value={formatPercent(selected?.contaminationHigh ?? 0, 1)} />
        </div>
        <p className="node-card-note">
          Guideposts label the axes so the view stays oriented. Wider clouds indicate contamination uncertainty;
          faster swirl indicates higher inflammatory gram-negative deterioration signal.
        </p>
      </div>
      <div className="scene-legend">
        {embeddings.map((embedding) => (
          <button
            type="button"
            key={embedding.state}
            className={embedding.state === selectedState ? "legend-chip active" : "legend-chip"}
            onClick={() => setSelectedState(embedding.state)}
          >
            <span style={{ background: embedding.color }} />
            {embedding.label}
          </button>
        ))}
      </div>
      {onClose ? (
        <button type="button" className="scene-close-fab cyber-button ghost" onClick={onClose} aria-label="Close 3D view">
          ×
        </button>
      ) : null}
    </section>
  );
}

function makeFloorPlane(color: number, rotationY: number, opacity: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(11, 11);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.rotation.y = rotationY;
  plane.position.y = 0.02;
  return plane;
}

function makePoleMarker(position: THREE.Vector3, color: string, label: string): THREE.Group {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
  );
  pole.position.copy(position);
  pole.position.y = 0.8;
  group.add(pole);
  group.add(makeTextSprite(label, color, position.clone().add(new THREE.Vector3(0, 1.9, 0)), 0.5));
  return group;
}

function NodeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

function makeMarker(embedding: StateEmbedding): MarkerObject {
  const group = new THREE.Group();
  group.position.copy(embeddingToPosition(embedding));

  const seed = hashState(embedding.state);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const phases = new Float32Array(PARTICLE_COUNT);
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const radius = Math.cbrt(seedRandom(seed + index * 17)) * 0.58;
    const theta = seedRandom(seed + index * 31) * Math.PI * 2;
    const phi = Math.acos(2 * seedRandom(seed + index * 47) - 1);
    const offset = index * 3;
    basePositions[offset] = radius * Math.sin(phi) * Math.cos(theta);
    basePositions[offset + 1] = radius * Math.cos(phi) * 0.82;
    basePositions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
    phases[index] = seedRandom(seed + index * 61) * Math.PI * 2;
  }
  positions.set(basePositions);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: embedding.color,
      size: 0.095,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    })
  );
  group.add(points);

  const hitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 16, 16),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: embedding.color
    })
  );
  hitTarget.userData.state = embedding.state;
  group.add(hitTarget);

  const swirlGuide = makeSwirlGuide(embedding.color);
  group.add(swirlGuide);

  const label = makeTextSprite(embedding.label, "#e0e0e0", new THREE.Vector3(0, 1.08, 0), 0.72);
  group.add(label);

  animateParticleCloud({ group, points, hitTarget, swirlGuide, label, basePositions, phases }, embedding, 0);

  return { group, points, hitTarget, swirlGuide, label, basePositions, phases };
}

function makeAxis(start: THREE.Vector3, end: THREE.Vector3, color: string): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  return new THREE.Line(geometry, material);
}

function makeTextSprite(text: string, color: string, position: THREE.Vector3, scale: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "700 34px JetBrains Mono, Consolas, monospace";
  context.fillStyle = "rgba(18, 18, 26, 0.88)";
  context.strokeStyle = "rgba(0, 255, 136, 0.72)";
  context.lineWidth = 2;
  context.roundRect(10, 24, 492, 70, 4);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 60, 470);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(3.1 * scale, 0.78 * scale, 1);
  return sprite;
}

function makeSwirlGuide(color: string): THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> {
  const points: THREE.Vector3[] = [];
  const turns = 1.35;
  const steps = 110;
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const angle = t * Math.PI * 2 * turns;
    const radius = 0.74 + Math.sin(t * Math.PI) * 0.22;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        (t - 0.5) * 1.25,
        Math.sin(angle) * radius
      )
    );
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.46 });
  const line = new THREE.Line(geometry, material);
  line.rotation.x = Math.PI * 0.12;
  return line;
}

function animateParticleCloud(marker: MarkerObject, embedding: StateEmbedding, seconds: number) {
  const positions = marker.points.geometry.getAttribute("position") as THREE.BufferAttribute;
  const spread = cloudSpread(embedding);
  const speed = swirlSpeed(embedding);
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const offset = index * 3;
    const phase = marker.phases[index];
    const localY = marker.basePositions[offset + 1];
    const angle = seconds * speed + phase + localY * 1.35;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = marker.basePositions[offset];
    const z = marker.basePositions[offset + 2];
    const breathing = 1 + 0.08 * embedding.decompensationRisk * Math.sin(seconds * 1.2 + phase);
    positions.setXYZ(
      index,
      (x * cos - z * sin) * spread * breathing,
      (localY + 0.08 * Math.sin(seconds * speed * 0.85 + phase)) * spread,
      (x * sin + z * cos) * spread * breathing
    );
  }
  positions.needsUpdate = true;
  marker.points.material.opacity = 0.7 + clamp(embedding.posterior, 0, 1) * 0.24;
  marker.points.material.size = 0.075 + clamp(embedding.posterior, 0, 1) * 0.055;
}

function cloudSpread(embedding: StateEmbedding): number {
  return 0.78 + clamp(embedding.contaminationHigh, 0, 1) * 1.05;
}

function swirlSpeed(embedding: StateEmbedding): number {
  if (embedding.decompensationRisk <= 0.001) return 0;
  return 0.45 + clamp(embedding.decompensationRisk, 0, 1) * 4.1;
}

function hashState(value: string): number {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0) * 131, 1729);
}

function seedRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function embeddingToPosition(embedding: StateEmbedding): THREE.Vector3 {
  return new THREE.Vector3(
    clamp(embedding.historyDelta, -0.45, 0.45) * X_SCALE,
    clamp(embedding.posterior, 0, 1) * Y_SCALE + 0.2,
    clamp(embedding.urineDelta, -0.45, 0.45) * Z_SCALE
  );
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatPercent(value, 1)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
