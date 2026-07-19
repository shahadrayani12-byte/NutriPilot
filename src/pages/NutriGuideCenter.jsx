import { useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  Leaf,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";

import { ActivePatientBanner } from "../components/common/ActivePatientBanner";
import {
  NutriAlert,
  NutriBadge,
  NutriButton,
  NutriCard,
  NutriEmptyState,
  NutriInput,
  NutriModal,
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
  NutriPanel,
  NutriSectionHeader,
  NutriSelect,
  NutriTabs,
  NutriTextarea,
} from "../components/common/NutriPilotPrimitives";
import { nutriGuideContent, nutriGuideTopics } from "../data/nutriGuideContent";
import { useTranslation } from "../i18n";

const sectionItems = [
  { id: "for-you", icon: Sparkles, labelKey: "nutriguide.forYou" },
  { id: "sent", icon: Send, labelKey: "nutriguide.sentByDietitian" },
  { id: "topics", icon: BookOpen, labelKey: "nutriguide.allTopics" },
  { id: "recipes", icon: Utensils, labelKey: "nutriguide.recipes" },
  { id: "saved", icon: BookmarkCheck, labelKey: "nutriguide.saved" },
];

const contentTypes = ["All", "Article", "Patient Guide", "Recipe", "Meal Idea", "Checklist", "Video placeholder", "Infographic placeholder"];

export default function NutriGuideCenter({
  activePatient,
  addEducationAssignments,
  educationAssignments = [],
  savedEducationContentIds = [],
  toggleSavedEducation,
  updateEducationAssignment,
}) {
  const { formatDate, language, t } = useTranslation();
  const [activeSection, setActiveSection] = useState("for-you");
  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [assignmentSeed, setAssignmentSeed] = useState(null);
  const patientAssignments = useMemo(
    () => educationAssignments.filter((assignment) => assignment.patientId === activePatient?.id),
    [activePatient?.id, educationAssignments],
  );
  const assignedIds = new Set(patientAssignments.map((assignment) => assignment.contentId));
  const savedIds = new Set(savedEducationContentIds);
  const localizedTopics = useMemo(
    () => nutriGuideTopics.map((topic) => ({ ...topic, label: localize(topic.title, language) })),
    [language],
  );
  const filteredContent = useMemo(
    () => filterContent(nutriGuideContent, { language, query, selectedLanguage, selectedTopic, selectedType }),
    [language, query, selectedLanguage, selectedTopic, selectedType],
  );
  const forYouItems = useMemo(
    () => buildForYouItems(activePatient, nutriGuideContent, patientAssignments, language),
    [activePatient, language, patientAssignments],
  );
  const recipes = filteredContent.filter((item) => ["Recipe", "Meal Idea"].includes(item.contentType));
  const savedItems = filteredContent.filter((item) => savedIds.has(item.id));
  const secondaryMaterials = useMemo(
    () => nutriGuideContent.filter((item) => ["healthy-energy-balanced-meals", "antioxidant-rich-foods", "stress-digestion-mind-gut"].includes(item.id)),
    [],
  );

  function openMaterial(material) {
    setSelectedMaterial(material);
    const assignment = patientAssignments.find((item) => item.contentId === material.id);
    if (assignment && assignment.readStatus === "Not started") {
      updateEducationAssignment?.(assignment.id, { readStatus: "In progress" });
    }
  }

  return (
    <NutriPage>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <NutriButton onClick={() => setAssignmentSeed({ initialContentIds: [] })} variant="secondary">
              <Send className="h-4 w-4" />
              {t("nutriguide.sendMaterial")}
            </NutriButton>
          }
          kicker={t("nutriguide.kicker")}
          subtitle={t("nutriguide.subtitle")}
          title={<bdi dir="ltr">NutriGuide™</bdi>}
        />

        <ActivePatientBanner patient={activePatient} />

        <NutriAlert tone="info">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-bold leading-6">{t("nutriguide.disclaimer")}</p>
          </div>
        </NutriAlert>

        <NutriPanel className="p-3">
          <NutriTabs
            activeItem={activeSection}
            className="overflow-x-auto"
            items={sectionItems.map((section) => ({
              ...section,
              label: t(section.labelKey),
            }))}
            onChange={setActiveSection}
          />
        </NutriPanel>

        {["topics", "recipes", "saved"].includes(activeSection) ? (
          <GuideFilters
            localizedTopics={localizedTopics}
            query={query}
            selectedLanguage={selectedLanguage}
            selectedTopic={selectedTopic}
            selectedType={selectedType}
            setQuery={setQuery}
            setSelectedLanguage={setSelectedLanguage}
            setSelectedTopic={setSelectedTopic}
            setSelectedType={setSelectedType}
            t={t}
          />
        ) : null}

        {activeSection === "for-you" ? (
          <div className="space-y-6">
            <ForYouSection
              assignedIds={assignedIds}
              items={forYouItems}
              language={language}
              onOpen={openMaterial}
              savedIds={savedIds}
              t={t}
              toggleSavedEducation={toggleSavedEducation}
            />
            <SecondaryRecommendations
              activePatient={activePatient}
              language={language}
              materials={secondaryMaterials}
              onAssign={(contentId) => setAssignmentSeed({ initialContentIds: [contentId] })}
              onOpen={openMaterial}
              onViewAll={() => setActiveSection("topics")}
              savedIds={savedIds}
              t={t}
              toggleSavedEducation={toggleSavedEducation}
            />
          </div>
        ) : null}

        {activeSection === "sent" ? (
          <SentSection
            assignments={patientAssignments}
            content={nutriGuideContent}
            formatDate={formatDate}
            language={language}
            onOpen={openMaterial}
            savedIds={savedIds}
            t={t}
            toggleSavedEducation={toggleSavedEducation}
          />
        ) : null}

        {activeSection === "topics" ? (
          <TopicsSection
            items={filteredContent}
            language={language}
            localizedTopics={localizedTopics}
            onOpen={openMaterial}
            savedIds={savedIds}
            t={t}
            toggleSavedEducation={toggleSavedEducation}
          />
        ) : null}

        {activeSection === "recipes" ? (
          <ContentGrid
            emptyIcon={Utensils}
            emptyTitle={t("nutriguide.noRecipes")}
            items={recipes}
            language={language}
            onOpen={openMaterial}
            savedIds={savedIds}
            t={t}
            toggleSavedEducation={toggleSavedEducation}
          />
        ) : null}

        {activeSection === "saved" ? (
          <ContentGrid
            emptyIcon={Bookmark}
            emptyTitle={t("nutriguide.noSaved")}
            items={savedItems}
            language={language}
            onOpen={openMaterial}
            savedIds={savedIds}
            t={t}
            toggleSavedEducation={toggleSavedEducation}
          />
        ) : null}
      </NutriPageMain>

      {assignmentSeed ? (
        <AssignmentModal
          activePatient={activePatient}
          addEducationAssignments={addEducationAssignments}
          existingAssignments={patientAssignments}
          initialContentIds={assignmentSeed.initialContentIds}
          language={language}
          onClose={() => setAssignmentSeed(null)}
          t={t}
        />
      ) : null}

      {selectedMaterial ? (
        <MaterialModal
          formatDate={formatDate}
          language={language}
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          saved={savedIds.has(selectedMaterial.id)}
          t={t}
          toggleSavedEducation={toggleSavedEducation}
        />
      ) : null}
    </NutriPage>
  );
}

