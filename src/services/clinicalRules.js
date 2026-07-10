export function getClinicalAlerts(patient) {
  const alerts = [];

  if (patient.labs.ferritin < 15) {
    alerts.push({
      level: "critical",
      title: "Low Ferritin",
      message: "Ferritin is below 15 ng/mL. Review iron status and intake.",
    });
  }

  if (patient.labs.hemoglobin < 12) {
    alerts.push({
      level: "warning",
      title: "Low Hemoglobin",
      message: "Hemoglobin is low. Check anemia-related indicators.",
    });
  }

  if (patient.labs.vitaminD < 20) {
    alerts.push({
      level: "critical",
      title: "Vitamin D Deficiency",
      message: "Vitamin D is below 20 ng/mL. Consider supplementation review.",
    });
  }

  if (patient.scores.bmi >= 30) {
    alerts.push({
      level: "warning",
      title: "High BMI",
      message: "BMI is in the obesity range. Review weight management goals.",
    });
  }

  if (patient.dietary.fiber === "Low") {
    alerts.push({
      level: "warning",
      title: "Low Fiber Intake",
      message: "Fiber intake is low. Review dietary pattern and GI tolerance.",
    });
  }

  return alerts;
}