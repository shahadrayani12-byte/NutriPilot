export default function AssessmentProgress() {
  const steps = [
    { name: "Anthropometric", progress: 100, status: "Completed" },
    { name: "Biochemical", progress: 70, status: "Needs Review" },
    { name: "Clinical", progress: 85, status: "In Progress" },
    { name: "Dietary", progress: 35, status: "Incomplete" },
  ];

  return (
    <div className="assessment-progress">
      <h3>Assessment Progress</h3>

      {steps.map((step) => (
        <div className="progress-item" key={step.name}>
          <div className="progress-header">
            <span>{step.name}</span>
            <span>{step.progress}%</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${step.progress}%` }}
            ></div>
          </div>

          <small>{step.status}</small>
        </div>
      ))}
    </div>
  );
}