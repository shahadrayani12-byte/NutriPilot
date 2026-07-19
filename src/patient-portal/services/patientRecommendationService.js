import { getDemoRecommendations } from "../data/demoPatientPortalData";

export const patientRecommendationService = {
  listRecommendations() {
    return getDemoRecommendations();
  },
};
