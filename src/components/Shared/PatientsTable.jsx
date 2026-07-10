export default function PatientsTable() {
  const patients = [
    { name: "Sarah A.", age: 28, diagnosis: "Iron Deficiency", risk: "High" },
    { name: "Mohammed K.", age: 45, diagnosis: "Obesity", risk: "Medium" },
    { name: "Reem H.", age: 22, diagnosis: "Vitamin D Deficiency", risk: "Low" },
    { name: "Ali M.", age: 60, diagnosis: "Diabetes Type 2", risk: "High" },
  ];

  return (
    <section className="patients-module">
      <div className="module-header">
        <div>
          <h2>Patients</h2>
          <p>Manage clinical nutrition patients</p>
        </div>

        <button className="primary-btn">+ New Patient</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Age</th>
            <th>Diagnosis</th>
            <th>Risk</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {patients.map((patient, index) => (
            <tr key={index}>
              <td>{patient.name}</td>
              <td>{patient.age}</td>
              <td>{patient.diagnosis}</td>
              <td>
                <span className={`risk ${patient.risk.toLowerCase()}`}>
                  {patient.risk}
                </span>
              </td>
              <td>
                <button className="view-btn">Open Profile</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}