function GuideFilters({ localizedTopics, query, selectedLanguage, selectedTopic, selectedType, setQuery, setSelectedLanguage, setSelectedTopic, setSelectedType, t }) {
  return (
    <NutriPanel className="p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <NutriInput
          label={t("common.search")}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("nutriguide.searchPlaceholder")}
          value={query}
        />
        <NutriSelect label={t("nutriguide.topic")} onChange={(event) => setSelectedTopic(event.target.value)} value={selectedTopic}>
          <option value="all">{t("common.all")}</option>
          {localizedTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
        </NutriSelect>
        <NutriSelect label={t("nutriguide.contentType")} onChange={(event) => setSelectedType(event.target.value)} value={selectedType}>
          {contentTypes.map((type) => <option key={type} value={type}>{type === "All" ? t("common.all") : type}</option>)}
        </NutriSelect>
        <NutriSelect label={t("nutriguide.language")} onChange={(event) => setSelectedLanguage(event.target.value)} value={selectedLanguage}>
          <option value="all">{t("common.all")}</option>
          <option value="both">{t("nutriguide.bilingual")}</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </NutriSelect>
        <div className="flex items-end">
          <NutriBadge className="min-h-11 justify-center" tone="info">
            <Filter className="h-4 w-4" />
            {t("nutriguide.compactFilters")}
          </NutriBadge>
        </div>
      </div>
    </NutriPanel>
  );
}

