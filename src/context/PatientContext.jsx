import { PatientContext } from "./PatientContextValue";
import { useAppState } from "./useAppState";

export function PatientProvider({ children }) {
  const appState = useAppState();

  return (
    <PatientContext.Provider
      value={{
        activePatient: appState.activePatient,
        patients: appState.patients,
        setActivePatient: appState.setActivePatient,
        setActivePatientId: (patientId) => {
          const patient = appState.patients.find((item) => item.id === patientId);
          appState.setActivePatient(patient);
        },
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}
