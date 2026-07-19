import { demoPortalPatient, demoTreatmentPlan } from "../data/demoPatientPortalData";

export const patientPlanService = {
  getPatient() {
    return demoPortalPatient;
  },
  getTreatmentPlan() {
    return demoTreatmentPlan;
  },
};
