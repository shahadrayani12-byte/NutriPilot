export const NUTRIMAP_HOTSPOTS = [
  {
    id: "brain-hotspot",
    organId: "brain",
    nameEn: "Brain",
    nameAr: "الدماغ",
    localPosition: [0, 1.22, 0.24],
    visualOffset: [0, 0, 0.04],
    cameraPreset: { distanceScale: 0.9, targetOffset: [0, 0.12, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "oral-cavity-hotspot",
    organId: "oral-cavity",
    nameEn: "Oral Cavity",
    nameAr: "تجويف الفم",
    localPosition: [0, 1.02, 0.27],
    visualOffset: [0.035, -0.01, 0.04],
    cameraPreset: { distanceScale: 0.92, targetOffset: [0, 0.08, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "heart-hotspot",
    organId: "heart",
    nameEn: "Heart",
    nameAr: "القلب",
    localPosition: [0.12, 0.54, 0.31],
    visualOffset: [0.02, 0.015, 0.04],
    cameraPreset: { distanceScale: 0.95, targetOffset: [0.04, 0, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "blood-iron-hotspot",
    organId: "blood-iron",
    nameEn: "Blood / Iron",
    nameAr: "الدم / الحديد",
    localPosition: [-0.1, 0.46, 0.32],
    visualOffset: [-0.025, -0.01, 0.04],
    cameraPreset: { distanceScale: 0.96, targetOffset: [-0.03, 0, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "liver-hotspot",
    organId: "liver",
    nameEn: "Liver",
    nameAr: "الكبد",
    localPosition: [-0.18, 0.22, 0.31],
    visualOffset: [-0.015, 0, 0.04],
    cameraPreset: { distanceScale: 0.96, targetOffset: [-0.04, -0.02, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "gastrointestinal-hotspot",
    organId: "gastrointestinal",
    nameEn: "Gastrointestinal System",
    nameAr: "الجهاز الهضمي",
    localPosition: [0, -0.16, 0.32],
    visualOffset: [0, 0.02, 0.04],
    cameraPreset: { distanceScale: 0.98, targetOffset: [0, -0.04, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "pancreas-hotspot",
    organId: "pancreas",
    nameEn: "Pancreas",
    nameAr: "البنكرياس",
    localPosition: [0.16, 0.08, 0.31],
    visualOffset: [0.02, 0, 0.04],
    cameraPreset: { distanceScale: 0.96, targetOffset: [0.04, -0.02, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "kidneys-hotspot",
    organId: "kidneys",
    nameEn: "Kidneys",
    nameAr: "الكلى",
    localPosition: [-0.2, -0.03, 0.22],
    visualOffset: [-0.02, 0, 0.04],
    cameraPreset: { distanceScale: 0.98, targetOffset: [-0.04, -0.02, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "muscles-hotspot",
    organId: "muscles",
    nameEn: "Muscles",
    nameAr: "العضلات",
    localPosition: [-0.26, -0.9, 0.25],
    visualOffset: [0, 0, 0.04],
    cameraPreset: { distanceScale: 1, targetOffset: [-0.04, -0.08, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
  {
    id: "bones-hotspot",
    organId: "bones",
    nameEn: "Bones",
    nameAr: "العظام",
    localPosition: [0.18, -1.03, 0.24],
    visualOffset: [0, 0, 0.04],
    cameraPreset: { distanceScale: 1, targetOffset: [0.04, -0.1, 0] },
    tooltipOffset: [0, 12],
    occlusion: true,
    minScale: 0.82,
    maxScale: 1,
    selectedScale: 1.18,
  },
];

export const HOTSPOT_ORGAN_MAP = {
  brain: "brain",
  bloodIron: "blood-iron",
  bones: "bones",
  gastrointestinal: "gastrointestinal",
  heart: "heart",
  kidneys: "kidneys",
  liver: "liver",
  muscles: "muscles",
  oralCavity: "oral-cavity",
  pancreas: "pancreas",
};

export const VALID_HOTSPOT_ORGAN_IDS = new Set(Object.values(HOTSPOT_ORGAN_MAP));

export function getNutriMapHotspot(id) {
  return NUTRIMAP_HOTSPOTS.find((hotspot) => hotspot.id === id || hotspot.organId === id) || NUTRIMAP_HOTSPOTS[0];
}

export function getCalibratedHotspot(id) {
  const base = getNutriMapHotspot(id);
  if (typeof window === "undefined") return base;

  try {
    const stored = JSON.parse(localStorage.getItem("nutripilot.nutrimap.hotspotCalibration.v1") || "{}");
    const override = stored[id];
    if (!Array.isArray(override?.localPosition)) return base;
    return { ...base, localPosition: override.localPosition };
  } catch {
    return base;
  }
}

export function saveCalibratedHotspot(id, localPosition) {
  if (typeof window === "undefined") return;
  const stored = JSON.parse(localStorage.getItem("nutripilot.nutrimap.hotspotCalibration.v1") || "{}");
  localStorage.setItem(
    "nutripilot.nutrimap.hotspotCalibration.v1",
    JSON.stringify({
      ...stored,
      [id]: { localPosition },
    }),
  );
}

export function resetCalibratedHotspot(id) {
  if (typeof window === "undefined") return;
  const stored = JSON.parse(localStorage.getItem("nutripilot.nutrimap.hotspotCalibration.v1") || "{}");
  delete stored[id];
  localStorage.setItem("nutripilot.nutrimap.hotspotCalibration.v1", JSON.stringify(stored));
}
