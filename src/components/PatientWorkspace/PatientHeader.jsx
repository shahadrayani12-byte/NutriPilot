import { usePatientStore } from "../../store/patientStore";

export default function PatientHeader() {
  const patient = usePatientStore((state) => state.patient);

  const initials = patient.name
    .split(" ")
    .map((word) => word[0])
    .join("");

  return (
    <section className="pw-header">

      <div className="pw-left">

        <div className="pw-avatar">
          {initials}
        </div>

        <div>

          <h1>{patient.name}</h1>

          <p>
            {patient.gender} • {patient.age} Years •{" "}
            {patient.height} cm • {patient.weight} kg
          </p>

          <div className="pw-tags">

            {patient.diagnosis.map((item) => (
              <span key={item}>{item}</span>
            ))}

          </div>

        </div>

      </div>

      <div className="pw-score">

        <p>Nutrition Score</p>

        <h2>{patient.scores.nutrition}</h2>

        <span>/100</span>

      </div>

    </section>
  );
}