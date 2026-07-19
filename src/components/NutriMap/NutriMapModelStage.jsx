import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ArrowLeft, ArrowRight, LocateFixed, Maximize2, Minus, Rotate3D, RotateCcw, ZoomIn } from "lucide-react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { ANATOMY_LAYERS } from "../../data/anatomyLayers";
import { MUSCLE_REGION_DEFAULT_ID, MUSCLE_REGION_HOTSPOTS, getMuscleRegion } from "../../data/nutrimapMuscleRegions";
import { NUTRIMAP_HOTSPOTS, VALID_HOTSPOT_ORGAN_IDS, getCalibratedHotspot, getNutriMapHotspot, resetCalibratedHotspot, saveCalibratedHotspot } from "./nutrimapHotspots";

const TARGET_MODEL_HEIGHT = 2.95;
const DEFAULT_MODEL_METRICS = {
  boundingSphereRadius: 1.1247230243104827,
  center: new THREE.Vector3(-0.0008320063352584839, -0.002418011426925659, 0.00018449872732162476),
  depth: 0.4020269960165024,
  footY: -1.475,
  height: 2.0001800656318665,
  headY: 1.475,
  scale: TARGET_MODEL_HEIGHT / 2.0001800656318665,
  scaledDepth: 0.593,
  scaledHeight: 2.95,
  scaledRadius: 1.659,
  scaledWidth: 1.397,
  width: 0.9474500119686127,
};
const PUBLIC_BASE_URL = import.meta.env.BASE_URL || "/";
const LAYER_CAMERA_PRESETS = {
  "body-navigator": { distance: 1.26, far: 100, fov: 36, near: 0.04, offsetX: 0, offsetY: 0.01, targetY: 0, yaw: 0 },
  brain: { distance: 1.72, far: 80, fov: 36, near: 0.03, offsetX: 0.02, offsetY: 0.02, targetY: 0.02, yaw: -0.08 },
  circulatory: { distance: 1.18, far: 100, fov: 35, near: 0.04, offsetX: 0.03, offsetY: 0.01, targetY: 0.01, yaw: 0.08 },
  digestive: { distance: 1.2, far: 90, fov: 36, near: 0.04, offsetX: 0.02, offsetY: 0.03, targetY: 0.02, yaw: 0.08 },
  heart: { distance: 1.16, far: 70, fov: 36, near: 0.03, offsetX: 0.14, offsetY: 0.05, targetY: 0.03, yaw: 0.16 },
  kidneys: { distance: 1.2, far: 80, fov: 36, near: 0.03, offsetX: 0.08, offsetY: 0.04, targetY: 0.03, yaw: 0.17 },
  liver: { distance: 1.2, far: 80, fov: 36, near: 0.03, offsetX: 0.09, offsetY: 0.03, targetY: 0.03, yaw: 0.18 },
  oral: { distance: 1.08, far: 60, fixedPosition: [0, 0.45, 2.1], fixedTarget: [0, 0, 0], fov: 45, near: 0.02, offsetX: 0, offsetY: 0.02, targetY: 0, yaw: 0 },
  pancreas: { distance: 1.22, far: 70, fov: 37, near: 0.03, offsetX: 0.08, offsetY: 0.02, targetY: 0.02, yaw: 0.16 },
  skeleton: { distance: 1.2, far: 100, fov: 36, near: 0.04, offsetX: 0.02, offsetY: 0.02, targetY: 0.02, yaw: 0.04 },
};
const DEFAULT_LAYER_CAMERA_PRESET = { distance: 1.18, far: 100, fov: 36, near: 0.04, offsetX: 0, offsetY: 0, targetY: 0, yaw: 0 };
const LAYER_LIGHTING_PRESETS = {
  "body-navigator": { ambient: 0.82, exposure: 1.06, fill: 0.78, ground: "#d8d1c7", hemisphere: 0.82, key: 2.0, rim: 0.64, sky: "#ffffff" },
  brain: { ambient: 0.8, exposure: 1.06, fill: 0.78, ground: "#d8d1c7", hemisphere: 0.82, key: 1.95, rim: 0.64, sky: "#ffffff" },
  circulatory: { ambient: 0.82, exposure: 1.06, fill: 0.82, ground: "#d8d1c7", hemisphere: 0.82, key: 2.05, rim: 0.66, sky: "#ffffff" },
  digestive: { ambient: 0.78, exposure: 1.04, fill: 0.76, ground: "#d8d1c7", hemisphere: 0.82, key: 1.95, rim: 0.64, sky: "#ffffff" },
  heart: { ambient: 0.78, exposure: 1.06, fill: 0.78, ground: "#d8d1c7", hemisphere: 0.82, key: 2.02, rim: 0.68, sky: "#ffffff" },
  kidneys: { ambient: 0.78, exposure: 1.04, fill: 0.76, ground: "#d8d1c7", hemisphere: 0.82, key: 1.95, rim: 0.64, sky: "#ffffff" },
  liver: { ambient: 0.8, exposure: 1.06, fill: 0.8, ground: "#d8d1c7", hemisphere: 0.82, key: 2.0, rim: 0.66, sky: "#ffffff" },
  pancreas: { ambient: 0.8, exposure: 1.06, fill: 0.8, ground: "#d8d1c7", hemisphere: 0.82, key: 2.0, rim: 0.64, sky: "#ffffff" },
  skeleton: { ambient: 0.84, exposure: 1.08, fill: 0.82, ground: "#d8d1c7", hemisphere: 0.82, key: 2.08, rim: 0.68, sky: "#ffffff" },
};
const DEFAULT_LAYER_LIGHTING = {
  ambient: 0.76,
  exposure: 1.12,
  fill: 0.72,
  fillPosition: [-3.2, 2.6, 2.8],
  ground: "#d8cfc4",
  hemisphere: 1.08,
  key: 1.95,
  keyPosition: [3.4, 5.3, 4.2],
  rim: 0.82,
  rimPosition: [0, 2.5, -4.2],
  sky: "#ffffff",
};
const BODY_NAVIGATOR_HOTSPOTS = [
  { id: "brain", label: "Brain", organId: "brain", position: [0, 1.03, 0.48] },
  { id: "oral-cavity", label: "Oral Cavity", organId: "oral-cavity", position: [0, 0.82, 0.5] },
  { id: "heart", label: "Heart", organId: "heart", position: [0.08, 0.46, 0.5] },
  { id: "blood-iron", label: "Hematology & Iron", organId: "blood-iron", position: [-0.1, 0.52, 0.5] },
  { id: "liver", label: "Liver", organId: "liver", position: [-0.2, 0.16, 0.5] },
  { id: "gastrointestinal", label: "Gastrointestinal System", organId: "gastrointestinal", position: [0.01, -0.08, 0.5] },
  { id: "pancreas", label: "Pancreas", organId: "pancreas", position: [0.13, 0.1, 0.5] },
  { id: "kidneys", label: "Kidneys", organId: "kidneys", position: [0.26, -0.18, 0.46] },
  { id: "muscles", label: "Muscles", organId: "muscles", position: [0.2, 0.34, 0.5] },
  { id: "bones", label: "Bones", organId: "bones", position: [-0.08, -0.58, 0.47] },
];
const LAYER_MODEL_ROTATIONS = {
  oral: [0, Math.PI, 0],
};

