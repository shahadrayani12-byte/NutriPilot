import { create } from "zustand";

export const usePatientStore = create((set) => ({
  patient: {
    name: "Sarah Ahmed",
    gender: "Female",
    age: 28,
    height: 165,
    weight: 84,

    diagnosis: ["IBS", "Iron Deficiency"],

    scores: {
      nutrition: 89,
      bmi: 31,
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
      fiber: "Low",
      protein: "Unknown",
      recall24h: "Missing",
      fodmap: "Needs review",
    },
  },

  updatePatient: (newData) =>
    set((state) => ({
      patient: {
        ...state.patient,
        ...newData,
      },
    })),
}));