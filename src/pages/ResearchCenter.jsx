import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  FlaskConical,
  GitBranch,
  Lightbulb,
  Microscope,
  Network,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  NutriBadge,
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
  NutriPanel,
  NutriSectionHeader,
} from "../components/common/NutriPilotPrimitives";

const commandStats = [
  ["Active Studies", "12", "secondary"],
  ["Publications", "28", "brand"],
  ["Grants", "4", "accent"],
  ["Ethics Status", "82%", "success"],
  ["Recruitment", "68%", "warning"],
  ["Research Health", "91", "brand"],
];

const canvasItems = [
  ["Research Question", "Does oral-gut axis nutrition status predict IBS symptom burden?"],
  ["PICO", "Adults with IBS, microbiome-informed nutrition intervention, standard care, symptom score."],
  ["Hypothesis", "Micronutrient and dietary pattern changes are associated with improved GI outcomes."],
  ["Objectives", "Map nutrition risks, oral markers, dietary intake, and clinical outcomes."],
  ["Variables", "Ferritin, vitamin D, fiber intake, GI symptoms, plaque samples, dietary recalls."],
  ["Outcomes", "Symptom improvement, dietary adherence, lab trends, oral health markers."],
  ["Study Design", "Cross-sectional cohort with longitudinal follow-up placeholder."],
  ["Criteria", "Adults, consented, complete recall; exclude acute illness or incomplete records."],
];

const timeline = [
  "Idea",
  "Proposal",
  "Supervisor Review",
  "IRB",
  "Recruitment",
  "Data Collection",
  "Analysis",
  "Writing",
  "Submission",
  "Publication",
];

const datasetMetrics = [
  ["Participants", "73", "Enrolled"],
  ["Questionnaires", "68", "Completed"],
  ["Blood Samples", "42", "Processed"],
  ["Plaque Samples", "18", "Received"],
  ["Dietary Recalls", "56", "Validated"],
  ["Missing Data", "9%", "Needs review"],
  ["Export Status", "Ready", "CSV locked"],
  ["Data Quality", "88", "Score"],
];

const collaborators = [
  ["Principal Investigator", "Dr. Shahad", "Study leadership and protocol ownership"],
  ["Co-authors", "Clinical Nutrition Team", "Manuscript sections and interpretation"],
  ["Supervisors", "University Faculty", "Scientific review and governance"],
  ["Students", "Research Assistants", "Data collection and screening logs"],
  ["Lab Team", "Biochemistry Lab", "Samples and assay coordination"],
  ["Dentist Collaborators", "Oral Health Unit", "Plaque samples and oral indices"],
  ["Statistician", "Biostatistics Core", "Analysis plan and reporting"],
];

const copilotCards = [
  "Research Gap Discovery",
  "Methodology Review",
  "Bias Detection",
  "Sample Size Advisor",
  "Statistical Suggestions",
  "Reference Recommendations",
  "Abstract Generator",
  "Manuscript Reviewer",
];

const readinessScores = [
  ["Scientific completeness", 82],
  ["Ethical readiness", 76],
  ["Dataset completeness", 68],
  ["Writing readiness", 54],
  ["Publication readiness", 61],
];

const vaultItems = [
  "Protocol",
  "Proposal",
  "IRB",
  "Consent Forms",
  "Case Report Forms",
  "References",
  "Manuscripts",
  "Supplementary Files",
];