export function NutriMapModelStage({ activeLayer = ANATOMY_LAYERS["full-body"], activeLayerId = activeLayer.id, drawerOpen = false, impactEmphasis = {}, selectOrgan, selectMuscleRegion, selectedOrganId, selectedMuscleRegionId = MUSCLE_REGION_DEFAULT_ID, showFallbackModel = true, size = "large", systems }) {
  const selectedOrgan = systems.find((system) => system.id === selectedOrganId);
  const relationshipIds = selectedOrgan?.connections || [];
  const isPreview = size === "preview";
  const [modelMetrics, setModelMetrics] = useState(DEFAULT_MODEL_METRICS);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(() => getInitialAutoRotatePreference());
  const [autoRotatePaused, setAutoRotatePaused] = useState(false);
  const [calibrationVersion, setCalibrationVersion] = useState(0);
  const autoRotateTimerRef = useRef(null);
  const calibrationEnabled = isCalibrationModeEnabled();

  function pauseAutoRotate() {
    setAutoRotatePaused(true);
    window.clearTimeout(autoRotateTimerRef.current);
    autoRotateTimerRef.current = window.setTimeout(() => setAutoRotatePaused(false), 7000);
  }

  function handleOrganSelection(organId) {
    if (!VALID_HOTSPOT_ORGAN_IDS.has(organId)) return;
    pauseAutoRotate();
    selectOrgan(organId);
  }

  return (
    <div className={`np-nutrimap-stage relative overflow-visible rounded-[32px] border border-[var(--np-color-border-soft)] bg-[radial-gradient(circle_at_center,rgba(95,168,163,0.13),var(--np-color-surface-muted)_48%,white)] ${isPreview ? "h-[440px] md:h-[520px]" : "h-[440px] md:h-[520px] xl:h-[620px]"} p-0`}>
      <StageGuides />
      <NutriMapModelErrorBoundary fallback={<StageErrorCard activeLayer={activeLayer} />}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ fov: 36, near: 0.05, far: 100, position: [0, 0, 6.4] }}
          shadows
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.22;
          }}
          style={{ height: "100%", width: "100%" }}
        >
          <ClinicalLayerLighting activeLayerId={activeLayerId} />
          {activeLayerId === "oral" ? null : <Environment preset="studio" />}
          <LayerRenderTuning activeLayerId={activeLayerId} />
          <OrbitControls
            enableDamping
            enablePan={false}
            enableRotate
            enableZoom
            makeDefault
            maxDistance={modelMetrics.scaledRadius * 4.8}
            minDistance={modelMetrics.scaledRadius * 1.25}
            autoRotate={autoRotateEnabled && !autoRotatePaused}
            autoRotateSpeed={0.32}
            onStart={pauseAutoRotate}
            target={[0, 0, 0]}
          />
          <Suspense fallback={<ModelLoadingFallback activeLayer={activeLayer} />}>
            <ModelLayerContent
              key={activeLayerId}
              activeLayer={activeLayer}
              activeLayerId={activeLayerId}
              calibrationEnabled={calibrationEnabled}
              calibrationVersion={calibrationVersion}
              drawerOpen={drawerOpen}
              impactEmphasis={impactEmphasis}
              modelMetrics={modelMetrics}
              onMetrics={setModelMetrics}
              relationshipIds={relationshipIds}
              selectOrgan={handleOrganSelection}
              selectMuscleRegion={selectMuscleRegion}
              selectedOrgan={selectedOrgan}
              selectedOrganId={selectedOrganId}
              selectedMuscleRegionId={selectedMuscleRegionId}
              showFallbackModel={showFallbackModel}
              systems={systems}
            />
          </Suspense>
        </Canvas>
      </NutriMapModelErrorBoundary>
      <ViewerControls
        activeLayerId={activeLayerId}
        autoRotateEnabled={autoRotateEnabled}
        modelMetrics={modelMetrics}
        setAutoRotateEnabled={(enabled) => {
          setAutoRotateEnabled(enabled);
          setAutoRotatePaused(false);
        }}
      />
      <ClinicalStatusLegend />
      {calibrationEnabled ? (
        <HotspotCalibrationPanel
          selectedOrganId={selectedOrganId}
          key={selectedOrganId}
          onCalibrationChange={() => setCalibrationVersion((version) => version + 1)}
        />
      ) : null}
      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-full border border-[var(--np-color-border-soft)] bg-white/85 px-4 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] shadow-[var(--np-shadow-sm)] sm:block">
        {activeLayer.caption}
      </div>
    </div>
  );
}

function StageGuides() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
      <div className="absolute left-1/2 top-[49%] h-[68%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(95_168_163_/_0.14)]" />
      <div className="absolute left-1/2 top-[49%] h-[50%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(201_168_106_/_0.16)]" />
      <div className="absolute inset-x-8 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgb(122_31_43_/_0.10),transparent)]" />
      <div className="absolute bottom-8 left-1/2 h-9 w-52 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgb(31_41_55_/_0.12),transparent_70%)]" />
    </div>
  );
}

function ClinicalLayerLighting({ activeLayerId }) {
  if (activeLayerId === "oral") return <OralLayerLighting />;

  const lighting = getLayerLighting(activeLayerId);
  return (
    <>
      <ambientLight intensity={lighting.ambient} />
      <hemisphereLight args={[lighting.sky, lighting.ground, lighting.hemisphere]} />
      <directionalLight
        castShadow
        intensity={lighting.key}
        position={lighting.keyPosition}
        shadow-bias={-0.0002}
        shadow-mapSize={[4096, 4096]}
      />
      <directionalLight intensity={lighting.fill} position={lighting.fillPosition} />
      <directionalLight intensity={lighting.rim} position={lighting.rimPosition} />
    </>
  );
}

function OralLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#fff4ee", "#b87979", 0.42]} />
      <directionalLight castShadow intensity={1.38} position={[1.4, 2.6, 3.8]} shadow-mapSize={[4096, 4096]} />
      <directionalLight intensity={0.58} position={[-2.2, 1.5, 2.4]} />
      <directionalLight intensity={0.24} position={[0, 1.8, -2.6]} />
    </>
  );
}

function getLayerLighting(activeLayerId) {
  return {
    ...DEFAULT_LAYER_LIGHTING,
    ...(LAYER_LIGHTING_PRESETS[activeLayerId] || {}),
  };
}

function LayerRenderTuning({ activeLayerId }) {
  const { gl } = useThree();

  useEffect(() => {
    const previousExposure = gl.toneMappingExposure;
    const previousShadowType = gl.shadowMap.type;
    const exposure = activeLayerId === "oral" ? 1.04 : getLayerLighting(activeLayerId).exposure;
    const shadowType = THREE.PCFShadowMap;
    tuneRendererForLayer(gl, exposure, shadowType);
    return () => {
      tuneRendererForLayer(gl, previousExposure, previousShadowType);
    };
  }, [activeLayerId, gl]);

  return null;
}

