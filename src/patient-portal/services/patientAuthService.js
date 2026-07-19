import { DEMO_PATIENT_ACCESS_CODE, demoPortalPatient } from "../data/demoPatientPortalData";

const SESSION_KEY = "nutripilot.patientPortal.demoSession";

export const patientAuthService = {
  getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      return session?.patientId === demoPortalPatient.id ? session : null;
    } catch {
      return null;
    }
  },
  login({ accessCode, verification }) {
    if (accessCode.trim().toUpperCase() !== DEMO_PATIENT_ACCESS_CODE || !verification.trim()) {
      return { error: "Invalid demo access details." };
    }

    const session = {
      demoOnly: true,
      patientId: demoPortalPatient.id,
      signedInAt: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { patient: demoPortalPatient, session };
  },
  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  },
};