function ForYouSection({ assignedIds, items, language, onOpen, savedIds, t, toggleSavedEducation }) {
  if (!items.length) {
    return (
      <NutriEmptyState icon={Sparkles} title={t("nutriguide.noForYou")}>
        {t("nutriguide.noForYouDescription")}
      </NutriEmptyState>
    );
  }

  return (
    <ContentGrid
      items={items.map((item) => ({ ...item.material, recommendationReason: item.reason, assigned: assignedIds.has(item.material.id) }))}
      language={language}
      onOpen={onOpen}
      savedIds={savedIds}
      t={t}
      toggleSavedEducation={toggleSavedEducation}
    />
  );
}

function SentSection({ assignments, content, formatDate, language, onOpen, savedIds, t, toggleSavedEducation }) {
  if (!assignments.length) {
    return (
      <NutriEmptyState icon={Send} title={t("nutriguide.noAssigned")}>
        {t("nutriguide.noAssignedDescription")}
      </NutriEmptyState>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3 2xl:grid-cols-6">
      {assignments.map((assignment) => {
        const material = content.find((item) => item.id === assignment.contentId);
        if (!material) return null;

        return (
          <ContentCard
            assignment={assignment}
            formatDate={formatDate}
            key={assignment.id}
            language={language}
            material={material}
            onOpen={() => onOpen(material)}
            saved={savedIds.has(material.id) || assignment.saved}
            t={t}
            toggleSavedEducation={toggleSavedEducation}
          />
        );
      })}
    </section>
  );
}

function TopicsSection({ items, language, localizedTopics, onOpen, savedIds, t, toggleSavedEducation }) {
  const counts = Object.fromEntries(localizedTopics.map((topic) => [topic.id, items.filter((item) => item.topic === topic.id).length]));

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {localizedTopics.map((topic) => (
          <NutriCard className="p-4" key={topic.id}>
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{topic.label}</p>
            <p className="mt-2 text-xs font-bold text-[var(--np-color-text-muted)]">{counts[topic.id] || 0} {t("nutriguide.materials")}</p>
          </NutriCard>
        ))}
      </section>
      <ContentGrid
        emptyIcon={Search}
        emptyTitle={t("nutriguide.noMaterials")}
        items={items}
        language={language}
        onOpen={onOpen}
        savedIds={savedIds}
        t={t}
        toggleSavedEducation={toggleSavedEducation}
      />
    </div>
  );
}

function ContentGrid({ emptyIcon = BookOpen, emptyTitle, items, language, onOpen, savedIds, t, toggleSavedEducation }) {
  if (!items.length) {
    return <NutriEmptyState icon={emptyIcon} title={emptyTitle || t("nutriguide.noMaterials")} />;
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3 2xl:grid-cols-6">
      {items.map((material) => (
        <ContentCard
          key={material.id}
          language={language}
          material={material}
          onOpen={() => onOpen(material)}
          saved={savedIds.has(material.id)}
          t={t}
          toggleSavedEducation={toggleSavedEducation}
        />
      ))}
    </section>
  );
}

function SecondaryRecommendations({ activePatient, language, materials, onAssign, onOpen, onViewAll, savedIds, t, toggleSavedEducation }) {
  if (!materials.length) return null;
  const patientName = activePatient?.fullName || t("nutriguide.patient");
  const patientText = buildPatientSearchText(activePatient);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-[var(--np-color-text)]" dir="auto">
          {t("nutriguide.secondaryTitle", { patientName })}
        </h2>
        <NutriButton className="min-h-10 px-4 text-xs" onClick={onViewAll} variant="secondary">
          {t("nutriguide.viewAll")}
        </NutriButton>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {materials.map((material) => (
          <SecondaryRecommendationCard
            isSupported={isMaterialSupportedByPatient(material, patientText)}
            key={material.id}
            language={language}
            material={material}
            onAssign={() => onAssign(material.id)}
            onOpen={() => onOpen(material)}
            saved={savedIds.has(material.id)}
            t={t}
            toggleSavedEducation={toggleSavedEducation}
          />
        ))}
      </div>
    </section>
  );
}

