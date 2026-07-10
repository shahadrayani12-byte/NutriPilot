import { useState } from "react";
import { usePatientStore } from "../../store/patientStore";
import DataEditor from "./DataEditor";

export default function Assessment() {
  const patient = usePatientStore((state) => state.patient);

  const [activeSection, setActiveSection] = useState("biochemical");
  const [showPES, setShowPES] = useState(false);

  const sections = {
    anthropometric: {
      letter: "A",
      title: "Anthropometric",
      status: "Completed",
      items: [
        `Weight: ${patient.weight} kg`,
        `Height: ${patient.height} cm`,
        `BMI: ${patient.scores.bmi}`,
        "Weight history: +6 kg / 6 months",
      ],
    },

    biochemical: {
      letter: "B",
      title: "Biochemical",
      status: "Needs Review",
      items: [
        `Ferritin: ${patient.labs.ferritin} ng/mL ↓`,
        `Hb: ${patient.labs.hemoglobin} g/dL ↓`,
        `Vitamin D: ${patient.labs.vitaminD} ng/mL ↓`,
        `Albumin: ${patient.labs.albumin}`,
      ],
    },

    clinical: {
      letter: "C",
      title: "Clinical",
      status: "In Progress",
      items: [
        `Diagnosis: ${patient.diagnosis.join(", ")}`,
        `GI symptoms: ${patient.symptoms.gi}`,
        `Fatigue: ${patient.symptoms.fatigue ? "Present" : "Absent"}`,
        "Medication: not recorded",
      ],
    },

    dietary: {
      letter: "D",
      title: "Dietary",
      status: "Needs Data",
      items: [
        `24h Recall: ${patient.dietary.recall24h}`,
        `Fiber intake: ${patient.dietary.fiber}`,
        `Protein intake: ${patient.dietary.protein}`,
        `FODMAP: ${patient.dietary.fodmap}`,
      ],
    },
  };

  const section = sections[activeSection];

  return (
    <section className="assessment-page">
      <div className="assessment-header">
        <div>
          <h2>Nutrition Assessment</h2>
          <p>ABCD clinical nutrition assessment workspace</p>
        </div>

        <button className="pes-btn" onClick={() => setShowPES(!showPES)}>
          Generate PES
        </button>
      </div>

      <DataEditor />

      <div className="assessment-grid">
        {Object.entries(sections).map(([key, item]) => (
          <button
            className={`assessment-card ${activeSection === key ? "selected" : ""}`}
            key={key}
            onClick={() => setActiveSection(key)}
          >
            <span className="assessment-letter">{item.letter}</span>
            <h3>{item.title}</h3>
            <p>{item.items.slice(0, 3).join(" • ")}</p>
            <small>{item.status}</small>
          </button>
        ))}
      </div>

      <div className="assessment-detail">
        <div>
          <span className="assessment-letter">{section.letter}</span>
          <h3>{section.title}</h3>
          <p>{section.status}</p>
        </div>

        <div className="assessment-list">
          {section.items.map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
      </div>

      {showPES && (
        <div className="pes-box">
          <h3>Suggested PES Statement</h3>

          <p>
            Inadequate iron intake related to possible low dietary iron intake
            and altered gastrointestinal tolerance as evidenced by ferritin{" "}
            {patient.labs.ferritin} ng/mL, hemoglobin{" "}
            {patient.labs.hemoglobin} g/dL, fatigue, and reported{" "}
            {patient.symptoms.gi.toLowerCase()}.
          </p>

          <h4>Suggested Intervention</h4>

          <p>
            Improve iron-rich food intake, enhance absorption strategies, review
            GI tolerance, and monitor ferritin and hemoglobin in follow-up.
          </p>
        </div>
      )}
    </section>
  );
}