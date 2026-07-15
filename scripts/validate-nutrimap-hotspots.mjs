import { NUTRIMAP_HOTSPOTS } from "../src/components/NutriMap/nutrimapHotspots.js";
import { NUTRIMAP_ORGAN_CONFIG } from "../src/data/nutrimapOrganConfig.js";

const expectedMappings = {
  "blood-iron": "blood-iron",
  bones: "bones",
  brain: "brain",
  gastrointestinal: "gastrointestinal",
  heart: "heart",
  kidneys: "kidneys",
  liver: "liver",
  muscles: "muscles",
  "oral-cavity": "oral-cavity",
  pancreas: "pancreas",
};

const ids = NUTRIMAP_HOTSPOTS.map((hotspot) => hotspot.organId);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
const missingConfig = NUTRIMAP_HOTSPOTS.filter((hotspot) => !NUTRIMAP_ORGAN_CONFIG[hotspot.organId]);
const wrongMappings = NUTRIMAP_HOTSPOTS.filter((hotspot) => expectedMappings[hotspot.organId] !== hotspot.organId);

if (duplicates.length) {
  throw new Error(`Duplicate NutriMap hotspot organ ids: ${duplicates.join(", ")}`);
}

if (missingConfig.length) {
  throw new Error(`NutriMap hotspots missing organ config: ${missingConfig.map((hotspot) => hotspot.organId).join(", ")}`);
}

if (wrongMappings.length) {
  throw new Error(`NutriMap hotspot mapping mismatch: ${wrongMappings.map((hotspot) => `${hotspot.id}->${hotspot.organId}`).join(", ")}`);
}

console.log("NutriMap hotspot mapping OK", NUTRIMAP_HOTSPOTS.map((hotspot) => `${hotspot.id}->${hotspot.organId}`).join(", "));