function SecondaryRecommendationCard({ isSupported, language, material, onAssign, onOpen, saved, t, toggleSavedEducation }) {
  const title = localize(material.title, language);
  const summary = localize(material.summary, language);
  const category = localize(material.category, language) || material.contentType;
  const imageAlt = localize(material.imageAlt, language) || title;

  return (
    <NutriCard className="grid h-full grid-cols-1 overflow-hidden p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:grid-cols-[150px_minmax(0,1fr)]">
      <div className="min-h-[170px] overflow-hidden bg-[var(--np-color-surface-muted)] sm:min-h-full">
        {material.imageSrc ? (
          <img alt={imageAlt} className="h-full min-h-[170px] w-full object-cover" loading="lazy" src={material.imageSrc} />
        ) : (
          <div className={`${getGuideVisual(material).background} flex h-full min-h-[170px] items-center justify-center text-lg font-black text-[var(--np-color-brand)]`}>
            {material.image || "NG"}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <NutriBadge tone={typeTone(material.contentType)}>{category}</NutriBadge>
          <NutriBadge tone={isSupported ? "brand" : "secondary"}>
            {isSupported ? t("nutriguide.documentedContext") : t("nutriguide.libraryOption")}
          </NutriBadge>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-extrabold leading-6 text-[var(--np-color-text)]" dir="auto">{title}</h3>
          <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]" dir="auto">{summary}</p>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2">
          <NutriButton className="min-h-10 justify-center px-3 text-xs" onClick={() => toggleSavedEducation?.(material.id)} variant="secondary">
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saved ? t("nutriguide.saved") : t("nutriguide.save")}
          </NutriButton>
          <NutriButton className="min-h-10 justify-center px-3 text-xs" onClick={onAssign} variant="secondary">
            <Send className="h-4 w-4" />
            {t("nutriguide.assign")}
          </NutriButton>
        </div>
        <button className="text-start text-xs font-extrabold text-[var(--np-color-brand)] hover:underline" onClick={onOpen} type="button">
          {t("nutriguide.read")}
        </button>
      </div>
    </NutriCard>
  );
}

function ContentCard({ assignment, formatDate, language, material, onOpen, saved, t, toggleSavedEducation }) {
  const title = localize(material.title, language);
  const summary = localize(material.summary, language);
  const category = localize(material.category, language) || material.contentType;
  const imageAlt = localize(material.imageAlt, language) || title;
  const visual = getGuideVisual(material);

  return (
    <NutriCard className="group flex h-full min-h-[360px] flex-col overflow-hidden border border-[var(--np-color-border-soft)] p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(15,23,42,0.1)]">
      <div className={`relative aspect-[4/3] min-h-[148px] overflow-hidden ${material.imageSrc ? "bg-[var(--np-color-surface-muted)]" : visual.background}`}>
        {material.imageSrc ? (
          <img
            alt={imageAlt}
            className="h-full w-full object-cover"
            loading="lazy"
            src={material.imageSrc}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.72),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(0,0,0,0.08))]" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/55 bg-white/82 text-base font-black text-[var(--np-color-brand)] shadow-sm backdrop-blur">
                {visual.mark}
              </span>
              <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--np-color-brand)] shadow-sm backdrop-blur">
                {visual.topic}
              </span>
            </div>
          </>
        )}
        <button
          aria-label={saved ? t("nutriguide.saved") : t("nutriguide.save")}
          className={`absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition ${
            saved
              ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white"
              : "border-white/75 bg-white/88 text-[var(--np-color-brand)] hover:border-[var(--np-color-brand)]"
          }`}
          onClick={() => toggleSavedEducation?.(material.id)}
          type="button"
        >
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <NutriBadge tone={typeTone(material.contentType)}>{category}</NutriBadge>
          <h2 className="mt-3 line-clamp-2 text-base font-extrabold leading-6 text-[var(--np-color-text)]" dir="auto">{title}</h2>
          <p className="mt-2 line-clamp-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]" dir="auto">{summary}</p>
        </div>
      </div>
      {material.recommendationReason ? (
        <NutriAlert tone="brand" className="mx-4 py-3">
          <p className="text-xs font-extrabold">{material.recommendationReason}</p>
        </NutriAlert>
      ) : null}
      {assignment ? (
        <div className="mx-4 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
          <p className="text-xs font-extrabold text-[var(--np-color-text)]">{t("nutriguide.sentBy")} {assignment.assignedClinician}</p>
          <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{formatDate?.(assignment.assignedDate)} · {assignment.reason}</p>
          {assignment.clinicianNote ? <p className="mt-2 text-xs font-bold text-[var(--np-color-text-muted)]" dir="auto">{assignment.clinicianNote}</p> : null}
        </div>
      ) : null}
      <div className="mt-auto border-t border-[var(--np-color-border-soft)] bg-white/80 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--np-color-text-muted)]">
          <Clock3 className="h-4 w-4" />
          {material.readingTime} {t("nutriguide.minRead")}
        </div>
          <NutriBadge tone="warning">{material.clinicalReviewStatus}</NutriBadge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NutriButton className="min-h-10 justify-center px-3 text-xs" onClick={() => toggleSavedEducation?.(material.id)} variant="secondary">
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saved ? t("nutriguide.saved") : t("nutriguide.save")}
          </NutriButton>
          <NutriButton className="min-h-10 justify-center px-3 text-xs" onClick={onOpen}>
            {assignment?.readStatus === "In progress" ? t("nutriguide.continueReading") : t("nutriguide.read")}
          </NutriButton>
        </div>
      </div>
    </NutriCard>
  );
}

