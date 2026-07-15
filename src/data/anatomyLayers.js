export const ANATOMY_LAYERS = {
  "full-body": {
    available: true,
    caption: "Full-body anatomy layer",
    id: "full-body",
    modelPath: "/models/n43kwzmu.glb",
    targetHeight: 2.95,
  },
  skeleton: {
    available: true,
    caption: "Skeleton anatomy layer",
    id: "skeleton",
    modelPath: "/models/skeleton.glb",
    targetHeight: 2.65,
  },
  brain: {
    available: true,
    caption: "Brain anatomy layer",
    id: "brain",
    modelPath: "/models/brain.glb",
    targetHeight: 2.45,
  },
  heart: {
    available: true,
    caption: "Heart anatomy layer",
    id: "heart",
    modelPath: "/models/heart.glb",
    targetHeight: 2.35,
  },
  oral: {
    available: true,
    caption: "Oral Cavity anatomy layer",
    id: "oral",
    modelPath: "/models/oral.glb",
    targetHeight: 2.3,
  },
  digestive: {
    available: true,
    caption: "Gastrointestinal anatomy layer",
    id: "digestive",
    modelPath: "/models/digestive.glb",
    targetHeight: 2.38,
  },
  liver: {
    available: true,
    cacheVersion: "20260715-085422",
    caption: "Liver anatomy layer",
    id: "liver",
    modelPath: "/models/liver.glb",
    targetHeight: 2.18,
  },
  kidneys: {
    available: true,
    caption: "Kidneys anatomy layer",
    id: "kidneys",
    modelPath: "/models/kidneys.glb",
    targetHeight: 2.28,
  },
  pancreas: {
    available: true,
    caption: "Pancreas anatomy layer",
    id: "pancreas",
    modelPath: "/models/pancreas.glb",
    targetHeight: 2.14,
  },
  circulatory: {
    available: true,
    caption: "Cardiovascular anatomy layer",
    id: "circulatory",
    modelPath: "/models/circulatory.glb",
    targetHeight: 2.72,
    title: "Hematology & Iron",
  },
  muscles: {
    available: true,
    caption: "Muscular anatomy layer",
    id: "muscles",
    modelPath: "/models/n43kwzmu.glb",
    targetHeight: 2.95,
  },
};

export function getAnatomyLayerForOrgan(organId) {
  if (organId === "brain" && ANATOMY_LAYERS.brain.available) return ANATOMY_LAYERS.brain;
  if (organId === "heart" && ANATOMY_LAYERS.heart.available) return ANATOMY_LAYERS.heart;
  if (organId === "oral-cavity" && ANATOMY_LAYERS.oral.available) return ANATOMY_LAYERS.oral;
  if (organId === "gastrointestinal" && ANATOMY_LAYERS.digestive.available) return ANATOMY_LAYERS.digestive;
  if (organId === "liver" && ANATOMY_LAYERS.liver.available) return ANATOMY_LAYERS.liver;
  if (organId === "kidneys" && ANATOMY_LAYERS.kidneys.available) return ANATOMY_LAYERS.kidneys;
  if (organId === "pancreas" && ANATOMY_LAYERS.pancreas.available) return ANATOMY_LAYERS.pancreas;
  if (organId === "blood-iron" && ANATOMY_LAYERS.circulatory.available) return ANATOMY_LAYERS.circulatory;
  if (organId === "bones" && ANATOMY_LAYERS.skeleton.available) return ANATOMY_LAYERS.skeleton;
  if (organId === "muscles" && ANATOMY_LAYERS.muscles.available) return ANATOMY_LAYERS.muscles;
  return ANATOMY_LAYERS["full-body"];
}
