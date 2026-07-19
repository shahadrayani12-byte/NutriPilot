import { nutriGuideContent } from "../../data/nutriGuideContent";

export const DEMO_PATIENT_ACCESS_CODE = "NP-2026-001";

export const demoPortalPatient = {
  id: "portal-patient-reem-hassan",
  fullName: "Reem Hassan",
  arabicName: "ريم حسن",
  assignedDietitian: "Dr. Shahad",
  diagnosisLabel: "Vitamin D nutrition follow-up",
  planTitle: "Vitamin D and balanced nutrition support plan",
  portalNotice: "This is a frontend demo portal. It is not production-secure authentication.",
};

export const demoTreatmentPlan = {
  mainGoal: "Support documented vitamin D nutrition education and balanced meal habits.",
  secondaryGoals: [
    "Review education materials assigned by the dietitian.",
    "Attend scheduled nutrition follow-up sessions.",
    "Track weekly nutrition goals from the care plan.",
  ],
  startDate: "2026-07-01",
  expectedDuration: "8 weeks",
  sessionsCompleted: 2,
  sessionsTotal: 6,
  interventionSummary: "Patient-friendly nutrition education and follow-up plan summary.",
  mealPlanPreview: [
    "Balanced breakfast pattern",
    "Hydration reminder",
    "General meal timing guidance",
  ],
  supplements: "Follow only clinician-provided recommendations. No supplement prescription is generated here.",
  progressStatus: "In progress",
  weeklyGoals: ["Read assigned Vitamin D guide", "Prepare questions for follow-up", "Track hydration for three days"],
};

export const demoAppointments = [
  {
    id: "portal-appt-1",
    type: "Nutrition follow-up",
    dietitian: "Dr. Shahad",
    date: "2026-07-24",
    time: "10:30",
    status: "Upcoming",
  },
  {
    id: "portal-appt-2",
    type: "Education review",
    dietitian: "Dr. Shahad",
    date: "2026-07-10",
    time: "09:30",
    status: "Completed",
  },
];

export const demoMessages = [
  {
    id: "msg-1",
    author: "Dr. Shahad",
    body: "Please review the assigned education material before your next appointment.",
    createdAt: "2026-07-18T08:30:00.000Z",
  },
  {
    id: "msg-2",
    author: "Reem Hassan",
    body: "I will review it and bring my questions.",
    createdAt: "2026-07-18T12:10:00.000Z",
  },
];

export const demoDocuments = [
  { id: "doc-1", category: "Education summary", title: "Nutrition visit summary", uploadedAt: "2026-07-10", status: "Available" },
  { id: "doc-2", category: "Appointment note", title: "Follow-up preparation sheet", uploadedAt: "2026-07-18", status: "Available" },
];

export const demoComplaints = [
  { id: "complaint-1", category: "Appointment", subject: "Waiting time feedback", status: "Under review", createdAt: "2026-07-12" },
];

export const demoRights = [
  {
    title: "Patient rights",
    items: [
      "Receive clear information in language that is easy to understand.",
      "Ask questions about the nutrition care plan.",
      "Know how complaints are routed to administration.",
      "Receive respectful and culturally appropriate care.",
    ],
  },
  {
    title: "Patient responsibilities",
    items: [
      "Provide accurate information for nutrition care.",
      "Follow the individualized care plan provided by healthcare professionals.",
      "Attend appointments or request changes in advance when possible.",
      "Use the demo portal understanding that Phase 1 is not a secure production system.",
    ],
  },
];

export function getDemoRecommendations() {
  const contentById = Object.fromEntries(nutriGuideContent.map((item) => [item.id, item]));
  return [
    {
      id: "rec-vitamin-d",
      contentId: "vitamin-d-foods",
      title: contentById["vitamin-d-foods"]?.title,
      text: contentById["vitamin-d-foods"]?.summary,
      dateSent: "2026-07-18",
      reason: "Assigned by dietitian for documented Vitamin D education context.",
      relatedGoal: "Review Vitamin D nutrition education.",
      readStatus: "Unread",
    },
    {
      id: "rec-balanced-plate",
      contentId: "balanced-plate-guide",
      title: contentById["balanced-plate-guide"]?.title,
      text: contentById["balanced-plate-guide"]?.summary,
      dateSent: "2026-07-15",
      reason: "Supports documented general meal-planning education.",
      relatedGoal: "Build confidence with balanced meal structure.",
      readStatus: "Read",
    },
  ];
}