export default function ResearchCenter() {
  return (
    <NutriPage>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">Clinical Research OS</NutriBadge>
              <NutriBadge tone="accent">Lifecycle workspace</NutriBadge>
            </>
          }
          kicker="Research Center"
          subtitle="A complete operating system for clinical nutrition research, from study idea and ethics approval to dataset quality, writing, and publication readiness."
          title="Research Operating System"
        />

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="space-y-5">
            <NutriPanel>
              <NutriSectionHeader icon={Microscope} kicker="Live dashboard" title="Research Command Center" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {commandStats.map(([label, value, tone]) => (
                  <ResearchStatCard key={label} label={label} tone={tone} value={value} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Target} kicker="Protocol builder" title="Research Canvas" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {canvasItems.map(([label, value]) => (
                  <ResearchCanvasCard key={label} label={label} value={value} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={BookOpen} kicker="Evidence layer" title="Literature Intelligence" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {["Saved Papers", "Key Findings", "Evidence Map", "Research Gap Finder"].map((item) => (
                    <PlaceholderTile key={item} icon={BookOpen} label={item} />
                  ))}
                </div>
                <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-6 text-center">
                  <div>
                    <Network className="mx-auto h-9 w-9 text-[var(--np-color-brand)]" />
                    <h3 className="mt-3 text-lg font-extrabold text-[var(--np-color-text)]">
                      Knowledge Graph Placeholder
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                      Reserved for future AI-supported evidence mapping and literature relationships.
                    </p>
                  </div>
                </div>
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={GitBranch} kicker="Milestones" title="Study Timeline" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5 xl:grid-cols-10">
                {timeline.map((step, index) => (
                  <Milestone key={step} active={index <= 5} index={index + 1} label={step} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={FlaskConical} kicker="Data operations" title="Dataset Control Room" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {datasetMetrics.map(([label, value, detail]) => (
                  <DatasetCard detail={detail} key={label} label={label} value={value} />
                ))}
              </div>
            </NutriPanel>
          </div>

          <aside className="space-y-5">
            <NutriPanel>
              <NutriSectionHeader icon={Users} kicker="Team science" title="Collaboration Hub" />
              <div className="space-y-3">
                {collaborators.map(([role, name, responsibility]) => (
                  <CollaboratorCard key={role} name={name} responsibility={responsibility} role={role} />
                ))}
              </div>
              <div className="mt-4 rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
                <p className="text-sm font-extrabold text-[var(--np-color-text)]">Tasks & Comments</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                  Placeholder stream for responsibilities, supervisor comments, and manuscript tasks.
                </p>
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Brain} kicker="Future AI" title="AI Research Copilot" />
              <div className="grid grid-cols-1 gap-2">
                {copilotCards.map((label) => (
                  <PlaceholderTile compact icon={Sparkles} key={label} label={label} />
                ))}
              </div>
            </NutriPanel>
          </aside>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <NutriPanel>
            <NutriSectionHeader icon={Award} kicker="Manuscript pathway" title="Publication Readiness" />
            <div className="space-y-4">
              {readinessScores.map(([label, value]) => (
                <ReadinessBar key={label} label={label} value={value} />
              ))}
            </div>
          </NutriPanel>

          <NutriPanel>
            <NutriSectionHeader icon={FileText} kicker="Research assets" title="Research Knowledge Vault" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {vaultItems.map((item) => (
                <PlaceholderTile compact icon={FileText} key={item} label={item} />
              ))}
            </div>
          </NutriPanel>
        </section>

        <NutriPanel className="mt-5">
          <NutriSectionHeader icon={Lightbulb} kicker="Experimental" title="Innovation Lab" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              ["Prototype Ideas", "Reserve space for study tools, digital phenotyping, and nutrition assessment experiments."],
              ["Future Integrations", "Connect research datasets, AI workflows, hospital systems, and literature engines."],
              ["Institute-Ready Vision", "Designed for universities, hospitals, and multi-center clinical research programs."],
            ].map(([title, text]) => (
              <article className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5" key={title}>
                <h3 className="text-base font-extrabold text-[var(--np-color-text)]">{title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{text}</p>
              </article>
            ))}
          </div>
        </NutriPanel>
      </NutriPageMain>
    </NutriPage>
  );
}

function ResearchStatCard({ label, tone, value }) {
  const toneClass = {
    accent: "np-badge-accent",
    brand: "np-badge-brand",
    secondary: "np-badge-secondary",
    success: "np-badge-success",
    warning: "np-badge-warning",
  }[tone];

  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <p className="text-3xl font-extrabold text-[var(--np-color-text)]">{value}</p>
      <p className="mt-2 min-h-10 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">{label}</p>
      <span className={`np-badge ${toneClass} mt-3`}>Live</span>
    </article>
  );
}

function ResearchCanvasCard({ label, value }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">{label}</p>
      <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{value}</p>
    </article>
  );
}

function PlaceholderTile({ compact = false, icon: Icon, label }) {
  return (
    <article className={`rounded-[20px] border border-[var(--np-color-border-soft)] bg-white ${compact ? "p-3" : "p-4"}`}>
      <Icon className="h-5 w-5 text-[var(--np-color-brand)]" />
      <p className="mt-3 text-sm font-extrabold text-[var(--np-color-text)]">{label}</p>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">Placeholder</p>
    </article>
  );
}

function Milestone({ active, index, label }) {
  return (
    <article className={`rounded-[18px] border p-3 text-center ${active ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]" : "border-[var(--np-color-border-soft)] bg-white"}`}>
      <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${active ? "bg-[var(--np-color-brand)] text-white" : "bg-[var(--np-color-surface-muted)] text-[var(--np-color-text-muted)]"}`}>
        {active ? <CheckCircle2 className="h-4 w-4" /> : index}
      </span>
      <p className="mt-2 text-xs font-extrabold leading-4 text-[var(--np-color-text)]">{label}</p>
    </article>
  );
}

function DatasetCard({ detail, label, value }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{label}</p>
      <h3 className="mt-3 text-2xl font-extrabold text-[var(--np-color-brand)]">{value}</h3>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{detail}</p>
    </article>
  );
}

function CollaboratorCard({ name, responsibility, role }) {
  return (
    <article className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">{role}</p>
      <h3 className="mt-2 text-sm font-extrabold text-[var(--np-color-text)]">{name}</h3>
      <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">{responsibility}</p>
    </article>
  );
}

function ReadinessBar({ label, value }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-extrabold text-[var(--np-color-text)]">{label}</p>
        <p className="text-sm font-extrabold text-[var(--np-color-brand)]">{value}%</p>
      </div>
      <div className="h-2 rounded-full bg-[var(--np-color-border-soft)]">
        <div className="h-full rounded-full bg-[var(--np-color-brand)]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
