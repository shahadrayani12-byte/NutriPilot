import { Activity, Droplet, Sun, Scale } from "lucide-react";
import { usePatientStore } from "../../store/patientStore";

export default function MetricsGrid() {
  const patient = usePatientStore((state) => state.patient);

  const cards = [
    {
      title: "Nutrition Score",
      value: patient.scores.nutrition,
      unit: "/100",
      status: "Stable",
      icon: Activity,
      type: "success",
    },
    {
      title: "BMI",
      value: patient.scores.bmi,
      unit: "kg/m²",
      status: patient.scores.bmi >= 30 ? "High" : "Normal",
      icon: Scale,
      type: "warning",
    },
    {
      title: "Ferritin",
      value: patient.labs.ferritin,
      unit: "ng/mL",
      status: patient.labs.ferritin < 15 ? "Low" : "Normal",
      icon: Droplet,
      type: "danger",
    },
    {
      title: "Vitamin D",
      value: patient.labs.vitaminD,
      unit: "ng/mL",
      status: patient.labs.vitaminD < 20 ? "Low" : "Normal",
      icon: Sun,
      type: "warning",
    },
  ];

  return (
    <section className="metrics-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div className={`metric-card pro ${card.type}`} key={card.title}>
            <div className="metric-top">
              <div className="metric-icon">
                <Icon size={22} />
              </div>

              <span className="metric-status">{card.status}</span>
            </div>

            <h4>{card.title}</h4>

            <div className="metric-value">
              <h2>{card.value}</h2>
              <span>{card.unit}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}