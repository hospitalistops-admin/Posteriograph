import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { STATE_COLORS, targetStateLabel } from "../lib/cases";
import {
  TARGET_STATES,
  tetraUnitVertex,
  tetrahedronBarycentric,
  type TargetState
} from "../lib/b10Views";

const SCALE = 2.8;
const DEFAULT_YAW = 0.45;
const DEFAULT_PITCH = 0.15;

export type TetraPresetName = "Iso" | "EColi" | "OtherGramNeg" | "GramPos" | "None";

export const TETRA_PRESET_LABELS: Record<TetraPresetName, string> = {
  Iso: "Iso",
  EColi: "E. coli",
  OtherGramNeg: "Other GNR",
  GramPos: "Gram-pos",
  None: "None"
};

const PRESETS: Record<TetraPresetName, { yaw: number; pitch: number }> = {
  Iso: { yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH },
  EColi: { yaw: -2.3, pitch: 0.4 },
  OtherGramNeg: { yaw: -0.8, pitch: -0.3 },
  GramPos: { yaw: 0.8, pitch: 0.4 },
  None: { yaw: 2.3, pitch: -0.3 }
};

export interface B10TetrahedronSceneHandle {
  setPreset: (name: TetraPresetName) => void;
}

function toVec3(point: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(point.x * SCALE, point.y * SCALE, point.z * SCALE);
}

function hexToThree(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function makeGradientEdge(a: TargetState, b: TargetState): THREE.Line {
  const start = toVec3(tetraUnitVertex(a));
  const end = toVec3(tetraUnitVertex(b));
  const colorA = hexToThree(STATE_COLORS[a] ?? "#64748b");
  const colorB = hexToThree(STATE_COLORS[b] ?? "#64748b");
  const positions = new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]);
  const colors = new Float32Array([
    colorA.r,
    colorA.g,
    colorA.b,
    colorB.r,
    colorB.g,
    colorB.b
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 })
  );
}

function makeLabelSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32, 240);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
}

interface Props {
  probabilities: Record<string, number>;
  priorProbabilities: Record<string, number>;
  highlightState: TargetState;
}

