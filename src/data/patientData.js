export const patientData = {
  name: "Sarah Ahmed",
  gender: "Female",
  age: 28,
  height: 165,
  weight: 84,
  diagnosis: ["IBS", "Iron Deficiency"],

  scores: {
    nutrition: 89,
    bmi: 31.0,
    overall: "Stable",
  },

  labs: {
    ferritin: 12,
    hemoglobin: 11.2,
    vitaminD: 20,
    albumin: "Normal",
  },

  symptoms: {
    gi: "Bloating",
    fatigue: true,
  },

  dietary: {
    recall24h: "Missing",
    fiber: "Low",
    protein: "Unknown",
    fodmap: "Needs review",
  },
};

export const managedPatients = [
  {
    id: "patient-sarah-ahmed",
    fullName: "Sarah Ahmed",
    age: 28,
    gender: "Female",
    height: 165,
    weight: 84,
    diagnosis: "IBS • Iron Deficiency",
    notes: "Review iron intake, GI tolerance, and follow-up labs.",
  },
  {
    id: "patient-mohammed-ali",
    fullName: "Mohammed Ali",
    age: 41,
    gender: "Male",
    height: 176,
    weight: 85,
    diagnosis: "Obesity",
    notes: "Follow-up on weight management goals.",
  },
  {
    id: "patient-reem-hassan",
    fullName: "Reem Hassan",
    age: 35,
    gender: "Female",
    height: 160,
    weight: 68,
    diagnosis: "Vitamin D Deficiency",
    notes: "Monitor vitamin D status and supplementation plan.",
  },
];

export const emptyPatientForm = {
  fullName: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  diagnosis: "",
  notes: "",
};

export function calculateBmi(height, weight) {
  const heightInMeters = Number(height) / 100;
  const weightInKg = Number(weight);

  if (!heightInMeters || !weightInKg) {
    return null;
  }

  return (weightInKg / heightInMeters ** 2).toFixed(1);
}

export function createPatientRecord(formValues) {
  return {
    id:
      formValues.id ||
      `patient-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fullName: formValues.fullName.trim(),
    age: Number(formValues.age) || "",
    gender: formValues.gender,
    height: Number(formValues.height) || "",
    weight: Number(formValues.weight) || "",
    diagnosis: formValues.diagnosis.trim(),
    notes: formValues.notes.trim(),
  };
}

export const workspacePatient = {
  name: "Sarah Ahmed",
  age: 28,
  gender: "Female",
  mrn: "2026-001",
  diagnosis: "IBS • Iron Deficiency",
  bmi: "31.0",
  risk: "Moderate",
  labs: {
    ferritin: "12",
    hb: "11.2",
    vitaminD: "20",
    albumin: "Normal",
  },
};

export const commandCenterPatients = [
  {
    name: "Sarah Ahmed",
    note: "IBS • Low Ferritin",
    gender: "Female",
    age: 28,
    mrn: "2026-001",
    diagnosis: "IBS • Iron Deficiency",
    bmi: "31.0",
    must: "1",
    risk: "Moderate",
    labs: { ferritin: "12", hb: "11.2", vitaminD: "20", albumin: "Normal" },
    nutrition: { calories: "1800 kcal", protein: "85 g", fiber: "Low" },
    ai: "Iron deficiency pattern detected. Review iron intake and GI tolerance.",
  },
  {
    name: "Mohammed Khalid",
    note: "CKD • Protein Assessment",
    gender: "Male",
    age: 41,
    mrn: "2026-002",
    diagnosis: "CKD • Protein Assessment",
    bmi: "27.4",
    must: "0",
    risk: "Low",
    labs: { ferritin: "55", hb: "13.1", vitaminD: "28", albumin: "3.4" },
    nutrition: { calories: "2100 kcal", protein: "65 g", fiber: "Moderate" },
    ai: "Monitor protein intake and albumin status due to CKD history.",
  },
  {
    name: "Reem Hassan",
    note: "Pediatric • Growth Monitoring",
    gender: "Female",
    age: 10,
    mrn: "2026-003",
    diagnosis: "Growth Monitoring • Vitamin D Deficiency",
    bmi: "18.2",
    must: "2",
    risk: "High",
    labs: { ferritin: "24", hb: "12.0", vitaminD: "14", albumin: "Normal" },
    nutrition: { calories: "1500 kcal", protein: "52 g", fiber: "Low" },
    ai: "Vitamin D deficiency and growth monitoring require follow-up.",
  },
];

export const patientsPagePatients = [
  {
    initial: "S",
    name: "Sarah Ahmed",
    demographics: "Female • 28 Years",
    diagnosis: "IBS • Iron Deficiency",
    status: "Stable",
    badgeClass: "green",
    score: "89/100",
  },
  {
    initial: "M",
    name: "Mohammed Ali",
    demographics: "Male • 41 Years",
    diagnosis: "Obesity",
    status: "Follow-up",
    badgeClass: "yellow",
    score: "72/100",
  },
  {
    initial: "R",
    name: "Reem Hassan",
    demographics: "Female • 35 Years",
    diagnosis: "Vitamin D Deficiency",
    status: "Critical",
    badgeClass: "red",
    score: "48/100",
  },
];
