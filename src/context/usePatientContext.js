import { useContext } from "react";

import { PatientContext } from "./PatientContextValue";

export function usePatientContext() {
  const context = useContext(PatientContext);

  if (!context) {
    throw new Error("usePatientContext must be used inside PatientProvider");
  }

  return context;
}
