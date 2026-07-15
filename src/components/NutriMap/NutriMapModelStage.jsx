import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bounds, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ArrowLeft, ArrowRight, LocateFixed, Maximize2, Minus, Rotate3D, RotateCcw, ZoomIn } from "lucide-react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { ANATOMY_LAYERS } from "../../data/anatomyLayers";
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

export function NutriMapModelStage({ activeLayer = ANATOMY_LAYERS["full-body"], activeLayerId = activeLayer.id, drawerOpen = false, impactEmphasis = {}, selectOrgan, selectedOrganId, size = "large", systems }) {
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
      <NutriMapModelErrorBoundary fallback={<FallbackBodyMap selectedOrganId={selectedOrganId} selectOrgan={handleOrganSelection} systems={systems} />}>
        <Canvas
          camera={{ fov: 36, near: 0.05, far: 100, position: [0, 0, 6.4] }}
          shadows
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.22;
          }}
          style={{ height: "100%", width: "100%" }}
        >
          <color attach="background" args={["#00000000"]} />
          <ambientLight intensity={0.88} />
          <hemisphereLight args={["#ffffff", "#d8cfc4", 1.28]} />
          <directionalLight castShadow intensity={2.35} position={[3.5, 5.5, 4.2]} shadow-mapSize={[2048, 2048]} />
          <directionalLight intensity={0.95} position={[-3.5, 2.8, 2.6]} />
          <directionalLight intensity={1.1} position={[0, 2.4, -4.2]} />
          <Environment preset="studio" />
          {activeLayerId === "skeleton" ? <SkeletonLayerLighting /> : null}
          {activeLayerId === "oral" ? <OralLayerLighting /> : null}
          {activeLayerId === "digestive" ? <DigestiveLayerLighting /> : null}
          {activeLayerId === "liver" ? <LiverLayerLighting /> : null}
          {activeLayerId === "kidneys" ? <KidneysLayerLighting /> : null}
          {activeLayerId === "pancreas" ? <PancreasLayerLighting /> : null}
          {activeLayerId === "circulatory" ? <CirculatoryLayerLighting /> : null}
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
          <Suspense fallback={<ModelLoadingFallback />}>
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
              selectedOrgan={selectedOrgan}
              selectedOrganId={selectedOrganId}
              systems={systems}
            />
          </Suspense>
        </Canvas>
      </NutriMapModelErrorBoundary>
      <ViewerControls
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

function SkeletonLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#fff8ef", "#c7b8a6", 0.42]} />
      <directionalLight castShadow intensity={0.72} position={[2.4, 4.2, 3.2]} shadow-mapSize={[2048, 2048]} />
      <directionalLight intensity={0.38} position={[-2.2, 1.6, 2.4]} />
    </>
  );
}

function OralLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#fff4ee", "#b87979", 0.26]} />
      <directionalLight castShadow intensity={1.12} position={[1.8, 3.4, 3.1]} shadow-mapSize={[4096, 4096]} />
      <directionalLight intensity={0.46} position={[-1.8, 1.6, -2.8]} />
    </>
  );
}

function DigestiveLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.24} />
      <hemisphereLight args={["#fff5ef", "#d6b3a0", 0.34]} />
      <directionalLight castShadow intensity={0.96} position={[2.2, 3.8, 3.4]} shadow-mapSize={[4096, 4096]} />
      <directionalLight intensity={0.34} position={[-2.4, 1.8, 2.6]} />
    </>
  );
}

function LiverLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <hemisphereLight args={["#fff2e8", "#5f2f2b", 0.3]} />
      <directionalLight castShadow intensity={1.08} position={[2.4, 3.2, 3.0]} shadow-mapSize={[4096, 4096]} />
      <directionalLight intensity={0.42} position={[-2.6, 1.7, -2.3]} />
    </>
  );
}

function KidneysLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#fff3ec", "#7a4a45", 0.32]} />
      <directionalLight castShadow intensity={1.04} position={[2.1, 3.4, 3.2]} shadow-mapSize={[4096, 4096]} />
      <directionalLight intensity={0.38} position={[-2.3, 1.8, -2.7]} />
    </>
  );
}

function PancreasLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.23} />
      <hemisphereLight args={["#fff2ea", "#8f5b55", 0.3]} />
      <directionalLight castShadow intensity={1.02} position={[2.2, 3.2, 3.4]} shadow-mapSize={[4096, 4096]} />
      <directionalLight intensity={0.36} position={[-2.5, 1.7, -2.4]} />
    </>
  );
}

function CirculatoryLayerLighting() {
  return (
    <>
      <ambientLight intensity={0.24} />
      <hemisphereLight args={["#fff5f2", "#223858", 0.3]} />
      <directionalLight castShadow intensity={1.0} position={[2.4, 4.2, 3.5]} shadow-mapSize={[4096, 4096]} />
      <directionalLight intensity={0.35} position={[-2.8, 2.0, -3.0]} />
    </>
  );
}

function LayerRenderTuning({ activeLayerId }) {
  const { gl } = useThree();

  useEffect(() => {
    const previousExposure = gl.toneMappingExposure;
    const previousShadowType = gl.shadowMap.type;
    if (activeLayerId === "oral") {
      tuneRendererForLayer(gl, 0.92, THREE.PCFSoftShadowMap);
    } else if (activeLayerId === "digestive") {
      tuneRendererForLayer(gl, 1.02, THREE.PCFSoftShadowMap);
    } else if (activeLayerId === "liver") {
      tuneRendererForLayer(gl, 0.98, THREE.PCFSoftShadowMap);
    } else if (activeLayerId === "kidneys") {
      tuneRendererForLayer(gl, 1.0, THREE.PCFSoftShadowMap);
    } else if (activeLayerId === "pancreas") {
      tuneRendererForLayer(gl, 1.0, THREE.PCFSoftShadowMap);
    } else if (activeLayerId === "circulatory") {
      tuneRendererForLayer(gl, 0.96, THREE.PCFSoftShadowMap);
    }
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

function FallbackBodyMap({ selectedOrganId, selectOrgan, systems }) {
  return (
    <div className="relative flex h-full min-h-[440px] items-center justify-center p-4">
      <svg className="h-[82%] max-h-[560px] w-auto" viewBox="0 0 220 420" aria-label="Fallback NutriMap body" role="img">
        <circle cx="110" cy="45" r="34" fill="none" stroke="var(--np-color-brand)" strokeOpacity="0.22" strokeWidth="6" />
        <path d="M76 98 C88 78 132 78 144 98 C164 140 160 212 140 258 C130 282 90 282 80 258 C60 212 56 140 76 98Z" fill="var(--np-color-brand)" opacity="0.12" stroke="var(--np-color-brand)" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M78 118 C38 162 40 226 58 288" stroke="var(--np-color-brand)" strokeWidth="16" strokeLinecap="round" opacity="0.16" />
        <path d="M142 118 C182 162 180 226 162 288" stroke="var(--np-color-brand)" strokeWidth="16" strokeLinecap="round" opacity="0.16" />
        <path d="M92 262 C80 318 72 366 68 405" stroke="var(--np-color-brand)" strokeWidth="18" strokeLinecap="round" opacity="0.16" />
        <path d="M128 262 C140 318 148 366 152 405" stroke="var(--np-color-brand)" strokeWidth="18" strokeLinecap="round" opacity="0.16" />
      </svg>
      <div className="absolute inset-0 mx-auto h-[82%] max-h-[560px] w-[300px] max-w-[70%]">
        {systems.map((system) => (
          <button
            aria-label={system.label}
            aria-pressed={selectedOrganId === system.id}
            className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-[var(--np-shadow-sm)] ${selectedOrganId === system.id ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)]" : "border-white bg-white"}`}
            key={system.id}
            onClick={() => selectOrgan(system.id)}
            style={{ left: `${system.mapPoint.x}%`, top: `${system.mapPoint.y}%` }}
            type="button"
          >
            <span className={`h-3.5 w-3.5 rounded-full ${selectedOrganId === system.id ? "bg-white" : statusDotClass(system.status)}`} />
          </button>
        ))}
      </div>
      <p className="absolute bottom-4 rounded-full border border-[var(--np-color-border-soft)] bg-white/90 px-4 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] shadow-[var(--np-shadow-sm)]">
        2D fallback view
      </p>
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
  selectedOrgan,
  selectedOrganId,
  systems,
}) {
  const isSpecialLayer = activeLayerId !== "full-body" && activeLayerId !== "muscles";
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
        fallback={(
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
        )}
        activeLayerId={activeLayerId}
        modelPath={modelUrl}
        resetKey={activeLayerId}
      >
        {activeLayerId === "oral" || activeLayerId === "digestive" || activeLayerId === "liver" || activeLayerId === "kidneys" || activeLayerId === "pancreas" || activeLayerId === "circulatory" ? (
          <Bounds fit clip observe margin={1.22}>
            {anatomyModel}
          </Bounds>
        ) : anatomyModel}
      </LayerModelErrorBoundary>
      {isSpecialLayer ? (
        <LayerFocusMarker selectedOrganId={selectedOrganId} selectOrgan={selectOrgan} />
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
      <CameraRig activeLayerId={activeLayerId} drawerOpen={drawerOpen} modelMetrics={modelMetrics} selectedOrgan={selectedOrgan} selectedOrganId={selectedOrganId} />
      <ShadowDisk modelMetrics={modelMetrics} />
    </>
  );
}

function AnatomyModel({ activeLayerId, calibrationEnabled, modelPath, onMetrics, selectOrgan, selectedOrganId, systems, targetHeight }) {
  const gltf = useGLTF(modelPath);
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const modelMetrics = useMemo(() => calculateModelMetrics(scene, targetHeight), [scene, targetHeight]);
  const organMeshMap = useMemo(() => activeLayerId === "full-body" ? detectOrganMeshes(scene, systems) : {}, [activeLayerId, scene, systems]);
  const separateOrganMeshes = Object.keys(organMeshMap).length > 1;
  const fadeOpacityRef = useRef(activeLayerId === "oral" ? 0 : 1);

  useEffect(() => {
    scene.traverse((object) => {
      if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material) {
          object.material = prepareClinicalMaterial(object.material, activeLayerId);
      }
    });
    onMetrics(modelMetrics);
  }, [activeLayerId, modelMetrics, onMetrics, scene]);

  useEffect(() => {
    fadeOpacityRef.current = activeLayerId === "oral" ? 0 : 1;
  }, [activeLayerId, scene]);

  useFrame(() => {
    if (activeLayerId === "oral" && fadeOpacityRef.current < 1) {
      fadeOpacityRef.current = Math.min(1, fadeOpacityRef.current + 0.045);
      scene.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          material.transparent = fadeOpacityRef.current < 1;
          material.opacity = fadeOpacityRef.current;
          material.needsUpdate = true;
        });
      });
    }
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
      rotation={[0, 0, 0]}
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

function LayerFocusMarker({ selectOrgan, selectedOrganId }) {
  const active = true;
  const markerPosition = {
    bones: [0.18, -0.98, 0.34],
    brain: [0, 0.2, 0.42],
    heart: [0.12, 0.04, 0.44],
  }[selectedOrganId] || [0, 0, 0.42];
  return (
    <Html center position={markerPosition} transform={false} zIndexRange={[60, 20]}>
      <button
        aria-label={`${selectedOrganId} anatomy layer`}
        aria-pressed={active}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[rgb(122_31_43_/_0.18)] ${active ? "nutrimap-marker-active" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          event.nativeEvent?.stopImmediatePropagation?.();
          selectOrgan(selectedOrganId);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          event.nativeEvent?.stopImmediatePropagation?.();
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          event.nativeEvent?.stopImmediatePropagation?.();
        }}
        title={selectedOrganId}
        type="button"
      >
        <span className={`flex items-center justify-center rounded-full border-2 border-white bg-white shadow-[var(--np-shadow-sm)] transition ${active ? "h-[22px] w-[22px] ring-4 ring-[rgb(122_31_43_/_0.18)]" : "h-4 w-4"}`}>
          <span className={`rounded-full ${active ? "h-2.5 w-2.5" : "h-2 w-2"} ${statusDotClass("Red")}`} />
        </span>
      </button>
    </Html>
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

function CameraRig({ activeLayerId, drawerOpen, modelMetrics, selectedOrgan, selectedOrganId }) {
  const { camera, controls } = useThree();
  const focusFrames = useRef(0);
  const manualTargetRef = useRef(null);
  const manualPositionRef = useRef(null);
  const initialView = useMemo(() => reframeViewerForPanel(modelMetrics, drawerOpen), [drawerOpen, modelMetrics]);
  const activePreset = useMemo(() => getOrganCameraPreset(selectedOrgan, modelMetrics, drawerOpen, activeLayerId), [activeLayerId, drawerOpen, modelMetrics, selectedOrgan]);
  const selectedTarget = activePreset.target;
  const desiredCameraPosition = activePreset.position;

  useEffect(() => {
    focusFrames.current = 48;
    manualPositionRef.current = null;
    manualTargetRef.current = null;
  }, [activeLayerId, drawerOpen, selectedOrganId]);

  useEffect(() => {
    const setView = (event) => {
      const view = event.detail || initialView;
      manualPositionRef.current = new THREE.Vector3(...view.position);
      manualTargetRef.current = new THREE.Vector3(...view.target);
      focusFrames.current = 36;
    };
    const zoomView = (event) => {
      const direction = event.detail?.direction === "in" ? -1 : 1;
      const zoomStep = modelMetrics.scaledRadius * 0.35 * direction;
      const currentDirection = camera.position.clone().sub(controls?.target || new THREE.Vector3()).normalize();
      manualPositionRef.current = camera.position.clone().add(currentDirection.multiplyScalar(zoomStep));
      manualTargetRef.current = controls?.target?.clone?.() || new THREE.Vector3();
      focusFrames.current = 24;
    };
    window.addEventListener("nutrimap:set-view", setView);
    window.addEventListener("nutrimap:zoom", zoomView);
    return () => {
      window.removeEventListener("nutrimap:set-view", setView);
      window.removeEventListener("nutrimap:zoom", zoomView);
    };
  }, [camera, controls, initialView, modelMetrics.scaledRadius]);

  useFrame(() => {
    if (focusFrames.current <= 0) return;
    const targetPosition = manualPositionRef.current || desiredCameraPosition;
    const targetLookAt = manualTargetRef.current || selectedTarget;
    camera.position.lerp(targetPosition, 0.075);
    if (controls?.target) {
      controls.target.lerp(targetLookAt, 0.1);
      controls.update();
    }
    focusFrames.current -= 1;
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

function ViewerControls({ autoRotateEnabled, modelMetrics, setAutoRotateEnabled }) {
  const view = getInitialView(modelMetrics);

  function setView(type) {
    window.dispatchEvent(new CustomEvent("nutrimap:set-view", { detail: getViewerPreset(type, modelMetrics) }));
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

function ModelLoadingFallback() {
  const meshRef = useRef(null);
  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y = state.clock.elapsedTime * 0.35;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <capsuleGeometry args={[0.42, 1.7, 16, 32]} />
      <meshStandardMaterial color="#7A1F2B" opacity={0.12} transparent />
    </mesh>
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
  const distance = (modelMetrics.scaledRadius / Math.tan(fovRadians / 2)) * 1.18;
  return {
    distance,
    maxDistance: modelMetrics.scaledRadius * 4.8,
    minDistance: modelMetrics.scaledRadius * 1.25,
    position: [0, 0, distance],
    target: [0, 0, 0],
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

function getViewerPreset(type, modelMetrics) {
  const initialView = getInitialView(modelMetrics);
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

function getOrganCameraPreset(system, modelMetrics, drawerOpen = false, activeLayerId = "full-body") {
  if (activeLayerId !== "full-body" && activeLayerId !== "muscles") {
    const view = reframeViewerForPanel(modelMetrics, drawerOpen);
    const threeQuarterOffset = activeLayerId === "heart" ? modelMetrics.scaledWidth * 0.32 : activeLayerId === "liver" ? modelMetrics.scaledWidth * 0.2 : activeLayerId === "kidneys" ? modelMetrics.scaledWidth * 0.16 : activeLayerId === "pancreas" ? modelMetrics.scaledWidth * 0.18 : activeLayerId === "circulatory" ? modelMetrics.scaledWidth * 0.12 : 0;
    const verticalLift = activeLayerId === "heart" ? modelMetrics.scaledHeight * 0.05 : activeLayerId === "oral" ? modelMetrics.scaledHeight * 0.02 : activeLayerId === "digestive" ? modelMetrics.scaledHeight * 0.03 : activeLayerId === "liver" ? modelMetrics.scaledHeight * 0.03 : activeLayerId === "kidneys" ? modelMetrics.scaledHeight * 0.04 : activeLayerId === "pancreas" ? modelMetrics.scaledHeight * 0.02 : activeLayerId === "circulatory" ? modelMetrics.scaledHeight * 0.01 : 0;
    const distanceScale = activeLayerId === "heart" ? 0.92 : activeLayerId === "oral" ? 0.86 : activeLayerId === "digestive" ? 0.9 : activeLayerId === "liver" ? 0.88 : activeLayerId === "kidneys" ? 0.9 : activeLayerId === "pancreas" ? 0.88 : activeLayerId === "circulatory" ? 0.96 : 1;
    return {
      anchor: [0, 0, 0],
      module: system?.id === "heart" ? "assessment" : system?.id === "oral-cavity" || system?.id === "gastrointestinal" ? "dietary" : system?.id === "liver" ? "intervention" : "laboratory",
      position: new THREE.Vector3(threeQuarterOffset, verticalLift, view.distance * distanceScale),
      rotation: [0, activeLayerId === "liver" ? 0.18 : activeLayerId === "kidneys" ? 0.17 : activeLayerId === "pancreas" ? 0.18 : activeLayerId === "circulatory" ? 0.12 : threeQuarterOffset ? 0.14 : 0, 0],
      target: new THREE.Vector3(...view.target),
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
    rotation: [0, sideBias, 0],
    target: anchorTarget.clone().add(new THREE.Vector3(panelShift, 0, 0)),
  };
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

function prepareClinicalMaterial(sourceMaterial, activeLayerId) {
  const material = Array.isArray(sourceMaterial)
    ? sourceMaterial.map((item) => item?.clone?.() || item)
    : sourceMaterial.clone();
  const materials = Array.isArray(material) ? material : [material];

  materials.forEach((item) => {
    if (!item) return;
    applyTextureColorSpace(item);

    if (activeLayerId === "heart") {
      if (typeof item.roughness === "number") item.roughness = Math.min(item.roughness, 0.5);
      if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.08);
      item.envMapIntensity = Math.max(item.envMapIntensity || 0, 0.85);
    } else if (activeLayerId === "skeleton" || activeLayerId === "brain" || activeLayerId === "oral" || activeLayerId === "digestive" || activeLayerId === "liver" || activeLayerId === "kidneys" || activeLayerId === "pancreas" || activeLayerId === "circulatory") {
      if (activeLayerId === "skeleton") {
        if (item.color) item.color = new THREE.Color("#F2E6D5");
        if (typeof item.roughness === "number") item.roughness = 0.74;
        if (typeof item.metalness === "number") item.metalness = 0;
        item.envMapIntensity = Math.max(item.envMapIntensity || 0, 0.78);
      } else if (activeLayerId === "oral") {
        if (item.color) item.color = new THREE.Color("#B87474");
        if (typeof item.roughness === "number") item.roughness = 0.82;
        if (typeof item.metalness === "number") item.metalness = 0;
        if (typeof item.aoMapIntensity === "number") item.aoMapIntensity = Math.max(item.aoMapIntensity || 0, 1.45);
        item.envMapIntensity = Math.min(Math.max(item.envMapIntensity || 0, 0.28), 0.42);
      } else if (activeLayerId === "digestive") {
        if (typeof item.roughness === "number") item.roughness = Math.min(Math.max(item.roughness, 0.54), 0.76);
        if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.04);
        if (typeof item.aoMapIntensity === "number") item.aoMapIntensity = Math.max(item.aoMapIntensity || 0, 1.22);
        item.envMapIntensity = Math.min(Math.max(item.envMapIntensity || 0, 0.38), 0.58);
      } else if (activeLayerId === "liver") {
        if (typeof item.roughness === "number") item.roughness = Math.min(Math.max(item.roughness, 0.58), 0.78);
        if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.03);
        if (typeof item.aoMapIntensity === "number") item.aoMapIntensity = Math.max(item.aoMapIntensity || 0, 1.28);
        item.envMapIntensity = Math.min(Math.max(item.envMapIntensity || 0, 0.34), 0.52);
      } else if (activeLayerId === "kidneys") {
        if (typeof item.roughness === "number") item.roughness = Math.min(Math.max(item.roughness, 0.56), 0.76);
        if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.03);
        if (typeof item.aoMapIntensity === "number") item.aoMapIntensity = Math.max(item.aoMapIntensity || 0, 1.2);
        item.envMapIntensity = Math.min(Math.max(item.envMapIntensity || 0, 0.34), 0.54);
      } else if (activeLayerId === "pancreas") {
        if (typeof item.roughness === "number") item.roughness = Math.min(Math.max(item.roughness, 0.54), 0.76);
        if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.03);
        if (typeof item.aoMapIntensity === "number") item.aoMapIntensity = Math.max(item.aoMapIntensity || 0, 1.18);
        item.envMapIntensity = Math.min(Math.max(item.envMapIntensity || 0, 0.34), 0.54);
      } else if (activeLayerId === "circulatory") {
        if (typeof item.roughness === "number") item.roughness = Math.min(Math.max(item.roughness, 0.48), 0.72);
        if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.04);
        if (typeof item.aoMapIntensity === "number") item.aoMapIntensity = Math.max(item.aoMapIntensity || 0, 1.16);
        item.envMapIntensity = Math.min(Math.max(item.envMapIntensity || 0, 0.32), 0.5);
      } else {
        if (typeof item.roughness === "number") item.roughness = Math.min(item.roughness, 0.78);
        if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.05);
        item.envMapIntensity = Math.max(item.envMapIntensity || 0, 0.65);
      }
    } else {
      if (typeof item.roughness === "number") item.roughness = Math.min(item.roughness, 0.62);
      if (typeof item.metalness === "number") item.metalness = Math.min(item.metalness, 0.08);
      item.envMapIntensity = Math.max(item.envMapIntensity || 0, 0.55);
    }

    item.needsUpdate = true;
  });

  return material;
}

function getLayerModelUrl(layer) {
  const resolvedPath = resolvePublicModelPath(layer.modelPath);
  if (!layer?.cacheVersion) return resolvedPath;
  return `${resolvedPath}?v=${layer.cacheVersion}`;
}

function resolvePublicModelPath(modelPath) {
  if (!modelPath) return modelPath;
  if (/^https?:\/\//i.test(modelPath)) return modelPath;
  const normalizedBase = PUBLIC_BASE_URL.endsWith("/") ? PUBLIC_BASE_URL : `${PUBLIC_BASE_URL}/`;
  const normalizedPath = modelPath.replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`;
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

useGLTF.preload(resolvePublicModelPath("/models/n43kwzmu.glb"));
useGLTF.preload(resolvePublicModelPath("/models/skeleton.glb"));
useGLTF.preload(resolvePublicModelPath("/models/brain.glb"));
useGLTF.preload(resolvePublicModelPath("/models/heart.glb"));
useGLTF.preload(resolvePublicModelPath("/models/oral.glb"));
useGLTF.preload(resolvePublicModelPath("/models/digestive.glb"));
useGLTF.clear?.(resolvePublicModelPath("/models/liver.glb"));
useGLTF.clear?.(`${resolvePublicModelPath("/models/liver.glb")}?v=20260715-085422`);
useGLTF.preload(`${resolvePublicModelPath("/models/liver.glb")}?v=20260715-085422`);
useGLTF.preload(resolvePublicModelPath("/models/kidneys.glb"));
useGLTF.preload(resolvePublicModelPath("/models/pancreas.glb"));