function tuneRendererForLayer(renderer, exposure, shadowType) {
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.type = shadowType;
}

function ClinicalStatusLegend() {
  const items = [
    ["Green", "Stable / OK"],
    ["Yellow", "Needs Review"],
    ["Orange", "Monitor Closely"],
    ["Red", "High Priority"],
    ["Gray", "No Data"],
  ];

  return (
    <div className="absolute bottom-4 left-4 z-20 max-w-[230px] rounded-[18px] border border-[var(--np-color-border-soft)] bg-white/88 p-3 shadow-[var(--np-shadow-sm)] backdrop-blur">
      <div className="grid grid-cols-1 gap-1.5">
        {items.map(([status, label]) => (
          <div className="flex items-center gap-2 text-[10px] font-extrabold text-[var(--np-color-text-muted)]" key={status}>
            <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(status)}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] font-bold leading-4 text-[var(--np-color-text-muted)]">
        Visualization for clinical context only.
      </p>
    </div>
  );
}

class NutriMapModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("NutriMap 3D stage failed", {
      error: error?.message || String(error),
    });
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

class LayerModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("NutriMap anatomy layer failed to load", {
      activeLayerId: this.props.activeLayerId,
      modelPath: this.props.modelPath,
      error: error?.message || String(error),
    });
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function StageErrorCard({ activeLayer }) {
  return (
    <div className="flex h-full min-h-[440px] items-center justify-center p-4">
      <div className="w-[min(420px,88vw)] rounded-[24px] border border-[var(--np-color-border-soft)] bg-white/94 p-5 text-center shadow-[var(--np-shadow-card)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
          Anatomy viewer unavailable
        </p>
        <h3 className="mt-2 text-lg font-extrabold text-[var(--np-color-text)]">{activeLayer?.title || "Selected anatomy"}</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
          The selected anatomy model could not be displayed. Use Back to Body Navigator or choose another system.
        </p>
      </div>
    </div>
  );
}

function ModelLayerContent({
  activeLayer,
  activeLayerId,
  calibrationEnabled,
  calibrationVersion,
  drawerOpen,
  impactEmphasis,
  modelMetrics,
  onMetrics,
  relationshipIds,
  selectOrgan,
  selectMuscleRegion,
  selectedOrgan,
  selectedOrganId,
  selectedMuscleRegionId,
  showFallbackModel,
  systems,
}) {
  const isBodyNavigatorLayer = activeLayerId === "body-navigator";
  const isSpecialLayer = activeLayerId !== "full-body" && activeLayerId !== "muscles" && !isBodyNavigatorLayer;
  const fallbackMessage = {
    brain: "Brain layer unavailable",
    circulatory: "Cardiovascular layer unavailable",
    digestive: "GI layer unavailable",
    heart: "Heart layer unavailable",
    kidneys: "Kidneys layer unavailable",
    liver: "Liver layer unavailable",
    oral: "Oral Cavity layer unavailable",
    pancreas: "Pancreas layer unavailable",
    skeleton: "Skeleton layer unavailable",
  }[activeLayerId] || "Anatomy layer unavailable";
  const modelUrl = getLayerModelUrl(activeLayer);
  const modelKey = `${activeLayerId}-${activeLayer.cacheVersion || "base"}`;
  const anatomyModel = (
    <AnatomyModel
      key={modelKey}
      activeLayerId={activeLayerId}
      calibrationEnabled={calibrationEnabled}
      modelPath={modelUrl}
      onMetrics={onMetrics}
      selectOrgan={selectOrgan}
      selectedOrganId={selectedOrganId}
      systems={systems}
      targetHeight={activeLayer.targetHeight}
    />
  );

  return (
    <>
      <LayerModelErrorBoundary
        fallback={showFallbackModel ? (
          <>
            <AnatomyModel
              activeLayerId="full-body"
              calibrationEnabled={calibrationEnabled}
              modelPath={getLayerModelUrl(ANATOMY_LAYERS["full-body"])}
              onMetrics={onMetrics}
              selectOrgan={selectOrgan}
              selectedOrganId={selectedOrganId}
              systems={systems}
              targetHeight={ANATOMY_LAYERS["full-body"].targetHeight}
            />
            <Html center position={[0, -1.35, 0.42]} transform={false}>
              <span className="rounded-full border border-[var(--np-color-border-soft)] bg-white/92 px-4 py-2 text-xs font-extrabold text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)]">
                {fallbackMessage}
              </span>
            </Html>
          </>
        ) : (
          <Html center position={[0, 0, 0]} transform={false}>
            <div className="w-[min(360px,80vw)] rounded-[24px] border border-[var(--np-color-border-soft)] bg-white/94 p-5 text-center shadow-[var(--np-shadow-card)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
                Anatomy model unavailable
              </p>
              <h3 className="mt-2 text-lg font-extrabold text-[var(--np-color-text)]">{activeLayer.title || selectedOrgan?.label || "Selected anatomy"}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                {fallbackMessage}. Return to Body Navigator or select another system.
              </p>
            </div>
          </Html>
        )}
        activeLayerId={activeLayerId}
        modelPath={modelUrl}
        resetKey={activeLayerId}
      >
        {anatomyModel}
      </LayerModelErrorBoundary>
      {isBodyNavigatorLayer ? (
        <BodyNavigatorHotspots
          selectOrgan={selectOrgan}
          selectedOrganId={selectedOrganId}
        />
      ) : isSpecialLayer ? null : activeLayerId === "muscles" ? (
        <MuscleRegionHotspots
          activeImpactId={Object.entries(impactEmphasis).find(([systemId]) => systemId === "muscles")?.[1] || "none"}
          selectMuscleRegion={selectMuscleRegion}
          selectedMuscleRegionId={selectedMuscleRegionId}
        />
      ) : (
        <OrganHotspots
          impactEmphasis={impactEmphasis}
          calibrationVersion={calibrationVersion}
          relationshipIds={relationshipIds}
          selectOrgan={selectOrgan}
          selectedOrganId={selectedOrganId}
          systems={systems}
        />
      )}
      <CameraRig activeLayerId={activeLayerId} drawerOpen={drawerOpen} modelMetrics={modelMetrics} selectedMuscleRegionId={selectedMuscleRegionId} selectedOrgan={selectedOrgan} selectedOrganId={selectedOrganId} />
      <ShadowDisk modelMetrics={modelMetrics} />
      <ContactShadows
        blur={2.4}
        far={modelMetrics.scaledRadius * 2.1}
        frames={1}
        opacity={0.16}
        position={[0, modelMetrics.footY - 0.035, 0]}
        scale={Math.max(2.2, modelMetrics.scaledWidth * 1.6)}
      />
    </>
  );
}

function AnatomyModel({ activeLayerId, calibrationEnabled, modelPath, onMetrics, selectOrgan, selectedOrganId, systems, targetHeight }) {
  const gltf = useGLTF(modelPath);
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const modelMetrics = useMemo(() => calculateModelMetrics(scene, targetHeight), [scene, targetHeight]);
  const organMeshMap = useMemo(() => activeLayerId === "full-body" ? detectOrganMeshes(scene, systems) : {}, [activeLayerId, scene, systems]);
  const separateOrganMeshes = Object.keys(organMeshMap).length > 1;
  const modelRotation = LAYER_MODEL_ROTATIONS[activeLayerId] || [0, 0, 0];

  useEffect(() => {
    scene.traverse((object) => {
      if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material && activeLayerId !== "oral") {
          object.material = prepareClinicalMaterial(object.material);
      }
    });
    onMetrics(modelMetrics);
  }, [activeLayerId, modelMetrics, onMetrics, scene]);

  useFrame(() => {
    if (!separateOrganMeshes) return;
    scene.traverse((object) => {
      if (!object.isMesh || !object.material) return;
      const matchedSystemId = findSystemIdForMesh(object.name, systems);
      const isActive = matchedSystemId === selectedOrganId;
      object.material.emissive = object.material.emissive || new THREE.Color("#000000");
      object.material.emissive.set(isActive ? "#7A1F2B" : "#000000");
      object.material.emissiveIntensity = isActive ? 0.32 : 0;
    });
  });

  return (
    <primitive
      object={scene}
      onClick={(event) => {
        if (calibrationEnabled && event.point) {
          const localPoint = event.point.clone();
          console.info("NutriMap calibration point", {
            selectedOrganId,
            modelLocalApprox: [Number(localPoint.x.toFixed(3)), Number(localPoint.y.toFixed(3)), Number(localPoint.z.toFixed(3))],
            world: [Number(event.point.x.toFixed(3)), Number(event.point.y.toFixed(3)), Number(event.point.z.toFixed(3))],
          });
        }
        if (!separateOrganMeshes) return;
        event.stopPropagation();
        const systemId = findSystemIdForMesh(event.object.name, systems);
        if (systemId) selectOrgan(systemId);
      }}
      scale={modelMetrics.scale}
      position={modelMetrics.center.clone().multiplyScalar(-modelMetrics.scale)}
      rotation={modelRotation}
    />
  );
}