function AssignmentModal({ activePatient, addEducationAssignments, existingAssignments, initialContentIds = [], language, onClose, t }) {
  const [query, setQuery] = useState("");
  const existingIds = new Set(existingAssignments.map((assignment) => assignment.contentId));
  const [selectedIds, setSelectedIds] = useState(() => initialContentIds.filter((contentId) => !existingIds.has(contentId)));
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const filtered = filterContent(nutriGuideContent, { language, query, selectedLanguage: "all", selectedTopic: "all", selectedType: "All" });
  const canAssign = selectedIds.length > 0 && reason.trim() && confirmed;

  function toggleSelected(contentId) {
    if (existingIds.has(contentId)) return;
    setSelectedIds((current) => current.includes(contentId) ? current.filter((id) => id !== contentId) : [contentId, ...current]);
  }

  function assign() {
    if (!canAssign || !activePatient?.id) return;
    const now = new Date().toISOString();
    addEducationAssignments?.(selectedIds.map((contentId) => ({
      id: `edu-${activePatient.id}-${contentId}-${Date.now()}`,
      contentId,
      patientId: activePatient.id,
      assignedClinician: "Dr. Shahad",
      assignedDate: now,
      reason: reason.trim(),
      clinicianNote: note.trim(),
      readStatus: "Not started",
      saved: false,
    })));
    onClose();
  }

  return (
    <NutriModal className="max-w-4xl" kicker={t("nutriguide.clinicianAction")} onClose={onClose} title={t("nutriguide.sendMaterial")}>
      <div className="space-y-4">
        <NutriAlert tone="warning">
          {t("nutriguide.assignmentSafety")}
        </NutriAlert>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
          <NutriInput label={t("common.search")} onChange={(event) => setQuery(event.target.value)} value={query} />
          <NutriInput label={t("nutriguide.patient")} readOnly value={activePatient?.fullName || t("nutriguide.noActivePatient")} />
        </div>
        <section className="grid max-h-[320px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {filtered.map((material) => {
            const disabled = existingIds.has(material.id);
            const selected = selectedIds.includes(material.id);
            return (
              <button
                className={`rounded-[18px] border p-4 text-start transition ${
                  selected ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]" : "border-[var(--np-color-border-soft)] bg-white"
                } ${disabled ? "opacity-60" : "hover:border-[var(--np-color-brand)]"}`}
                disabled={disabled}
                key={material.id}
                onClick={() => toggleSelected(material.id)}
                type="button"
              >
                <p className="text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{localize(material.title, language)}</p>
                <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]" dir="auto">{localize(material.summary, language)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <NutriBadge tone={disabled ? "success" : "secondary"}>{disabled ? t("nutriguide.alreadyAssigned") : material.contentType}</NutriBadge>
                  {selected ? <NutriBadge tone="brand">{t("common.selected")}</NutriBadge> : null}
                </div>
              </button>
            );
          })}
        </section>
        <NutriInput label={t("nutriguide.reason")} onChange={(event) => setReason(event.target.value)} value={reason} />
        <NutriTextarea label={t("nutriguide.clinicianNote")} onChange={(event) => setNote(event.target.value)} rows={3} value={note} />
        <label className="flex items-start gap-3 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
          <input checked={confirmed} className="mt-1" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
          <span>{t("nutriguide.confirmAssignment")}</span>
        </label>
        <div className="flex flex-wrap justify-end gap-3">
          <NutriButton onClick={onClose} variant="secondary">{t("common.cancel")}</NutriButton>
          <NutriButton disabled={!canAssign} onClick={assign}>
            <CheckCircle2 className="h-4 w-4" />
            {t("nutriguide.assignSelected")}
          </NutriButton>
        </div>
      </div>
    </NutriModal>
  );
}