export const B10TetrahedronScene = forwardRef<B10TetrahedronSceneHandle, Props>(function B10TetrahedronScene(
  { probabilities, priorProbabilities, highlightState },
  ref
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const probsRef = useRef(probabilities);
  const priorRef = useRef(priorProbabilities);
  const highlightRef = useRef(highlightState);
  const yawRef = useRef(DEFAULT_YAW);
  const pitchRef = useRef(DEFAULT_PITCH);
  const targetYawRef = useRef(DEFAULT_YAW);
  const targetPitchRef = useRef(DEFAULT_PITCH);
  const presetAnimatingRef = useRef(false);
  const lastInteractionRef = useRef(Date.now());
  const setPresetRef = useRef<(name: TetraPresetName) => void>(() => {});

  probsRef.current = probabilities;
  priorRef.current = priorProbabilities;
  highlightRef.current = highlightState;

  useImperativeHandle(ref, () => ({
    setPreset: (name) => setPresetRef.current(name)
  }));

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0a10");

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountEl.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 5);
    scene.add(ambient, key);

    const axes = new THREE.AxesHelper(0.65);
    camera.add(axes);
    axes.position.set(-1.8, -1.2, -2.8);
    scene.add(camera);

    const edgePairs: [TargetState, TargetState][] = [
      ["EColi", "OtherGramNeg"],
      ["EColi", "GramPos"],
      ["EColi", "None"],
      ["OtherGramNeg", "GramPos"],
      ["OtherGramNeg", "None"],
      ["GramPos", "None"]
    ];
    edgePairs.forEach(([a, b]) => scene.add(makeGradientEdge(a, b)));

    const vertexMeshes = new Map<TargetState, THREE.Mesh>();
    TARGET_STATES.forEach((state) => {
      const corner = toVec3(tetraUnitVertex(state));
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({
          color: STATE_COLORS[state],
          transparent: true,
          opacity: 0.35,
          emissive: STATE_COLORS[state],
          emissiveIntensity: 0.15
        })
      );
      mesh.position.copy(corner);
      scene.add(mesh);
      vertexMeshes.set(state, mesh);

      const label = makeLabelSprite(state, STATE_COLORS[state] ?? "#94a3b8");
      label.position.copy(corner.clone().multiplyScalar(1.18));
      scene.add(label);
    });

    const pullLines = new Map<TargetState, THREE.Line>();
    TARGET_STATES.forEach((state) => {
      const geometry = new THREE.BufferGeometry();
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: STATE_COLORS[state] ?? "#64748b",
          transparent: true,
          opacity: 0.35
        })
      );
      scene.add(line);
      pullLines.set(state, line);
    });

    const priorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.025, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.9 })
    );
    scene.add(priorRing);

    const posteriorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 20),
      new THREE.MeshStandardMaterial({
        color: STATE_COLORS.EColi,
        emissive: STATE_COLORS.EColi,
        emissiveIntensity: 0.35
      })
    );
    scene.add(posteriorMesh);

    const shiftGeometry = new THREE.BufferGeometry();
    const shiftLine = new THREE.Line(
      shiftGeometry,
      new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.08, gapSize: 0.06 })
    );
    scene.add(shiftLine);

    let pointerDown = false;
    let lastX = 0;
    let lastY = 0;
    let animationFrame = 0;

    setPresetRef.current = (name: TetraPresetName) => {
      const preset = PRESETS[name];
      targetYawRef.current = preset.yaw;
      targetPitchRef.current = preset.pitch;
      presetAnimatingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    function resize() {
      const node = mountRef.current;
      if (!node) return;
      const w = node.clientWidth;
      const h = node.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function updateCamera() {
      const radius = 7.2;
      camera.position.x = Math.sin(yawRef.current) * radius;
      camera.position.z = Math.cos(yawRef.current) * radius;
      camera.position.y = 2.8 + pitchRef.current * 4;
      camera.lookAt(0, 0, 0);
    }

    function updateMarkers(seconds: number) {
      const posterior = toVec3(tetrahedronBarycentric(probsRef.current));
      const prior = toVec3(tetrahedronBarycentric(priorRef.current));
      posteriorMesh.position.copy(posterior);
      priorRing.position.copy(prior);
      priorRing.lookAt(camera.position);
      const color = STATE_COLORS[highlightRef.current] ?? "#0e7c86";
      (posteriorMesh.material as THREE.MeshStandardMaterial).color.set(color);
      (posteriorMesh.material as THREE.MeshStandardMaterial).emissive.set(color);

      const shiftGeom = shiftLine.geometry as THREE.BufferGeometry;
      shiftGeom.setFromPoints([prior, posterior]);
      shiftGeom.computeBoundingSphere();
      shiftLine.computeLineDistances();

      TARGET_STATES.forEach((state) => {
        const mesh = vertexMeshes.get(state);
        if (!mesh) return;
        const prob = probsRef.current[state] ?? 0;
        const pulse = state === highlightRef.current ? Math.sin(seconds * 2) * 0.1 + 1.0 : 1;
        const s = (0.7 + prob * 1.8) * pulse;
        mesh.scale.setScalar(s);
        (mesh.material as THREE.MeshStandardMaterial).opacity = 0.2 + prob * 0.55;

        const corner = toVec3(tetraUnitVertex(state));
        const pull = pullLines.get(state);
        if (pull) {
          const geom = pull.geometry as THREE.BufferGeometry;
          geom.setFromPoints([posterior, corner]);
          const mat = pull.material as THREE.LineBasicMaterial;
          mat.opacity = 0.12 + prob * 0.65;
        }
      });
    }

    function onPointerMove(event: PointerEvent) {
      if (!pointerDown) return;
      lastInteractionRef.current = Date.now();
      presetAnimatingRef.current = false;
      yawRef.current += (event.clientX - lastX) * 0.01;
      pitchRef.current = Math.max(-0.6, Math.min(0.85, pitchRef.current + (event.clientY - lastY) * 0.008));
      targetYawRef.current = yawRef.current;
      targetPitchRef.current = pitchRef.current;
      lastX = event.clientX;
      lastY = event.clientY;
      updateCamera();
    }

    function onPointerDown(event: PointerEvent) {
      pointerDown = true;
      lastInteractionRef.current = Date.now();
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function onPointerUp(event: PointerEvent) {
      pointerDown = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
    }

    function onDoubleClick() {
      setPresetRef.current("Iso");
    }

    function onPointerEnter() {
      lastInteractionRef.current = Date.now();
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("dblclick", onDoubleClick);
    renderer.domElement.addEventListener("pointerenter", onPointerEnter);
    window.addEventListener("resize", resize);
    resize();
    updateCamera();

    function animate(time: number) {
      const seconds = time / 1000;
      const idle = Date.now() - lastInteractionRef.current > 1500;

      if (presetAnimatingRef.current) {
        const dy = targetYawRef.current - yawRef.current;
        const dp = targetPitchRef.current - pitchRef.current;
        if (Math.abs(dy) < 0.008 && Math.abs(dp) < 0.008) {
          yawRef.current = targetYawRef.current;
          pitchRef.current = targetPitchRef.current;
          presetAnimatingRef.current = false;
        } else {
          yawRef.current += dy * 0.12;
          pitchRef.current += dp * 0.12;
        }
        updateCamera();
      } else if (idle && !pointerDown) {
        yawRef.current += 0.0015;
        targetYawRef.current = yawRef.current;
        updateCamera();
      }

      updateMarkers(seconds);
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
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      renderer.domElement.removeEventListener("pointerenter", onPointerEnter);
      setPresetRef.current = () => {};
      renderer.dispose();
      mountEl.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      className="b10-tetra-scene-mount"
      ref={mountRef}
      role="img"
      aria-label={`3D tetrahedron: learnt posterior for ${targetStateLabel(highlightState)}. Drag to rotate.`}
      title="Drag to rotate · double-click to reset"
    />
  );
});