function OrganHotspots({ calibrationVersion, impactEmphasis, relationshipIds, selectOrgan, selectedOrganId, systems }) {
  const renderedHotspots = useMemo(() => NUTRIMAP_HOTSPOTS.map((hotspot) => {
    const system = systems.find((item) => item.id === hotspot.organId);
    if (!system || !VALID_HOTSPOT_ORGAN_IDS.has(hotspot.organId)) return null;
    const calibratedHotspot = getCalibratedHotspot(hotspot.organId);
    return {
      active: selectedOrganId === hotspot.organId,
      calibratedHotspot,
      dimUnrelated: Object.keys(impactEmphasis).length > 0 && (impactEmphasis[hotspot.organId] || "none") === "none",
      emphasis: impactEmphasis[hotspot.organId] || "none",
      hotspot,
      position: hotspotPositionToVector(calibratedHotspot),
      relationship: relationshipIds.includes(hotspot.organId),
      status: normalizeClinicalStatus(system.status),
      system,
    };
  }).filter(Boolean), [impactEmphasis, relationshipIds, selectedOrganId, systems]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const duplicates = NUTRIMAP_HOTSPOTS.reduce((acc, hotspot) => {
      acc[hotspot.organId] = (acc[hotspot.organId] || 0) + 1;
      return acc;
    }, {});
    const duplicateIds = Object.entries(duplicates).filter(([, count]) => count > 1).map(([organId]) => organId);
    if (duplicateIds.length) {
      console.warn("NutriMap duplicate hotspot organ ids", duplicateIds);
    }
    console.debug("NutriMap rendered hotspots", renderedHotspots.map((item) => ({
      hotspotId: item.hotspot.id,
      organId: item.hotspot.organId,
      systemId: item.system.id,
    })));
  }, [renderedHotspots]);

  return (
    <>
      {renderedHotspots.map((item) => {
        void calibrationVersion;
        return (
          <Html center key={item.hotspot.organId} occlude position={item.position} transform={false} zIndexRange={[60, 20]}>
            <OrganHotspotButton
              selectedOrganId={selectedOrganId}
              item={item}
              onSelect={selectOrgan}
            />
          </Html>
        );
      })}
    </>
  );
}

function MuscleRegionHotspots({ activeImpactId, selectMuscleRegion, selectedMuscleRegionId }) {
  const proteinImpactActive = activeImpactId === "primary" || activeImpactId === "secondary";
  return (
    <>
      {MUSCLE_REGION_HOTSPOTS.map((region) => {
        const active = selectedMuscleRegionId === region.id;
        const dimmed = selectedMuscleRegionId !== MUSCLE_REGION_DEFAULT_ID && !active;
        return (
          <Html center key={region.id} occlude position={region.position} transform={false} zIndexRange={[62, 20]}>
            <div className={`group relative ${region.mobileVisible ? "flex" : "hidden sm:flex"} ${dimmed ? "opacity-45" : "opacity-100"}`}>
              <button
                aria-label={`Muscle region: ${region.label}`}
                aria-pressed={active}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[rgb(122_31_43_/_0.16)] ${active ? "nutrimap-marker-active" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  event.nativeEvent?.stopImmediatePropagation?.();
                  selectMuscleRegion?.(region.id);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.nativeEvent?.stopImmediatePropagation?.();
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  event.nativeEvent?.stopImmediatePropagation?.();
                }}
                title={region.label}
                type="button"
              >
                <span className={`flex items-center justify-center rounded-full border-2 border-white bg-white shadow-[var(--np-shadow-sm)] transition ${active ? "h-[21px] w-[21px] ring-4 ring-[rgb(122_31_43_/_0.16)]" : "h-4 w-4"} ${proteinImpactActive ? "ring-2 ring-[rgb(95_168_163_/_0.18)]" : ""}`}>
                  <span className={`rounded-full ${active ? "h-2.5 w-2.5 bg-[var(--np-color-brand)]" : "h-2 w-2 bg-[var(--np-color-secondary)]"}`} />
                </span>
              </button>
              <div className={`pointer-events-none absolute left-1/2 top-10 z-50 w-max max-w-44 -translate-x-1/2 rounded-[14px] border border-[var(--np-color-border-soft)] bg-white/95 px-3 py-2 text-left text-xs font-extrabold text-[var(--np-color-text)] shadow-[var(--np-shadow-card)] ${active ? "block" : "hidden group-hover:block group-focus-within:block"}`}>
                {region.label}
              </div>
            </div>
          </Html>
        );
      })}
    </>
  );
}