function MaterialModal({ formatDate, language, material, onClose, saved, t, toggleSavedEducation }) {
  return (
    <NutriModal className="max-w-3xl" kicker={material.contentType} onClose={onClose} title={localize(material.title, language)}>
      <div className="space-y-5">
        <p className="text-sm font-bold leading-6 text-[var(--np-color-text-muted)]" dir="auto">{localize(material.summary, language)}</p>
        <div className="flex flex-wrap gap-2">
          <NutriBadge tone="warning">{material.clinicalReviewStatus}</NutriBadge>
          <NutriBadge tone="secondary">{material.readingTime} {t("nutriguide.minRead")}</NutriBadge>
          <NutriBadge tone="info">{t("nutriguide.lastReviewed")} {formatDate(material.lastReviewedDate)}</NutriBadge>
        </div>
        <NutriPanel className="p-4 shadow-none">
          <ul className="space-y-3 text-sm font-bold leading-6 text-[var(--np-color-text)]">
            {localize(material.content, language).map((paragraph) => <li key={paragraph} dir="auto">{paragraph}</li>)}
          </ul>
        </NutriPanel>
        {material.recipe ? (
          <RecipeDetails material={material} t={t} />
        ) : null}
        <NutriAlert tone="info">{t("nutriguide.disclaimer")}</NutriAlert>
        <div className="flex flex-wrap justify-end gap-3">
          <NutriButton onClick={() => toggleSavedEducation?.(material.id)} variant="secondary">
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saved ? t("nutriguide.saved") : t("nutriguide.save")}
          </NutriButton>
          <NutriButton onClick={onClose}>{t("common.close")}</NutriButton>
        </div>
      </div>
    </NutriModal>
  );
}

function RecipeDetails({ material, t }) {
  return (
    <NutriPanel className="p-4 shadow-none">
      <NutriSectionHeader icon={Leaf} title={t("nutriguide.recipeDetails")} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DetailList items={material.recipe.ingredients} title={t("nutriguide.ingredients")} />
        <DetailList items={material.recipe.steps} title={t("nutriguide.preparation")} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm font-bold text-[var(--np-color-text-muted)] md:grid-cols-3">
        <p>{t("nutriguide.prepTime")}: {material.recipe.prepTime}</p>
        <p>{t("nutriguide.servings")}: {material.recipe.servings}</p>
        <p>{t("nutriguide.allergens")}: {material.recipe.allergens}</p>
      </div>
    </NutriPanel>
  );
}

function DetailList({ items, title }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</p>
      <ul className="mt-2 list-disc space-y-1 ps-5 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function filterContent(items, { language, query, selectedLanguage, selectedTopic, selectedType }) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesTopic = selectedTopic === "all" || item.topic === selectedTopic;
    const matchesType = selectedType === "All" || item.contentType === selectedType;
    const matchesLanguage = selectedLanguage === "all" || item.language === selectedLanguage || item.language === "both";
    const searchText = [
      localize(item.title, language),
      localize(item.summary, language),
      item.contentType,
      item.topic,
      item.tags.join(" "),
      item.targetConditions.join(" "),
      item.targetGoals.join(" "),
    ].join(" ").toLowerCase();

    return matchesTopic && matchesType && matchesLanguage && (!normalizedQuery || searchText.includes(normalizedQuery));
  });
}

