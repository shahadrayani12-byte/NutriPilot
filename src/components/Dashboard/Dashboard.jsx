import {
  Search,
  Bell,
  CalendarDays,
  Plus,
  Users,
  Droplet,
  AlertTriangle,
  Sparkles,
  FlaskConical,
  FileText,
  Brain,
  HeartPulse,
  Bone,
  ShieldCheck,
  Activity,
  Apple,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F8F3EE] p-8 text-[#120A12]">
      <TopBar />

      <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.45fr]">
        <WelcomeCard />
        <NutritionScore />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Ferritin" value="89%" status="Good" icon={Droplet} />
        <Metric title="Vitamin D" value="64%" status="Needs Improvement" icon={Apple} />
        <Metric title="Protein Status" value="97%" status="Excellent" icon={ShieldCheck} />
        <Metric title="MUST Screening" value="18" status="At Risk" icon={AlertTriangle} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.55fr_1.05fr]">
        <TodayPatients />
        <NutriMapPreview />
        <AIClinicalBrain />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ResearchHub />
        <PatientTimeline />
        <RecentReports />
      </section>
    </div>
  );
}

function TopBar() {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input
          className="w-full rounded-2xl border border-[var(--np-color-border)] bg-white px-12 py-3 text-sm shadow-[var(--np-shadow-card)] outline-none focus:border-[var(--np-color-brand)]"
          placeholder="Search patient by name, MRN, phone, or ID..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-2xl border border-[var(--np-color-border)] bg-white p-3 shadow-[var(--np-shadow-card)]">
          <CalendarDays className="h-5 w-5" />
        </button>
        <button className="rounded-2xl border border-[var(--np-color-border)] bg-white p-3 shadow-[var(--np-shadow-card)]">
          <Bell className="h-5 w-5" />
        </button>
        <button className="flex items-center gap-2 rounded-2xl bg-[var(--np-color-brand)] px-5 py-3 text-sm font-bold text-white shadow-[var(--np-shadow-card)]">
          <Plus className="h-4 w-4" />
          New Patient
        </button>
      </div>
    </header>
  );
}

function WelcomeCard() {
  return (
    <div className="rounded-[30px] border border-[var(--np-color-border)] bg-white p-8 shadow-[var(--np-shadow-card)]">
      <p className="text-xs font-extrabold uppercase tracking-widest text-[#B7791F]">
        Good Morning
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
        Good Morning, Dr. Shahad ًں‘‹
      </h1>
      <p className="mt-3 max-w-xl text-[var(--np-color-text-muted)]">
        AI analyzed 218 lab results this morning.
      </p>

      <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-[var(--np-color-brand-soft)] px-5 py-3 text-sm font-bold text-[var(--np-color-brand)]">
        <Sparkles className="h-5 w-5" />
        You have 6 patients requiring attention today
      </div>
    </div>
  );
}

function NutritionScore() {
  return (
    <div className="rounded-[30px] border border-[var(--np-color-border)] bg-white p-8 shadow-[var(--np-shadow-card)]">
      <p className="text-sm font-extrabold uppercase tracking-widest text-[var(--np-color-text-muted)]">
        Nutrition Score
      </p>

      <div className="mt-5 flex items-center gap-8">
        <div className="flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]">
          <div className="text-center">
            <h2 className="text-5xl font-extrabold text-[var(--np-color-brand)]">91</h2>
            <p className="text-sm text-[var(--np-color-text-muted)]">/100</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4">
          <MiniStatus title="Ferritin" value="89%" />
          <MiniStatus title="Vitamin D" value="64%" />
          <MiniStatus title="Protein" value="97%" />
          <MiniStatus title="Hydration" value="73%" />
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value, status, icon: Icon }) {
  return (
    <div className="rounded-[24px] border border-[var(--np-color-border)] bg-white p-6 shadow-[var(--np-shadow-card)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="rounded-2xl bg-[var(--np-color-brand-soft)] p-3 text-[var(--np-color-brand)]">
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-xs font-extrabold text-[var(--np-color-brand)]">{status}</span>
      </div>

      <h2 className="text-4xl font-extrabold">{value}</h2>
      <p className="mt-1 text-sm font-semibold text-[var(--np-color-text-muted)]">{title}</p>
    </div>
  );
}