function BodyNavigatorHotspots({ selectOrgan, selectedOrganId }) {
  const TAP_THRESHOLD = 10;
  const pointerStateRef = useRef({
    dragging: false,
    organId: "",
    startX: 0,
    startY: 0,
    suppressClick: false,
  });

  const handlePointerDown = useCallback((event, organId) => {
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
    pointerStateRef.current = {
      dragging: false,
      organId,
      startX: event.clientX,
      startY: event.clientY,
      suppressClick: false,
    };
  }, []);

  const handlePointerMove = useCallback((event) => {
    const state = pointerStateRef.current;
    const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
    if (distance > TAP_THRESHOLD) {
      state.dragging = true;
      state.suppressClick = true;
    }
  }, []);

  const handlePointerUp = useCallback((event, organId) => {
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
    const state = pointerStateRef.current;
    const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
    const isTap = state.organId === organId && distance <= TAP_THRESHOLD && !state.dragging;
    if (isTap) {
      state.suppressClick = true;
      selectOrgan(organId);
    }
    window.setTimeout(() => {
      pointerStateRef.current.suppressClick = false;
    }, 90);
  }, [selectOrgan]);

  const handleClick = useCallback((event, organId) => {
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
    if (pointerStateRef.current.suppressClick) {
      event.preventDefault();
      return;
    }
    selectOrgan(organId);
  }, [selectOrgan]);

  const handleKeyDown = useCallback((event, organId) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    selectOrgan(organId);
  }, [selectOrgan]);

  return (
    <>
      {BODY_NAVIGATOR_HOTSPOTS.map((hotspot) => {
        const active = selectedOrganId === hotspot.organId;
        return (
          <Html center key={hotspot.id} occlude position={hotspot.position} transform={false} zIndexRange={[64, 20]}>
            <div className="group relative flex">
              <button
                aria-label={`Open ${hotspot.label} anatomy layer`}
                aria-pressed={active}
                className={`relative flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[rgb(122_31_43_/_0.16)] ${active ? "nutrimap-marker-active" : ""}`}
                onClick={(event) => {
                  handleClick(event, hotspot.organId);
                }}
                onPointerDown={(event) => {
                  handlePointerDown(event, hotspot.organId);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => {
                  handlePointerUp(event, hotspot.organId);
                }}
                onKeyDown={(event) => {
                  handleKeyDown(event, hotspot.organId);
                }}
                title={hotspot.label}
                type="button"
              >
                <span className={`flex items-center justify-center rounded-full border-2 border-white bg-white shadow-[var(--np-shadow-sm)] transition ${active ? "h-[22px] w-[22px] ring-4 ring-[rgb(122_31_43_/_0.18)]" : "h-4 w-4"}`}>
                  <span className={`rounded-full ${active ? "h-2.5 w-2.5 bg-[var(--np-color-brand)]" : "h-2 w-2 bg-[var(--np-color-secondary)]"}`} />
                </span>
              </button>
              <div className={`pointer-events-none absolute left-1/2 top-11 z-50 w-max max-w-48 -translate-x-1/2 rounded-[14px] border border-[var(--np-color-border-soft)] bg-white/95 px-3 py-2 text-left text-xs font-extrabold text-[var(--np-color-text)] shadow-[var(--np-shadow-card)] ${active ? "block" : "hidden group-hover:block group-focus-within:block"}`}>
                {hotspot.label}
              </div>
            </div>
          </Html>
        );
      })}
    </>
  );
}