function buildForYouItems(patient, content, assignments, language) {
  if (!patient) return [];
  const assigned = assignments
    .map((assignment) => {
      const material = content.find((item) => item.id === assignment.contentId);
      return material ? { material, reason: assignment.reason || phrase(language, "Sent by your dietitian", "أرسله أخصائي التغذية") } : null;
    })
    .filter(Boolean);
  const patientText = buildPatientSearchText(patient);
  const suggested = content
    .filter((material) => !assigned.some((item) => item.material.id === material.id))
    .filter((material) =>
      [...material.targetConditions, ...material.targetGoals, ...material.tags].some((tag) => tag && patientText.includes(String(tag).toLowerCase())),
    )
    .slice(0, 4)
    .map((material) => ({
      material,
      reason: phrase(language, "Related to documented patient information", "مرتبط بمعلومات موثقة في سجل المريض"),
    }));

  return [...assigned, ...suggested];
}

function buildPatientSearchText(patient) {
  if (!patient) return "";
  return [
    patient.diagnosis,
    patient.riskLevel,
    patient.nutritionGoals,
    patient.patientGoals,
    patient.notes,
    collectionText(patient.interventions, ["goal", "dietPrescription", "education"]),
    collectionText(patient.followUps, ["goalProgress", "outcome", "symptomTrend", "dietaryAdherence"]),
    labText(patient.labs),
    labText(patient.laboratoryResults),
    labText(patient.laboratory),
  ].join(" ").toLowerCase();
}

function isMaterialSupportedByPatient(material, patientText) {
  if (!patientText) return false;
  return [...material.targetConditions, ...material.targetGoals, ...material.tags]
    .some((tag) => tag && patientText.includes(String(tag).toLowerCase()));
}

function collectionText(value, fields) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => fields.map((field) => item?.[field] || "").join(" ")).join(" ");
}

function labText(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map((item) => `${item.test || item.name || item.label || ""} ${item.value || ""} ${item.status || ""}`).join(" ");
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, entry]) => {
      if (entry && typeof entry === "object") return `${key} ${entry.value || ""} ${entry.status || ""}`;
      return `${key} ${entry}`;
    }).join(" ");
  }

  return String(value);
}

function localize(value, language) {
  if (Array.isArray(value)) return value;
  if (value?.[language]) return value[language];
  if (value?.en) return value.en;
  return value || "";
}

function phrase(language, en, ar) {
  return language === "ar" ? ar : en;
}

function typeTone(type) {
  if (type === "Recipe" || type === "Meal Idea") return "accent";
  if (type === "Checklist") return "info";
  if (type === "Patient Guide") return "brand";
  return "secondary";
}

function getGuideVisual(material) {
  const visuals = {
    "food-labels": {
      background: "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0_48%,#f7efe8)]",
      mark: "Lb",
      topic: "Labels",
    },
    "gi-ibs": {
      background: "bg-[linear-gradient(135deg,#12233f,#4567a1_48%,#d58b91)]",
      mark: "GI",
      topic: "Digestive",
    },
    hydration: {
      background: "bg-[linear-gradient(135deg,#eff6ff,#bfdbfe_48%,#dbeafe)]",
      mark: "H2",
      topic: "Hydration",
    },
    "iron-anemia": {
      background: "bg-[linear-gradient(135deg,#7f1d1d,#b45309_46%,#f3d6b5)]",
      mark: "Fe",
      topic: "Iron",
    },
    "meal-planning": {
      background: "bg-[linear-gradient(135deg,#ecfccb,#86efac_42%,#fef3c7)]",
      mark: "Mp",
      topic: "Meals",
    },
  };

  return visuals[material.topic] || {
    background: "bg-[linear-gradient(135deg,#fff7ed,#fde68a_45%,#fce7f3)]",
    mark: material.image || "NG",
    topic: material.contentType,
  };
}