function TodayPatients() {
  const patients = [
    ["08:00 AM", "Sarah Ahmed", "IBS • Low Ferritin"],
    ["09:30 AM", "Mohammed Khalid", "CKD • Protein Assessment"],
    ["10:30 AM", "Reem Hassan", "Pediatric • Growth Monitoring"],
  ];

  return (
    <Panel title="Today's Patients" icon={CalendarDays}>
      <div className="space-y-3">
        {patients.map((p) => (
          <div key={p[1]} className="flex items-center gap-4 rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
            <div className="w-20 rounded-xl bg-[var(--np-color-brand-soft)] px-3 py-2 text-center text-sm font-extrabold text-[var(--np-color-brand)]">
              {p[0]}
            </div>
            <div>
              <h4 className="font-extrabold">{p[1]}</h4>
              <p className="text-sm text-[var(--np-color-text-muted)]">{p[2]}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function NutriMapPreview() {
  return (
    <Panel title="NutriMap™ Interactive Body Map" icon={Activity}>
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Organ icon={Brain} name="Brain" status="Good" />
          <Organ icon={FlaskConical} name="Liver" status="At Risk" />
          <Organ icon={Activity} name="GI Tract" status="Attention" />
        </div>

        <div className="space-y-4">
          <Organ icon={HeartPulse} name="Heart" status="Good" />
          <Organ icon={ShieldCheck} name="Muscles" status="Good" />
          <Organ icon={Bone} name="Bones" status="At Risk" />
        </div>
      </div>
    </Panel>
  );
}

function AIClinicalBrain() {
  return (
    <Panel title="AI Clinical Brain" icon={Brain}>
      <div className="rounded-3xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-5">
        <p className="text-sm font-bold text-[var(--np-color-text-muted)]">Clinical Reasoning</p>
        <div className="mt-4 flex items-center gap-5">
          <h2 className="text-5xl font-extrabold text-[var(--np-color-brand)]">96%</h2>
          <p className="text-sm text-[var(--np-color-text-muted)]">High confidence in current analysis</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <Check text="4 patients show low ferritin levels" />
        <Check text="2 IBS patients with inflammatory markers" />
        <Check text="Low dietary fiber intake detected" />
        <Check text="Vitamin D deficiency is common" />
      </div>

      <button className="mt-6 w-full rounded-2xl bg-[var(--np-color-brand)] py-3 text-sm font-extrabold text-white">
        View AI Recommendations
      </button>
    </Panel>
  );
}

function ResearchHub() {
  return (
    <Panel title="Research Hub" icon={Users}>
      <h4 className="font-extrabold">IBS Study: Oral–Gut Axis</h4>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ResearchStat label="Participants" value="124" />
        <ResearchStat label="Plaque Samples" value="88" />
        <ResearchStat label="Dietary Records" value="96" />
      </div>
    </Panel>
  );
}

function PatientTimeline() {
  return (
    <Panel title="Patient Timeline Overview" icon={Activity}>
      <div className="grid grid-cols-5 gap-3 text-center text-sm">
        {["Assessment", "Labs", "Diet Plan", "Follow-up", "Progress"].map((x) => (
          <div key={x}>
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-[var(--np-color-brand-soft)]" />
            <p className="font-bold">{x}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RecentReports() {
  return (
    <Panel title="Recent Reports" icon={FileText}>
      <Doc title="Sarah Ahmed - Assessment Report" />
      <Doc title="IBS Study - Weekly Report" />
      <Doc title="Nutrition Risk Summary" />
    </Panel>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-[28px] border border-[var(--np-color-border)] bg-white p-6 shadow-[var(--np-shadow-card)]">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-5 w-5 text-[var(--np-color-brand)]" />
        <h3 className="text-lg font-extrabold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MiniStatus({ title, value }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-bold">
        <span>{title}</span>
        <span className="text-[var(--np-color-brand)]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[var(--np-color-brand)]" style={{ width: value }} />
      </div>
    </div>
  );
}

function Organ({ icon: Icon, name, status }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--np-color-border)] bg-white p-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[var(--np-color-brand)]" />
        <span className="font-bold">{name}</span>
      </div>
      <span className="text-xs font-bold text-[var(--np-color-brand)]">{status}</span>
    </div>
  );
}

function Check({ text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">
        ✓
      </span>
      <span>{text}</span>
    </div>
  );
}

function ResearchStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--np-color-surface-muted)] p-4">
      <h4 className="text-2xl font-extrabold text-[var(--np-color-brand)]">{value}</h4>
      <p className="text-xs text-[var(--np-color-text-muted)]">{label}</p>
    </div>
  );
}

function Doc({ title }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl bg-[var(--np-color-surface-muted)] p-4 text-sm">
      <span>{title}</span>
      <span className="font-extrabold text-[var(--np-color-brand)]">PDF</span>
    </div>
  );
}