function OrganHotspotButton({ item, onSelect, selectedOrganId }) {
  const { active, calibratedHotspot, dimUnrelated, emphasis, hotspot, relationship, status, system } = item;
  const handleSelect = useCallback((event) => {
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
    if (import.meta.env.DEV) {
      console.debug("HOTSPOT_CLICK", {
        hotspotId: hotspot.id,
        organId: hotspot.organId,
      });
      console.debug("NutriMap hotspot click", {
        hotspotId: hotspot.id,
        organId: hotspot.organId,
        previousSelectedOrganId: selectedOrganId,
      });
    }
    onSelect(hotspot.organId);
  }, [hotspot.id, hotspot.organId, onSelect, selectedOrganId]);

  const stopHotspotEvent = useCallback((event) => {
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
  }, []);

  return (
    <div className={`group relative ${dimUnrelated ? "opacity-35" : "opacity-100"}`}>
      <button
        aria-label={`${system.label}: ${status}`}
        aria-pressed={active}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[rgb(122_31_43_/_0.18)] ${hotspotClass(active, emphasis, relationship)}`}
        data-organ-id={hotspot.organId}
        onClick={handleSelect}
        onDoubleClick={stopHotspotEvent}
        onPointerDown={stopHotspotEvent}
        onPointerUp={stopHotspotEvent}
        title={system.label}
        type="button"
      >
        <span
          className={`flex items-center justify-center rounded-full border-2 border-white bg-white shadow-[var(--np-shadow-sm)] transition ${active ? "h-[22px] w-[22px] ring-4 ring-[rgb(122_31_43_/_0.18)]" : "h-4 w-4"}`}
          style={{ transform: `scale(${active ? calibratedHotspot.selectedScale : calibratedHotspot.maxScale})` }}
        >
          <span className={`rounded-full ${active ? "h-2.5 w-2.5" : "h-2 w-2"} ${statusDotClass(status)}`} />
        </span>
      </button>
      <div className="pointer-events-none absolute left-1/2 top-11 z-50 hidden w-44 -translate-x-1/2 rounded-[14px] border border-[var(--np-color-border-soft)] bg-white/95 p-3 text-left shadow-[var(--np-shadow-card)] group-hover:block group-focus-within:block">
        <p className="text-xs font-extrabold text-[var(--np-color-text)]">{system.label}</p>
        <p className="mt-1 text-[11px] font-bold text-[var(--np-color-text-muted)]">{status}</p>
        <p className="mt-2 text-[10px] font-bold text-[var(--np-color-text-muted)]">{system.risks?.length || 0} related data item(s)</p>
        <p className="text-[10px] font-bold text-[var(--np-color-text-muted)]">{system.labs?.length || 0} related lab value(s)</p>
      </div>
    </div>
  );
}

function HotspotCalibrationPanel({ onCalibrationChange, selectedOrganId }) {
  const [position, setPosition] = useState(() => getCalibratedHotspot(selectedOrganId).localPosition);

  function adjust(axis, amount) {
    setPosition((current) => current.map((value, index) => index === axis ? Number((value + amount).toFixed(3)) : value));
  }

  function save() {
    saveCalibratedHotspot(selectedOrganId, position);
    onCalibrationChange();
  }

  function reset() {
    resetCalibratedHotspot(selectedOrganId);
    setPosition(getNutriMapHotspot(selectedOrganId).localPosition);
    onCalibrationChange();
  }

  async function copy() {
    await navigator.clipboard?.writeText(`[${position.map((value) => value.toFixed(3)).join(", ")}]`);
  }

  return (
    <div className="absolute bottom-4 right-4 z-30 w-[280px] rounded-[18px] border border-[var(--np-color-border-soft)] bg-white/95 p-3 shadow-[var(--np-shadow-card)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">Development calibration mode</p>
      <p className="mt-1 text-[11px] font-bold text-[var(--np-color-text-muted)]">{selectedOrganId}: [{position.map((value) => value.toFixed(3)).join(", ")}]</p>
      <div className="mt-3 space-y-2">
        {["X", "Y", "Z"].map((axis, axisIndex) => (
          <div className="flex items-center justify-between gap-1" key={axis}>
            <span className="w-5 text-xs font-extrabold">{axis}</span>
            {[-0.1, -0.05, -0.01, 0.01, 0.05, 0.1].map((step) => (
              <button className="h-7 rounded-full border border-[var(--np-color-border-soft)] px-2 text-[10px] font-bold" key={step} onClick={() => adjust(axisIndex, step)} type="button">
                {step > 0 ? "+" : ""}{step}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="np-button np-button-primary min-h-9 px-3 py-1 text-xs" onClick={save} type="button">Save local</button>
        <button className="np-button np-button-secondary min-h-9 px-3 py-1 text-xs" onClick={copy} type="button">Copy</button>
        <button className="np-button np-button-secondary min-h-9 px-3 py-1 text-xs" onClick={reset} type="button">Reset</button>
      </div>
    </div>
  );
}

function CameraRig({ activeLayerId, drawerOpen, modelMetrics, selectedMuscleRegionId, selectedOrgan, selectedOrganId }) {
  const { camera, controls } = useThree();
  const cameraRef = useRef(camera);
  const transitionRef = useRef({ duration: 1, remaining: 0 });
  const startPositionRef = useRef(camera.position.clone());
  const startTargetRef = useRef(new THREE.Vector3());
  const manualTargetRef = useRef(null);
  const manualPositionRef = useRef(null);
  const initialView = useMemo(() => reframeViewerForPanel(modelMetrics, drawerOpen), [drawerOpen, modelMetrics]);
  const activePreset = useMemo(() => getOrganCameraPreset(selectedOrgan, modelMetrics, drawerOpen, activeLayerId, selectedMuscleRegionId), [activeLayerId, drawerOpen, modelMetrics, selectedMuscleRegionId, selectedOrgan]);
  const selectedTarget = activePreset.target;
  const desiredCameraPosition = activePreset.position;

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    const activeCamera = cameraRef.current;
    activeCamera.near = activePreset.near || 0.04;
    activeCamera.far = activePreset.far || 100;
    activeCamera.fov = activePreset.fov || 36;
    activeCamera.updateProjectionMatrix();
  }, [activePreset.far, activePreset.fov, activePreset.near]);

  useEffect(() => {
    startPositionRef.current = camera.position.clone();
    startTargetRef.current = controls?.target?.clone?.() || new THREE.Vector3();
    transitionRef.current = { duration: 58, remaining: 58 };
    manualPositionRef.current = null;
    manualTargetRef.current = null;
  }, [activeLayerId, camera, controls, drawerOpen, selectedMuscleRegionId, selectedOrganId]);

  useEffect(() => {
    const setView = (event) => {
      const view = event.detail || initialView;
      startPositionRef.current = camera.position.clone();
      startTargetRef.current = controls?.target?.clone?.() || new THREE.Vector3();
      manualPositionRef.current = new THREE.Vector3(...view.position);
      manualTargetRef.current = new THREE.Vector3(...view.target);
      transitionRef.current = { duration: 42, remaining: 42 };
    };
    const zoomView = (event) => {
      const direction = event.detail?.direction === "in" ? -1 : 1;
      const zoomStep = modelMetrics.scaledRadius * 0.35 * direction;
      const currentDirection = camera.position.clone().sub(controls?.target || new THREE.Vector3()).normalize();
      startPositionRef.current = camera.position.clone();
      startTargetRef.current = controls?.target?.clone?.() || new THREE.Vector3();
      manualPositionRef.current = camera.position.clone().add(currentDirection.multiplyScalar(zoomStep));
      manualTargetRef.current = controls?.target?.clone?.() || new THREE.Vector3();
      transitionRef.current = { duration: 28, remaining: 28 };
    };
    window.addEventListener("nutrimap:set-view", setView);
    window.addEventListener("nutrimap:zoom", zoomView);
    return () => {
      window.removeEventListener("nutrimap:set-view", setView);
      window.removeEventListener("nutrimap:zoom", zoomView);
    };
  }, [camera, controls, initialView, modelMetrics.scaledRadius]);

  useFrame(() => {
    if (transitionRef.current.remaining <= 0) return;
    const targetPosition = manualPositionRef.current || desiredCameraPosition;
    const targetLookAt = manualTargetRef.current || selectedTarget;
    const elapsed = transitionRef.current.duration - transitionRef.current.remaining + 1;
    const progress = Math.min(elapsed / transitionRef.current.duration, 1);
    const easedProgress = easeInOutCubic(progress);
    camera.position.lerpVectors(startPositionRef.current, targetPosition, easedProgress);
    if (controls?.target) {
      controls.target.lerpVectors(startTargetRef.current, targetLookAt, easedProgress);
      controls.update();
    }
    transitionRef.current.remaining -= 1;
  });

  return null;
}

function ShadowDisk({ modelMetrics }) {
  return (
    <mesh receiveShadow position={[0, modelMetrics.footY - 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[Math.max(0.85, modelMetrics.scaledWidth * 0.62), 64]} />
      <shadowMaterial opacity={0.14} />
    </mesh>
  );
}

function ViewerControls({ activeLayerId, autoRotateEnabled, modelMetrics, setAutoRotateEnabled }) {
  const view = getLayerCameraView(activeLayerId, modelMetrics);

  function setView(type) {
    window.dispatchEvent(new CustomEvent("nutrimap:set-view", { detail: getViewerPreset(type, modelMetrics, activeLayerId) }));
  }

  function zoom(direction) {
    window.dispatchEvent(new CustomEvent("nutrimap:zoom", { detail: { direction } }));
  }

  return (
    <>
    <div className="absolute right-4 top-4 z-20 hidden flex-col gap-2 transition-[right] md:flex">
      {[
        ["reset", "Reset", RotateCcw, () => window.dispatchEvent(new CustomEvent("nutrimap:set-view", { detail: view }))],
        ["front", "Front", LocateFixed, () => setView("front")],
        ["left", "Left", ArrowLeft, () => setView("left")],
        ["right", "Right", ArrowRight, () => setView("right")],
        ["zoom-in", "Zoom In", ZoomIn, () => zoom("in")],
        ["zoom-out", "Zoom Out", Minus, () => zoom("out")],
      ].map(([id, label, Icon, action]) => (
        <button
          aria-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--np-color-border-soft)] bg-white/90 text-[var(--np-color-text-muted)] shadow-[var(--np-shadow-sm)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
          key={id}
          onClick={action}
          title={label}
          type="button"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <button
        aria-label="Auto Rotate"
        aria-pressed={autoRotateEnabled}
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-[var(--np-shadow-sm)] transition ${autoRotateEnabled ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white" : "border-[var(--np-color-border-soft)] bg-white/90 text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"}`}
        onClick={() => setAutoRotateEnabled(!autoRotateEnabled)}
        title="Auto Rotate"
        type="button"
      >
        <Rotate3D className="h-4 w-4" />
      </button>
    </div>
    <details className="absolute right-3 top-3 z-30 md:hidden">
      <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[var(--np-color-border-soft)] bg-white/95 text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)] [&::-webkit-details-marker]:hidden">
        <Maximize2 className="h-4 w-4" />
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white/95 p-2 shadow-[var(--np-shadow-card)]">
        {[
          ["Reset", RotateCcw, () => window.dispatchEvent(new CustomEvent("nutrimap:set-view", { detail: view }))],
          ["Front", LocateFixed, () => setView("front")],
          ["Left", ArrowLeft, () => setView("left")],
          ["Right", ArrowRight, () => setView("right")],
          ["Zoom In", ZoomIn, () => zoom("in")],
          ["Zoom Out", Minus, () => zoom("out")],
        ].map(([label, Icon, action]) => (
          <button aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)]" key={label} onClick={action} type="button">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button aria-label="Auto Rotate" aria-pressed={autoRotateEnabled} className={`col-span-2 flex h-10 items-center justify-center rounded-full border text-xs font-extrabold ${autoRotateEnabled ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white" : "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)]"}`} onClick={() => setAutoRotateEnabled(!autoRotateEnabled)} type="button">
          Auto Rotate
        </button>
      </div>
    </details>
    </>
  );
}

function ModelLoadingFallback({ activeLayer }) {
  const { progress } = useProgress();
  const safeProgress = Number.isFinite(progress) ? Math.round(progress) : 0;

  return (
    <Html center transform={false}>
      <div className="min-w-52 rounded-[20px] border border-[var(--np-color-border-soft)] bg-white/92 p-4 text-center shadow-[var(--np-shadow-card)]">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[rgb(122_31_43_/_0.18)] border-t-[var(--np-color-brand)]" />
        <p className="mt-3 text-sm font-extrabold text-[var(--np-color-text)]">
          Loading anatomy model...
        </p>
        <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
          {activeLayer?.title || activeLayer?.caption || activeLayer?.id || "Anatomy layer"} · {safeProgress}%
        </p>
      </div>
    </Html>
  );
}

function hotspotPositionToVector(hotspot) {
  const localPosition = hotspot.localPosition || [0, 0, 0.28];
  const visualOffset = hotspot.visualOffset || [0, 0, 0];
  return [
    localPosition[0] + visualOffset[0],
    localPosition[1] + visualOffset[1],
    localPosition[2] + visualOffset[2],
  ];
}

function calculateModelMetrics(scene, targetHeight = TARGET_MODEL_HEIGHT) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const safeHeight = size.y || DEFAULT_MODEL_METRICS.height;
  const scale = targetHeight / safeHeight;
  const scaledHeight = safeHeight * scale;
  const scaledWidth = (size.x || DEFAULT_MODEL_METRICS.width) * scale;
  const scaledDepth = (size.z || DEFAULT_MODEL_METRICS.depth) * scale;
  const scaledRadius = (sphere.radius || DEFAULT_MODEL_METRICS.boundingSphereRadius) * scale;

  return {
    boundingSphereRadius: sphere.radius || DEFAULT_MODEL_METRICS.boundingSphereRadius,
    center,
    depth: size.z || DEFAULT_MODEL_METRICS.depth,
    footY: box.min.y * scale - center.y * scale,
    headY: box.max.y * scale - center.y * scale,
    height: safeHeight,
    scale,
    scaledDepth,
    scaledHeight,
    scaledRadius,
    scaledWidth,
    width: size.x || DEFAULT_MODEL_METRICS.width,
  };
}

function getInitialView(modelMetrics) {
  const fovRadians = THREE.MathUtils.degToRad(36);
  const distance = (modelMetrics.scaledRadius / Math.tan(fovRadians / 2)) * DEFAULT_LAYER_CAMERA_PRESET.distance;
  return {
    distance,
    maxDistance: modelMetrics.scaledRadius * 4.8,
    minDistance: modelMetrics.scaledRadius * 1.25,
    position: [0, 0, distance],
    target: [0, 0, 0],
  };
}

function getLayerCameraView(activeLayerId, modelMetrics, drawerOpen = false) {
  const preset = LAYER_CAMERA_PRESETS[activeLayerId] || DEFAULT_LAYER_CAMERA_PRESET;
  const fov = preset.fov || 36;
  if (preset.fixedPosition && preset.fixedTarget) {
    const panelShift = drawerOpen ? -modelMetrics.scaledWidth * 0.1 : 0;
    const position = [...preset.fixedPosition];
    const target = [...preset.fixedTarget];
    position[0] += panelShift;
    target[0] += panelShift;

    return {
      distance: position[2],
      far: preset.far,
      fov,
      maxDistance: modelMetrics.scaledRadius * 4.8,
      minDistance: modelMetrics.scaledRadius * 0.8,
      near: preset.near,
      position,
      target,
      yaw: preset.yaw,
    };
  }

  const fovRadians = THREE.MathUtils.degToRad(fov);
  const fitDistance = modelMetrics.scaledRadius / Math.tan(fovRadians / 2);
  const panelShift = drawerOpen ? -modelMetrics.scaledWidth * 0.1 : 0;
  const distance = fitDistance * preset.distance;
  const position = [
    modelMetrics.scaledWidth * preset.offsetX + panelShift,
    modelMetrics.scaledHeight * preset.offsetY,
    distance,
  ];
  const target = [
    panelShift,
    modelMetrics.scaledHeight * preset.targetY,
    0,
  ];

  return {
    distance,
    far: preset.far,
    fov,
    maxDistance: modelMetrics.scaledRadius * 4.8,
    minDistance: modelMetrics.scaledRadius * 1.18,
    near: preset.near,
    position,
    target,
    yaw: preset.yaw,
  };
}

function reframeViewerForPanel(modelMetrics, drawerOpen) {
  const initialView = getInitialView(modelMetrics);
  if (!drawerOpen) return initialView;
  const shift = -modelMetrics.scaledWidth * 0.12;
  return {
    ...initialView,
    distance: initialView.distance * 1.08,
    position: [shift, 0, initialView.distance * 1.08],
    target: [shift, 0, 0],
  };
}

function getViewerPreset(type, modelMetrics, activeLayerId = "full-body") {
  const initialView = getLayerCameraView(activeLayerId, modelMetrics);
  if (type === "left") {
    return {
      ...initialView,
      position: [-initialView.distance, 0, 0],
    };
  }
  if (type === "right") {
    return {
      ...initialView,
      position: [initialView.distance, 0, 0],
    };
  }
  return initialView;
}

function getOrganCameraPreset(system, modelMetrics, drawerOpen = false, activeLayerId = "full-body", selectedMuscleRegionId = MUSCLE_REGION_DEFAULT_ID) {
  if (activeLayerId !== "full-body" && activeLayerId !== "muscles") {
    const view = getLayerCameraView(activeLayerId, modelMetrics, drawerOpen);
    return {
      anchor: [0, 0, 0],
      far: view.far,
      fov: view.fov,
      module: system?.id === "heart" ? "assessment" : system?.id === "oral-cavity" || system?.id === "gastrointestinal" ? "dietary" : system?.id === "liver" ? "intervention" : "laboratory",
      position: new THREE.Vector3(...view.position),
      near: view.near,
      rotation: [0, view.yaw, 0],
      target: new THREE.Vector3(...view.target),
    };
  }

  if (activeLayerId === "muscles" && selectedMuscleRegionId !== MUSCLE_REGION_DEFAULT_ID) {
    const region = getMuscleRegion(selectedMuscleRegionId);
    const anchor = region.position || [0, 0, 0.42];
    const targetOffset = region.cameraTargetOffset || [0, 0, 0];
    const baseView = reframeViewerForPanel(modelMetrics, drawerOpen);
    const panelShift = drawerOpen ? -modelMetrics.scaledWidth * 0.1 : 0;
    const target = new THREE.Vector3(
      anchor[0] * 0.42 + targetOffset[0] + panelShift,
      anchor[1] * 0.52 + targetOffset[1],
      0,
    );
    return {
      anchor,
      far: 100,
      fov: 36,
      module: "assessment",
      position: new THREE.Vector3(target.x * 0.42, target.y * 0.16, baseView.distance * 0.92),
      near: 0.04,
      rotation: [0, target.x * 0.08, 0],
      target,
    };
  }

  const hotspot = getCalibratedHotspot(system?.id);
  const anchor = hotspotPositionToVector(hotspot);
  const preset = hotspot.cameraPreset || {};
  const anchorTarget = new THREE.Vector3(anchor[0] * 0.42, anchor[1] * 0.72, 0).add(new THREE.Vector3(...(preset.targetOffset || [0, 0, 0])));
  const baseView = reframeViewerForPanel(modelMetrics, drawerOpen);
  const distance = baseView.distance * (preset.distanceScale || 0.96);
  const panelShift = drawerOpen ? -modelMetrics.scaledWidth * 0.1 : 0;
  const sideBias = {
    bones: 0.16,
    heart: 0.12,
    kidneys: -0.14,
    liver: 0.16,
    muscles: -0.08,
    pancreas: 0.14,
  }[system?.id] || 0;

  return {
    anchor,
    far: 100,
    fov: 36,
    module: {
      "blood-iron": "laboratory",
      bones: "laboratory",
      brain: "ai",
      gastrointestinal: "dietary",
      heart: "assessment",
      kidneys: "laboratory",
      liver: "intervention",
      muscles: "assessment",
      "oral-cavity": "dietary",
      pancreas: "laboratory",
    }[system?.id] || "summary",
    position: new THREE.Vector3(anchorTarget.x + sideBias + panelShift, anchorTarget.y * 0.18, distance),
    near: 0.04,
    rotation: [0, sideBias, 0],
    target: anchorTarget.clone().add(new THREE.Vector3(panelShift, 0, 0)),
  };
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2;
}

function isCalibrationModeEnabled() {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return localStorage.getItem("nutripilot.nutrimap.calibrationMode") === "true";
}

function getInitialAutoRotatePreference() {
  if (typeof window === "undefined") return false;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return !isMobile && !reducedMotion;
}

function detectOrganMeshes(scene, systems) {
  const matches = {};
  scene.traverse((object) => {
    if (!object.isMesh) return;
    const systemId = findSystemIdForMesh(object.name, systems);
    if (systemId) matches[systemId] = object.name;
  });
  return matches;
}

function findSystemIdForMesh(meshName = "", systems) {
  const normalizedName = normalizeName(meshName);
  return systems.find((system) => {
    const labels = [system.id, system.label, system.shortLabel].filter(Boolean).map(normalizeName);
    return labels.some((label) => normalizedName.includes(label));
  })?.id;
}

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function prepareClinicalMaterial(sourceMaterial) {
  const material = Array.isArray(sourceMaterial)
    ? sourceMaterial.map((item) => item?.clone?.() || item)
    : sourceMaterial.clone();
  const materials = Array.isArray(material) ? material : [material];

  materials.forEach((item) => {
    if (!item) return;
    applyTextureColorSpace(item);
    item.transparent = false;
    item.opacity = 1;
    item.needsUpdate = true;
  });

  return material;
}

function getLayerModelUrl(layer) {
  const resolvedPath = getPublicAssetUrl(layer.modelPath);
  if (!layer?.cacheVersion) return resolvedPath;
  return `${resolvedPath}?v=${layer.cacheVersion}`;
}

function getPublicAssetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = PUBLIC_BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function applyTextureColorSpace(material) {
  const srgbMaps = ["map", "emissiveMap", "sheenColorMap", "specularColorMap"];
  const linearMaps = [
    "alphaMap",
    "aoMap",
    "bumpMap",
    "displacementMap",
    "metalnessMap",
    "normalMap",
    "roughnessMap",
    "specularIntensityMap",
  ];

  srgbMaps.forEach((key) => {
    if (material[key]) {
      material[key].colorSpace = THREE.SRGBColorSpace;
      material[key].needsUpdate = true;
    }
  });

  linearMaps.forEach((key) => {
    if (material[key]) {
      material[key].colorSpace = THREE.NoColorSpace;
      material[key].needsUpdate = true;
    }
  });
}

function hotspotClass(active, emphasis, relationship) {
  const base = active
    ? "nutrimap-marker-active"
    : relationship
      ? "nutrimap-marker-relationship"
      : "";
  const impact = emphasis === "primary"
    ? " ring-4 ring-[rgb(95_168_163_/_0.24)]"
    : emphasis === "secondary"
      ? " ring-4 ring-[rgb(201_168_106_/_0.22)]"
      : "";
  return `${base}${impact}`;
}

function statusDotClass(status) {
  if (status === "Red") return "bg-[var(--np-color-danger)]";
  if (status === "Amber") return "bg-[var(--np-color-warning)]";
  if (status === "Orange") return "bg-[var(--np-color-warning)]";
  if (status === "Yellow") return "bg-[var(--np-color-accent)]";
  if (status === "Gray") return "bg-[var(--np-color-text-muted)]";
  return "bg-emerald-600";
}

function normalizeClinicalStatus(status) {
  if (status === "Red") return "Red";
  if (status === "Orange" || status === "Yellow") return "Amber";
  if (status === "Green") return "Green";
  return "Gray";
}

useGLTF.preload(getPublicAssetUrl("/models/n43kwzmu.glb"));
useGLTF.clear?.(getPublicAssetUrl("/models/liver.glb"));
useGLTF.clear?.(`${getPublicAssetUrl("/models/liver.glb")}?v=20260715-085422`);
