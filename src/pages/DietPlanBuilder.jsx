import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Copy,
  FileText,
  History,
  Plus,
  Save,
  Trash2,
  Utensils,
} from "lucide-react";

import {
  NutriBadge,
  NutriButton,
  NutriInput,
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
  NutriPanel,
  NutriSectionHeader,
  NutriSelect,
  NutriTextarea,
} from "../components/common/NutriPilotPrimitives";
import { FOOD_CATEGORIES, LOCAL_FOODS, SERVING_UNITS, scaleFoodNutrition, searchFoods } from "../data/foodDatabase";

export default function DietPlanBuilder({ activePatient, onNavigate, updatePatient }) {
  const patient = activePatient || EMPTY_PATIENT;
  const patientId = patient.id;
  const [plan, setPlan] = useState(() => getActivePlan(patient));
  const [selectedDuration, setSelectedDuration] = useState(plan.duration || "seven");
  const [foodSearchTarget, setFoodSearchTarget] = useState(null);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState(loadLocalList("nutripilot.foodFavorites"));
  const [recentFoods, setRecentFoods] = useState(loadLocalList("nutripilot.recentFoods"));
  const [customFoods, setCustomFoods] = useState(loadLocalList("nutripilot.customFoods"));
  const totals = useMemo(() => calculatePlanTotals(plan, selectedDuration), [plan, selectedDuration]);
  const safetyAlerts = useMemo(() => buildSafetyAlerts(patient, plan), [patient, plan]);
  const activeDays = plan.days.slice(0, durationCount(selectedDuration));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextPlan = getActivePlan(patient);
      setPlan(nextPlan);
      setSelectedDuration(nextPlan.duration || "seven");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [patient, patientId]);

  useEffect(() => {
    localStorage.setItem(dietPlanDraftKey(patientId), JSON.stringify(plan));
  }, [patientId, plan]);

  function updatePlanField(field, value) {
    setPlan((current) => ({ ...current, [field]: value }));
  }

  function updateTarget(field, value) {
    setPlan((current) => ({ ...current, targets: { ...current.targets, [field]: value } }));
  }

  function updateInstructions(field, value) {
    setPlan((current) => ({ ...current, instructions: { ...current.instructions, [field]: value } }));
  }

  function updateActivity(field, value) {
    setPlan((current) => ({ ...current, activity: { ...current.activity, [field]: value } }));
  }

  function updateMeal(dayId, mealId, itemId, field, value) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId
                  ? {
                      ...meal,
                      items: meal.items.map((item) => item.id === itemId ? updateMealItemValue(item, field, value) : item),
                    }
                  : meal,
              ),
            }
          : day,
      ),
    }));
  }

  function addMealItem(dayId, mealId) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId
                  ? { ...meal, items: [...meal.items, createMealItem(`${dayId}-${mealId}-${meal.items.length}`)] }
                  : meal,
              ),
            }
          : day,
      ),
    }));
  }

  function addFoodToMeal(food) {
    if (!foodSearchTarget) return;
    const selectedFood = normalizeFoodRecord(food);
    const nextItem = foodToMealItem(selectedFood, `${foodSearchTarget.dayId}-${foodSearchTarget.mealId}-${Date.now()}`);
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === foodSearchTarget.dayId
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === foodSearchTarget.mealId
                  ? { ...meal, items: [...meal.items, nextItem] }
                  : meal,
              ),
            }
          : day,
      ),
    }));
    const nextRecent = [selectedFood, ...recentFoods.filter((item) => item.foodId !== selectedFood.foodId)].slice(0, 8);
    setRecentFoods(nextRecent);
    saveLocalList("nutripilot.recentFoods", nextRecent);
    setFoodSearchTarget(null);
  }

  function toggleFavorite(food) {
    const foodId = food.foodId;
    const nextFavorites = favoriteFoodIds.includes(foodId)
      ? favoriteFoodIds.filter((item) => item !== foodId)
      : [foodId, ...favoriteFoodIds].slice(0, 20);
    setFavoriteFoodIds(nextFavorites);
    saveLocalList("nutripilot.foodFavorites", nextFavorites);
  }

  function addCustomFood(food) {
    const nextFood = normalizeFoodRecord({
      ...food,
      category: "Custom foods",
      dataStatus: "User-entered",
      foodId: `custom-food-${customFoods.length + 1}`,
      sourceLabel: "Clinician-entered local custom food",
    });
    const nextCustomFoods = [nextFood, ...customFoods];
    setCustomFoods(nextCustomFoods);
    saveLocalList("nutripilot.customFoods", nextCustomFoods);
  }

  function deleteMealItem(dayId, mealId, itemId) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId
                  ? { ...meal, items: meal.items.filter((item) => item.id !== itemId) }
                  : meal,
              ),
            }
          : day,
      ),
    }));
  }

  function duplicateMealItem(dayId, mealId, item) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId
                  ? { ...meal, items: [...meal.items, { ...item, id: `${item.id}-copy-${meal.items.length}` }] }
                  : meal,
              ),
            }
          : day,
      ),
    }));
  }

  function moveMealItem(dayId, mealId, itemId, direction) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId ? { ...meal, items: reorderItems(meal.items, itemId, direction) } : meal,
              ),
            }
          : day,
      ),
    }));
  }

  function copyDay(dayId) {
    const sourceIndex = plan.days.findIndex((day) => day.id === dayId);
    const targetIndex = sourceIndex + 1;
    if (sourceIndex < 0 || targetIndex >= plan.days.length) return;
    setPlan((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === targetIndex
          ? { ...day, meals: cloneMeals(current.days[sourceIndex].meals), notes: current.days[sourceIndex].notes }
          : day,
      ),
    }));
  }

  function updateDayActivity(dayId, field, value) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId ? { ...day, physicalActivity: { ...day.physicalActivity, [field]: value } } : day,
      ),
    }));
  }

  function updateDayNotes(dayId, value) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) => day.id === dayId ? { ...day, notes: value } : day),
    }));
  }

  function persistPlan(status = plan.status) {
    const nextPlan = {
      ...plan,
      duration: selectedDuration,
      status,
      version: status === "Active" ? Number(plan.version || 1) + 1 : plan.version || 1,
      versionHistory: [
        { author: "Clinical Dietitian", changes: `${status} saved locally`, date: "Current session", status, version: `v${plan.version || 1}` },
        ...(plan.versionHistory || []),
      ],
    };
    const otherPlans = Array.isArray(patient.dietPlans) ? patient.dietPlans.filter((item) => item.id !== nextPlan.id) : [];
    const nextPatient = {
      ...patient,
      dietPlans: status === "Active"
        ? [nextPlan, ...otherPlans.map((item) => item.status === "Active" ? { ...item, status: "Archived" } : item)]
        : [nextPlan, ...otherPlans],
      nextFollowUpDate: nextPlan.reviewDate || patient.nextFollowUpDate,
    };

    if (status === "Active") {
      nextPatient.interventions = [
        {
          dietPrescription: nextPlan.dietType,
          goal: nextPlan.clinicalGoal || "Active diet plan connected to nutrition intervention.",
          id: `intervention-diet-plan-${nextPlan.id}`,
          monitoringIndicators: "Monitor intake adherence, activity tolerance, weight, symptoms, and relevant labs.",
          status: "Active",
        },
        ...(patient.interventions || []),
      ];
      nextPatient.followUps = [
        {
          date: nextPlan.reviewDate || "",
          dietaryAdherence: "Plan activated - adherence pending review",
          goalProgress: "Diet plan activated",
          id: `follow-up-diet-plan-${nextPlan.id}`,
          nextAction: "Review meal adherence, activity tolerance, and nutrition goals.",
          outcome: "Pending",
          status: "Scheduled",
        },
        ...(patient.followUps || []),
      ];
    }

    updatePatient?.(nextPatient);
    setPlan(nextPlan);
    localStorage.setItem(dietPlanDraftKey(patient.id), JSON.stringify(nextPlan));
  }

  function duplicatePlan() {
    const copy = {
      ...plan,
      id: `diet-plan-copy-${(patient.dietPlans?.length || 0) + 1}`,
      status: "Draft",
      title: `${plan.title || "Diet plan"} copy`,
      version: 1,
    };
    setPlan(copy);
  }

  return (
    <NutriPage>
      <NutriPageMain>
        <NutriPageHeader
          kicker="Diet Plans"
          title="Diet Plan Builder"
          subtitle="Dedicated nutrition and activity prescription workspace connected to the active patient."
          actions={(
            <>
              <NutriButton onClick={() => persistPlan("Draft")}><Save className="h-4 w-4" />Save Draft</NutriButton>
              <NutriButton onClick={() => persistPlan("Active")} variant="secondary"><Activity className="h-4 w-4" />Activate Plan</NutriButton>
              <NutriButton onClick={() => onNavigate?.("reports")} variant="secondary"><FileText className="h-4 w-4" />Generate PDF</NutriButton>
            </>
          )}
        />

        <DietPlanTopHeader patient={patient} plan={plan} totals={totals} />

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <PlanOverview plan={plan} patient={patient} updatePlanField={updatePlanField} updateTarget={updateTarget} />
            <WeeklyMealPlanner
              activeDays={activeDays}
              addMealItem={addMealItem}
              copyDay={copyDay}
              deleteMealItem={deleteMealItem}
              duplicateMealItem={duplicateMealItem}
              moveMealItem={moveMealItem}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              setFoodSearchTarget={setFoodSearchTarget}
              waterGoal={plan.targets.fluid}
              updateDayActivity={updateDayActivity}
              updateDayNotes={updateDayNotes}
              updateMeal={updateMeal}
            />
            <PatientInstructions instructions={plan.instructions} updateInstructions={updateInstructions} />
            <PatientFacingPreview activeDays={activeDays} plan={plan} />
          </div>

          <aside className="space-y-4 2xl:sticky 2xl:top-7 2xl:self-start">
            <PlanActions duplicatePlan={duplicatePlan} onHistory={() => document.getElementById("diet-plan-history")?.scrollIntoView({ behavior: "smooth" })} persistPlan={persistPlan} />
            <PhysicalActivityPlanner activity={plan.activity} updateActivity={updateActivity} />
            <NutritionSummary totals={totals} />
            <FoodSafety patient={patient} safetyAlerts={safetyAlerts} />
            <VersionHistory history={plan.versionHistory || []} />
          </aside>
        </div>
      </NutriPageMain>
      {foodSearchTarget ? (
        <FoodSearchDrawer
          customFoods={customFoods}
          favoriteFoodIds={favoriteFoodIds}
          onAddCustomFood={addCustomFood}
          onClose={() => setFoodSearchTarget(null)}
          onSelectFood={addFoodToMeal}
          onToggleFavorite={toggleFavorite}
          recentFoods={recentFoods}
        />
      ) : null}
    </NutriPage>
  );
}

function DietPlanTopHeader({ patient, plan, totals }) {
  const metrics = [
    ["Patient", patient.fullName || "No active patient"],
    ["Diagnosis", patient.diagnosis || "Not recorded"],
    ["BMI", patient.bmi || calculateBmi(patient.height, patient.weight) || "Not recorded"],
    ["Nutrition Goal", plan.clinicalGoal || "Not set"],
    ["Plan Status", plan.status || "Draft"],
    ["Plan Version", `v${plan.version || 1}`],
    ["Review Date", plan.reviewDate || "Not scheduled"],
    ["Calories Target", `${plan.targets.energy || totals.averageCalories || 0} kcal`],
    ["Protein Target", `${plan.targets.protein || totals.averageProtein || 0} g`],
    ["Carbohydrate Target", `${plan.targets.carbohydrate || totals.averageCarbohydrate || 0} g`],
    ["Fat Target", `${plan.targets.fat || totals.averageFat || 0} g`],
    ["Fluid Target", `${plan.targets.fluid || totals.totalFluid || 0} mL`],
  ];

  return (
    <NutriPanel className="mb-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map(([label, value]) => (
          <SummaryTile key={label} label={label} value={value} />
        ))}
      </div>
    </NutriPanel>
  );
}

function PlanOverview({ patient, plan, updatePlanField, updateTarget }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={ClipboardList} kicker="Plan overview" title="Clinical Nutrition Plan" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <NutriInput label="Plan title" value={plan.title} onChange={(event) => updatePlanField("title", event.target.value)} />
        <NutriInput label="Clinical goal" value={plan.clinicalGoal} onChange={(event) => updatePlanField("clinicalGoal", event.target.value)} />
        <NutriSelect label="Diet type" value={plan.dietType} onChange={(event) => updatePlanField("dietType", event.target.value)}>
          {DIET_TYPES.map((type) => <option key={type}>{type}</option>)}
        </NutriSelect>
        <NutriInput label="Nutrition diagnosis reference" value={plan.nutritionDiagnosisReference || latestPes(patient)} onChange={(event) => updatePlanField("nutritionDiagnosisReference", event.target.value)} />
        <NutriInput label="Energy requirements" type="number" value={plan.targets.energy} onChange={(event) => updateTarget("energy", event.target.value)} />
        <NutriInput label="Protein target" type="number" value={plan.targets.protein} onChange={(event) => updateTarget("protein", event.target.value)} />
        <NutriInput label="Carbohydrate target" type="number" value={plan.targets.carbohydrate} onChange={(event) => updateTarget("carbohydrate", event.target.value)} />
        <NutriInput label="Fat target" type="number" value={plan.targets.fat} onChange={(event) => updateTarget("fat", event.target.value)} />
        <NutriInput label="Fiber target" type="number" value={plan.targets.fiber} onChange={(event) => updateTarget("fiber", event.target.value)} />
        <NutriInput label="Fluid goal" type="number" value={plan.targets.fluid} onChange={(event) => updateTarget("fluid", event.target.value)} />
        <NutriInput label="Micronutrient goals" value={plan.micronutrientGoals} onChange={(event) => updatePlanField("micronutrientGoals", event.target.value)} />
        <NutriInput label="Review date" type="date" value={plan.reviewDate} onChange={(event) => updatePlanField("reviewDate", event.target.value)} />
        <NutriTextarea className="md:col-span-2 xl:col-span-3" label="Special considerations" value={plan.specialConsiderations} onChange={(event) => updatePlanField("specialConsiderations", event.target.value)} />
      </div>
    </NutriPanel>
  );
}

function WeeklyMealPlanner(props) {
  const { activeDays, selectedDuration, setSelectedDuration } = props;
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader
        icon={Utensils}
        kicker="Weekly meal planner"
        title="Saturday to Friday Nutrition Schedule"
        action={(
          <div className="flex flex-wrap gap-2">
            {["one", "three", "seven"].map((mode) => (
              <button
                className={`rounded-full border px-3 py-2 text-xs font-extrabold ${selectedDuration === mode ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white" : "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)]"}`}
                key={mode}
                onClick={() => setSelectedDuration(mode)}
                type="button"
              >
                {mode === "one" ? "One-day" : mode === "three" ? "Three-day" : "Seven-day"}
              </button>
            ))}
          </div>
        )}
      />

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1500px] border-separate border-spacing-2">
          <thead>
            <tr>
              {["Day", ...MEAL_TYPES.map((meal) => meal.label), "Physical Activity", "Daily Notes"].map((header) => (
                <th className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3 text-left text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeDays.map((day) => (
              <Fragment key={day.id}>
              <tr key={day.id}>
                <td className="w-32 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3 align-top">
                  <p className="text-sm font-extrabold text-[var(--np-color-text)]">{day.label}</p>
                  <button className="mt-2 text-xs font-extrabold text-[var(--np-color-brand)]" onClick={() => props.copyDay(day.id)} type="button">Copy day</button>
                </td>
                {day.meals.map((meal) => (
                  <td className="w-48 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-2 align-top" key={meal.id}>
                    <MealEditor day={day} meal={meal} {...props} />
                  </td>
                ))}
                <td className="w-64 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-2 align-top">
                  <DailyActivityEditor day={day} updateDayActivity={props.updateDayActivity} />
                </td>
                <td className="w-56 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-2 align-top">
                  <NutriTextarea aria-label={`${day.label} notes`} value={day.notes} onChange={(event) => props.updateDayNotes(day.id, event.target.value)} />
                </td>
              </tr>
              <tr key={`${day.id}-summary`}>
                <td colSpan={MEAL_TYPES.length + 3}>
                  <DayTotalsCard totals={calculateDayTotals(day)} waterGoal={props.waterGoal} />
                </td>
              </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 xl:hidden">
        {activeDays.map((day) => (
          <details className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-3" key={day.id}>
            <summary className="cursor-pointer text-base font-extrabold text-[var(--np-color-text)]">{day.label}</summary>
            <div className="mt-3 space-y-3">
              {day.meals.map((meal) => <MealEditor day={day} key={meal.id} meal={meal} {...props} />)}
              <DayTotalsCard totals={calculateDayTotals(day)} waterGoal={props.waterGoal} />
              <DailyActivityEditor day={day} updateDayActivity={props.updateDayActivity} />
              <NutriTextarea label="Daily notes" value={day.notes} onChange={(event) => props.updateDayNotes(day.id, event.target.value)} />
              <NutriButton className="w-full" onClick={() => props.copyDay(day.id)} variant="secondary">Copy full day</NutriButton>
            </div>
          </details>
        ))}
      </div>
    </NutriPanel>
  );
}

function MealEditor({ day, deleteMealItem, duplicateMealItem, meal, moveMealItem, setFoodSearchTarget, updateMeal }) {
  const mealTotals = calculateMealTotals(meal);

  return (
    <MealPrescriptionTable
      day={day}
      deleteMealItem={deleteMealItem}
      duplicateMealItem={duplicateMealItem}
      meal={meal}
      mealTotals={mealTotals}
      moveMealItem={moveMealItem}
      setFoodSearchTarget={setFoodSearchTarget}
      updateMeal={updateMeal}
    />
  );
}

/*
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-[var(--np-color-brand)]">{meal.label}</p>
        <button className="rounded-full bg-[var(--np-color-brand-soft)] p-2 text-[var(--np-color-brand)]" onClick={() => addMealItem(day.id, meal.id)} type="button">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {meal.items.map((item, index) => (
        <div className="space-y-2 rounded-[14px] bg-[var(--np-color-surface-muted)] p-2" key={item.id}>
          <NutriInput aria-label="Food" placeholder="Food" value={item.food} onChange={(event) => updateMeal(day.id, meal.id, item.id, "food", event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            {["portion", "calories", "protein", "carbohydrate", "fat", "fiber"].map((field) => (
              <NutriInput aria-label={field} key={field} placeholder={field} type={field === "portion" ? "text" : "number"} value={item[field]} onChange={(event) => updateMeal(day.id, meal.id, item.id, field, event.target.value)} />
            ))}
          </div>
          <NutriInput aria-label="Alternatives" placeholder="Alternatives" value={item.alternatives} onChange={(event) => updateMeal(day.id, meal.id, item.id, "alternatives", event.target.value)} />
          <NutriTextarea aria-label="Notes" placeholder="Notes" value={item.notes} onChange={(event) => updateMeal(day.id, meal.id, item.id, "notes", event.target.value)} />
          <div className="flex flex-wrap gap-1">
            <IconButton disabled={index === 0} label="Up" onClick={() => moveMealItem(day.id, meal.id, item.id, -1)}>↑</IconButton>
            <IconButton disabled={index === meal.items.length - 1} label="Down" onClick={() => moveMealItem(day.id, meal.id, item.id, 1)}>↓</IconButton>
            <IconButton label="Duplicate meal" onClick={() => duplicateMealItem(day.id, meal.id, item)}><Copy className="h-3.5 w-3.5" /></IconButton>
            <IconButton label="Delete meal" onClick={() => deleteMealItem(day.id, meal.id, item.id)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}
*/

function MealPrescriptionTable({ day, deleteMealItem, duplicateMealItem, meal, mealTotals, moveMealItem, setFoodSearchTarget, updateMeal }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--np-color-border-soft)] pb-2">
        <div>
          <p className="text-xs font-extrabold text-[var(--np-color-brand)]">{meal.label}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">
            Clinical meal prescription
          </p>
        </div>
        <button
          className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[var(--np-color-brand-soft)] px-3 text-xs font-extrabold text-[var(--np-color-brand)]"
          onClick={() => setFoodSearchTarget({ dayId: day.id, mealId: meal.id })}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add Food
        </button>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-[var(--np-color-border-soft)] bg-white">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="bg-[var(--np-color-surface-muted)]">
              {["Food Name", "Portion", "Unit", "Notes", "Actions"].map((header) => (
                <th className="border-b border-[var(--np-color-border-soft)] px-2 py-2 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meal.items.map((item, index) => (
              <tr className="align-top" key={item.id}>
                <FoodTableCell>
                  <InlineFoodInput aria-label="Food Name" value={item.food} onChange={(event) => updateMeal(day.id, meal.id, item.id, "food", event.target.value)} />
                </FoodTableCell>
                <FoodTableCell>
                  <InlineFoodInput aria-label="Portion" value={item.portion} onChange={(event) => updateMeal(day.id, meal.id, item.id, "portion", event.target.value)} />
                </FoodTableCell>
                <FoodTableCell>
                  <InlineFoodInput aria-label="Unit" value={item.unit} onChange={(event) => updateMeal(day.id, meal.id, item.id, "unit", event.target.value)} />
                </FoodTableCell>
                <FoodTableCell>
                  <InlineFoodInput aria-label="Notes" value={item.notes} onChange={(event) => updateMeal(day.id, meal.id, item.id, "notes", event.target.value)} />
                  <InlineFoodInput aria-label="Alternatives" className="mt-1" placeholder="Alternatives" value={item.alternatives} onChange={(event) => updateMeal(day.id, meal.id, item.id, "alternatives", event.target.value)} />
                </FoodTableCell>
                <FoodTableCell>
                  <div className="flex flex-wrap gap-1">
                    <IconButton disabled={index === 0} label="Move row up" onClick={() => moveMealItem(day.id, meal.id, item.id, -1)}>↑</IconButton>
                    <IconButton disabled={index === meal.items.length - 1} label="Move row down" onClick={() => moveMealItem(day.id, meal.id, item.id, 1)}>↓</IconButton>
                    <IconButton label="Duplicate food row" onClick={() => duplicateMealItem(day.id, meal.id, item)}><Copy className="h-3.5 w-3.5" /></IconButton>
                    <IconButton label="Remove food row" onClick={() => deleteMealItem(day.id, meal.id, item.id)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                  </div>
                </FoodTableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MealTotalsStrip label={`${meal.label} Total`} totals={mealTotals} />
    </div>
  );
}

function FoodTableCell({ children }) {
  return (
    <td className="border-b border-[var(--np-color-border-soft)] px-2 py-2">
      {children}
    </td>
  );
}

function InlineFoodInput({ className = "", ...props }) {
  return (
    <input
      className={`min-h-9 w-full rounded-[10px] border border-[var(--np-color-border-soft)] bg-white px-2 text-xs font-bold text-[var(--np-color-text)] outline-none transition focus:border-[var(--np-color-brand)] focus:ring-2 focus:ring-[rgb(122_31_43_/_0.08)] ${className}`}
      {...props}
    />
  );
}

function MealTotalsStrip({ label, totals }) {
  return (
    <div className="rounded-[14px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-brand-soft)] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-extrabold text-[var(--np-color-brand)]">{label}</p>
        {[
          ["Calories", `${totals.calories} kcal`, "🔥"],
          ["Protein", `${totals.protein} g`, "🥩"],
          ["CHO", `${totals.carbohydrate} g`, "🍞"],
          ["Fat", `${totals.fat} g`, "🥑"],
          ["Fiber", `${totals.fiber} g`, "🥬"],
        ].map(([metric, value, icon]) => (
          <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-white px-2 text-[11px] font-extrabold text-[var(--np-color-text)]" key={metric}>
            <span aria-hidden="true">{icon}</span>
            <span>{metric}: {value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DayTotalsCard({ totals, waterGoal }) {
  return (
    <div className="my-2 rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3 shadow-[var(--np-shadow-sm)]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">
          Daily Nutrition Summary
        </p>
        {[
          ["Calories", `${totals.calories} kcal`, "🔥"],
          ["Protein", `${totals.protein} g`, "🥩"],
          ["CHO", `${totals.carbohydrate} g`, "🍞"],
          ["Fat", `${totals.fat} g`, "🥑"],
          ["Fiber", `${totals.fiber} g`, "🥬"],
          ["Water Goal", `${waterGoal || 0} mL`, "💧"],
        ].map(([label, value, icon]) => (
          <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[var(--np-color-surface-muted)] px-3 text-xs font-extrabold text-[var(--np-color-text)]" key={label}>
            <span aria-hidden="true">{icon}</span>
            <span>{label}: {value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DailyActivityEditor({ day, updateDayActivity }) {
  const activity = day.physicalActivity || createActivity();
  return (
    <div className="space-y-2 rounded-[14px] bg-[var(--np-color-surface-muted)] p-2">
      <p className="text-xs font-extrabold text-[var(--np-color-brand)]">Physical Activity</p>
      <NutriInput aria-label="Activity type" placeholder="Activity type" value={activity.type} onChange={(event) => updateDayActivity(day.id, "type", event.target.value)} />
      <NutriSelect aria-label="Intensity" value={activity.intensity} onChange={(event) => updateDayActivity(day.id, "intensity", event.target.value)}>
        {["Light", "Moderate", "Vigorous"].map((item) => <option key={item}>{item}</option>)}
      </NutriSelect>
      <div className="grid grid-cols-2 gap-2">
        <NutriInput aria-label="Duration" placeholder="Minutes" type="number" value={activity.duration} onChange={(event) => updateDayActivity(day.id, "duration", event.target.value)} />
        <NutriInput aria-label="Steps" placeholder="Steps" type="number" value={activity.stepsTarget} onChange={(event) => updateDayActivity(day.id, "stepsTarget", event.target.value)} />
      </div>
      <NutriTextarea aria-label="Restrictions" placeholder="Restrictions" value={activity.restrictions} onChange={(event) => updateDayActivity(day.id, "restrictions", event.target.value)} />
    </div>
  );
}

function PhysicalActivityPlanner({ activity, updateActivity }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={Activity} kicker="Activity planner" title="Physical Activity Prescription" />
      <div className="space-y-3">
        <NutriInput label="Activity Type" value={activity.type} onChange={(event) => updateActivity("type", event.target.value)} />
        <NutriSelect label="Activity Category" value={activity.category} onChange={(event) => updateActivity("category", event.target.value)}>
          {["Aerobic", "Resistance", "Flexibility", "Balance", "Daily movement"].map((item) => <option key={item}>{item}</option>)}
        </NutriSelect>
        <NutriInput label="Duration" type="number" value={activity.duration} onChange={(event) => updateActivity("duration", event.target.value)} />
        <NutriInput label="Frequency" value={activity.frequency} onChange={(event) => updateActivity("frequency", event.target.value)} />
        <NutriSelect label="Intensity" value={activity.intensity} onChange={(event) => updateActivity("intensity", event.target.value)}>
          {["Light", "Moderate", "Vigorous"].map((item) => <option key={item}>{item}</option>)}
        </NutriSelect>
        <NutriInput label="Weekly Goal" value={activity.weeklyGoal} onChange={(event) => updateActivity("weeklyGoal", event.target.value)} />
        <NutriInput label="Daily Steps" type="number" value={activity.dailySteps} onChange={(event) => updateActivity("dailySteps", event.target.value)} />
        <NutriTextarea label="Exercise Notes" value={activity.notes} onChange={(event) => updateActivity("notes", event.target.value)} />
        <NutriTextarea label="Restrictions" value={activity.restrictions} onChange={(event) => updateActivity("restrictions", event.target.value)} />
      </div>
    </NutriPanel>
  );
}

function NutritionSummary({ totals }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={ClipboardList} kicker="Automatic totals" title="Nutrition Summary" />
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Total Calories", `${totals.totalCalories} kcal`],
          ["Protein", `${totals.totalProtein} g`],
          ["Carbohydrates", `${totals.totalCarbohydrate} g`],
          ["Fat", `${totals.totalFat} g`],
          ["Fiber", `${totals.totalFiber} g`],
          ["Water Goal", `${totals.totalFluid} mL`],
          ["Activity", `${totals.totalActivityMinutes} min`],
          ["Meals", totals.mealCount],
          ["Unique foods", totals.uniqueFoodCount],
          ["Weekly averages", `${totals.averageCalories} kcal/day`],
        ].map(([label, value]) => <SummaryTile key={label} label={label} value={value} />)}
      </div>
    </NutriPanel>
  );
}

function PatientInstructions({ instructions, updateInstructions }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={FileText} kicker="Patient instructions" title="Patient-Facing Guidance" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[
          ["mealTiming", "Meal timing"],
          ["cookingAdvice", "Cooking advice"],
          ["hydration", "Hydration"],
          ["supplementReminders", "Supplement reminders"],
          ["lifestyleAdvice", "Lifestyle advice"],
        ].map(([field, label]) => (
          <NutriTextarea key={field} label={label} value={instructions[field]} onChange={(event) => updateInstructions(field, event.target.value)} />
        ))}
      </div>
    </NutriPanel>
  );
}

function FoodSafety({ patient, safetyAlerts }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={AlertTriangle} kicker="Food safety" title="Review Alerts" />
      <div className="space-y-2">
        <SummaryTile label="Food allergies" value={listNames(patient.allergies) || "No allergy recorded"} />
        <SummaryTile label="Food intolerances" value={patient.intolerances || "No intolerance recorded"} />
        {safetyAlerts.map((alert) => (
          <p className="rounded-[14px] bg-[var(--np-color-warning-bg)] p-3 text-xs font-bold text-[var(--np-color-text-muted)]" key={alert}>{alert}</p>
        ))}
      </div>
    </NutriPanel>
  );
}

function PlanActions({ duplicatePlan, onHistory, persistPlan }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={Save} kicker="Quick buttons" title="Plan Actions" />
      <div className="grid grid-cols-1 gap-2">
        <NutriButton onClick={() => persistPlan("Draft")}><Save className="h-4 w-4" />Save Draft</NutriButton>
        <NutriButton onClick={() => persistPlan("Active")} variant="secondary"><Activity className="h-4 w-4" />Activate Plan</NutriButton>
        <NutriButton variant="secondary"><FileText className="h-4 w-4" />Generate PDF placeholder</NutriButton>
        <NutriButton onClick={duplicatePlan} variant="secondary"><Copy className="h-4 w-4" />Duplicate Plan</NutriButton>
        <NutriButton onClick={onHistory} variant="secondary"><History className="h-4 w-4" />History</NutriButton>
      </div>
    </NutriPanel>
  );
}

function FoodSearchDrawer({ customFoods, favoriteFoodIds, onAddCustomFood, onClose, onSelectFood, onToggleFavorite, recentFoods }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedFood, setSelectedFood] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const results = searchFoods(query, category, customFoods).slice(0, 30);
  const favoriteFoods = [...LOCAL_FOODS, ...customFoods].filter((food) => favoriteFoodIds.includes(food.foodId));

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-[var(--np-color-surface-page)] shadow-[var(--np-shadow-elevated)]">
        <header className="border-b border-[var(--np-color-border-soft)] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="np-page-kicker">Food Database</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[var(--np-color-text)]">Add Food to Meal</h2>
              <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
                Local demo values only. Clinician review required.
              </p>
            </div>
            <NutriButton onClick={onClose} variant="secondary">Close</NutriButton>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto]">
            <NutriInput
              aria-label="Search foods"
              dir="auto"
              placeholder="Search chicken, rice, دجاج, أرز..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <NutriSelect aria-label="Food category" value={category} onChange={(event) => setCategory(event.target.value)}>
              {["All", ...FOOD_CATEGORIES, "Custom foods"].map((item) => <option key={item}>{item}</option>)}
            </NutriSelect>
            <NutriButton onClick={() => setShowCustomForm((current) => !current)} variant="secondary">
              <Plus className="h-4 w-4" />
              Custom Food
            </NutriButton>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {showCustomForm ? (
              <CustomFoodForm
                onCancel={() => setShowCustomForm(false)}
                onSave={(food) => {
                  onAddCustomFood(food);
                  setShowCustomForm(false);
                }}
              />
            ) : null}

            <FoodRail title="Recent foods" foods={recentFoods} onSelectFood={onSelectFood} />
            <FoodRail title="Favorite foods" foods={favoriteFoods} onSelectFood={onSelectFood} />

            <NutriPanel className="p-4">
              <NutriSectionHeader icon={Utensils} kicker="Search results" title={`${results.length} foods found`} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {results.map((food) => (
                  <FoodResultCard
                    favorite={favoriteFoodIds.includes(food.foodId)}
                    food={food}
                    key={food.foodId}
                    onDetail={() => setSelectedFood(food)}
                    onSelect={() => onSelectFood(food)}
                    onToggleFavorite={() => onToggleFavorite(food)}
                  />
                ))}
              </div>
            </NutriPanel>
          </div>

          <FoodDetailPanel food={selectedFood || results[0]} onSelectFood={onSelectFood} />
        </div>
      </aside>
    </div>
  );
}

function FoodRail({ foods, onSelectFood, title }) {
  if (!foods.length) return null;

  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={History} kicker="Quick access" title={title} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {foods.map((food) => (
          <button
            className="min-w-44 rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3 text-left transition hover:border-[var(--np-color-brand)]"
            key={food.foodId}
            onClick={() => onSelectFood(food)}
            type="button"
          >
            <p className="text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{food.nameEn}</p>
            <p className="text-xs font-bold text-[var(--np-color-text-muted)]" dir="auto">{food.nameAr}</p>
          </button>
        ))}
      </div>
    </NutriPanel>
  );
}

function FoodResultCard({ favorite, food, onDetail, onSelect, onToggleFavorite }) {
  return (
    <article className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{food.nameEn}</p>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]" dir="auto">{food.nameAr}</p>
        </div>
        <NutriBadge tone={food.dataStatus === "Verified demo" ? "success" : "warning"}>{food.dataStatus}</NutriBadge>
      </div>
      <p className="mt-2 text-xs font-bold text-[var(--np-color-text-muted)]">
        {food.defaultServingSize} {food.servingUnit} - {food.calories} kcal - {food.category}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <NutriButton className="min-h-9 px-3 text-xs" onClick={onSelect}>Add</NutriButton>
        <NutriButton className="min-h-9 px-3 text-xs" onClick={onDetail} variant="secondary">Details</NutriButton>
        <NutriButton className="min-h-9 px-3 text-xs" onClick={onToggleFavorite} variant="secondary">
          {favorite ? "Remove favorite" : "Favorite"}
        </NutriButton>
      </div>
    </article>
  );
}

function FoodDetailPanel({ food, onSelectFood }) {
  if (!food) {
    return (
      <NutriPanel className="p-4">
        <p className="text-sm font-bold text-[var(--np-color-text-muted)]">Select a food to view details.</p>
      </NutriPanel>
    );
  }

  return (
    <NutriPanel className="p-4 xl:sticky xl:top-4 xl:self-start">
      <NutriSectionHeader icon={ClipboardList} kicker="Food detail" title={food.nameEn} />
      <p className="text-sm font-bold text-[var(--np-color-text-muted)]" dir="auto">{food.nameAr}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ["Serving", `${food.defaultServingSize} ${food.servingUnit}`],
          ["Calories", `${food.calories} kcal`],
          ["Protein", `${food.protein} g`],
          ["CHO", `${food.carbohydrates} g`],
          ["Fat", `${food.fat} g`],
          ["Fiber", `${food.fiber} g`],
          ["Sodium", displayNutrient(food.sodium, "mg")],
          ["Potassium", displayNutrient(food.potassium, "mg")],
          ["Calcium", displayNutrient(food.calcium, "mg")],
          ["Iron", displayNutrient(food.iron, "mg")],
          ["Vitamin D", displayNutrient(food.vitaminD, "mcg")],
          ["Status", food.dataStatus],
        ].map(([label, value]) => <SummaryTile key={label} label={label} value={value} />)}
      </div>
      <div className="mt-4 rounded-[14px] bg-[var(--np-color-warning-bg)] p-3">
        <p className="text-xs font-extrabold text-[var(--np-color-text)]">Demo data notice</p>
        <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
          {food.notes} Source: {food.sourceLabel}. Last reviewed: placeholder.
        </p>
      </div>
      <NutriButton className="mt-4 w-full" onClick={() => onSelectFood(food)}>Add selected food</NutriButton>
    </NutriPanel>
  );
}

function CustomFoodForm({ onCancel, onSave }) {
  const [food, setFood] = useState({
    calories: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    nameAr: "",
    nameEn: "",
    notes: "",
    protein: "",
    defaultServingSize: "",
    servingUnit: "serving",
  });

  function updateField(field, value) {
    setFood((current) => ({ ...current, [field]: value }));
  }

  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={Plus} kicker="Custom food" title="User-entered Food" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <NutriInput label="English name" value={food.nameEn} onChange={(event) => updateField("nameEn", event.target.value)} />
        <NutriInput label="Arabic name" value={food.nameAr} onChange={(event) => updateField("nameAr", event.target.value)} />
        <NutriInput label="Serving size" type="number" value={food.defaultServingSize} onChange={(event) => updateField("defaultServingSize", event.target.value)} />
        <NutriSelect label="Unit" value={food.servingUnit} onChange={(event) => updateField("servingUnit", event.target.value)}>
          {SERVING_UNITS.map((unit) => <option key={unit}>{unit}</option>)}
        </NutriSelect>
        {["calories", "protein", "carbohydrates", "fat", "fiber"].map((field) => (
          <NutriInput key={field} label={field} type="number" value={food[field]} onChange={(event) => updateField(field, event.target.value)} />
        ))}
        <NutriTextarea className="md:col-span-3" label="Notes" value={food.notes} onChange={(event) => updateField("notes", event.target.value)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <NutriButton onClick={() => onSave(food)}>Save custom food</NutriButton>
        <NutriButton onClick={onCancel} variant="secondary">Cancel</NutriButton>
      </div>
    </NutriPanel>
  );
}

function VersionHistory({ history }) {
  return (
    <NutriPanel className="p-4" id="diet-plan-history">
      <NutriSectionHeader icon={CalendarDays} kicker="Version history" title="Drafts, Active and Archived Plans" />
      <div className="space-y-2">
        {history.length ? history.map((item, index) => (
          <div className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3" key={`${item.date}-${index}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">{item.status}</p>
              <NutriBadge tone={item.status === "Active" ? "success" : item.status === "Archived" ? "secondary" : "brand"}>{item.version || "v1"}</NutriBadge>
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{item.date} - {item.author || "Clinical Dietitian"}</p>
            <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{item.changes || "Local plan update"}</p>
          </div>
        )) : <p className="text-sm font-bold text-[var(--np-color-text-muted)]">No version history recorded.</p>}
      </div>
    </NutriPanel>
  );
}

function PatientFacingPreview({ activeDays, plan }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={Utensils} kicker="Patient version" title="Simplified Weekly View" />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {activeDays.map((day) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3" key={day.id}>
            <p className="text-sm font-extrabold text-[var(--np-color-brand)]">{day.label}</p>
            <ul className="mt-2 space-y-1 text-xs font-bold text-[var(--np-color-text-muted)]">
              {day.meals.map((meal) => {
                const foods = meal.items.map((item) => [item.food, item.portion].filter(Boolean).join(" - ")).filter(Boolean);
                return <li key={meal.id}><strong>{meal.label}:</strong> {foods.join(" / ") || "No meal item recorded"}</li>;
              })}
              <li><strong>Activity:</strong> {day.physicalActivity?.type || plan.activity.type || "No activity recorded"}</li>
              <li><strong>Notes:</strong> {day.notes || "No daily notes recorded"}</li>
            </ul>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{value}</p>
    </div>
  );
}

function IconButton({ children, disabled, label, onClick }) {
  return (
    <button
      aria-label={label}
      className="min-h-9 rounded-full border border-[var(--np-color-border-soft)] bg-white px-2 text-xs font-extrabold text-[var(--np-color-text-muted)] disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function getActivePlan(patient) {
  const storedDraft = loadStoredDraft(patient.id);
  if (storedDraft) return normalizePlan(storedDraft);
  const existing = patient.dietPlans?.find((plan) => plan.status === "Active") || patient.dietPlans?.[0];
  return normalizePlan(existing || createDefaultPlan(patient));
}

function normalizePlan(plan) {
  const fallback = createDefaultPlan({});
  return {
    ...fallback,
    ...plan,
    activity: { ...fallback.activity, ...(plan.activity || {}) },
    days: WEEK_DAYS.map((day, index) => normalizeDay(plan.days?.[index], day)),
    instructions: { ...fallback.instructions, ...(plan.instructions || {}) },
    targets: { ...fallback.targets, ...(plan.targets || {}) },
    versionHistory: Array.isArray(plan.versionHistory) ? plan.versionHistory : fallback.versionHistory,
  };
}

function normalizeDay(day, fallbackDay) {
  return {
    id: fallbackDay.id,
    label: fallbackDay.label,
    meals: MEAL_TYPES.map((meal, index) => normalizeMeal(day?.meals?.[index], meal, fallbackDay.id)),
    notes: day?.notes || "",
    physicalActivity: { ...createActivity(), ...(day?.physicalActivity || {}) },
  };
}

function normalizeMeal(meal, fallbackMeal, dayId) {
  return {
    ...fallbackMeal,
    ...(meal || {}),
    items: Array.isArray(meal?.items) && meal.items.length
      ? meal.items.map((item, index) => ({ ...createMealItem(`${dayId}-${fallbackMeal.id}-${index}`), ...item }))
      : [createMealItem(`${dayId}-${fallbackMeal.id}-0`)],
  };
}

function createDefaultPlan(patient) {
  return {
    activity: createActivity(),
    clinicalGoal: "",
    days: WEEK_DAYS.map((day) => normalizeDay(null, day)),
    dietType: "General balanced diet",
    duration: "seven",
    id: "diet-plan-default",
    instructions: {
      cookingAdvice: "",
      hydration: "",
      lifestyleAdvice: "",
      mealTiming: "",
      supplementReminders: "",
    },
    micronutrientGoals: "",
    nutritionDiagnosisReference: latestPes(patient),
    reviewDate: "",
    specialConsiderations: "",
    status: "Draft",
    targets: {
      carbohydrate: "",
      energy: "",
      fat: "",
      fiber: "",
      fluid: "",
      protein: "",
    },
    title: "Nutrition plan draft",
    version: 1,
    versionHistory: [{ author: "Clinical Dietitian", changes: "Initial local draft", date: "Current session", status: "Draft", version: "v1" }],
  };
}

function createActivity() {
  return {
    category: "Daily movement",
    dailySteps: "",
    duration: "",
    frequency: "",
    intensity: "Light",
    notes: "",
    restrictions: "",
    type: "",
    weeklyGoal: "",
  };
}

function createMealItem(id) {
  return {
    alternatives: "",
    calories: "",
    carbohydrate: "",
    fat: "",
    fiber: "",
    food: "",
    id: `meal-item-${id}`,
    notes: "",
    portion: "",
    protein: "",
    unit: "",
  };
}

function foodToMealItem(food, id) {
  const scaled = scaleFoodNutrition(food, food.defaultServingSize, food.servingUnit);
  return {
    alternatives: "",
    calories: scaled.calories,
    carbohydrate: scaled.carbohydrate,
    conversionNeedsReview: scaled.conversionNeedsReview,
    dataStatus: food.dataStatus,
    fat: scaled.fat,
    fiber: scaled.fiber,
    food: food.nameEn,
    foodId: food.foodId,
    foodNameAr: food.nameAr,
    id: `meal-item-${id}`,
    notes: food.dataStatus === "User-entered" ? "User-entered custom food." : "Demo food value. Clinician review required.",
    portion: food.defaultServingSize,
    protein: scaled.protein,
    sourceLabel: food.sourceLabel,
    unit: food.servingUnit,
  };
}

function updateMealItemValue(item, field, value) {
  const nextItem = { ...item, [field]: value };
  if (!item.foodId || !["portion", "unit"].includes(field)) return nextItem;

  const food = findFoodRecord(item.foodId);
  if (!food) return nextItem;

  const scaled = scaleFoodNutrition(food, nextItem.portion, nextItem.unit);
  return {
    ...nextItem,
    calories: scaled.calories,
    carbohydrate: scaled.carbohydrate,
    conversionNeedsReview: scaled.conversionNeedsReview,
    fat: scaled.fat,
    fiber: scaled.fiber,
    protein: scaled.protein,
    notes: scaled.conversionNeedsReview
      ? "Conversion unavailable. Manual nutrition review required."
      : nextItem.notes,
  };
}

function calculateMealTotals(meal) {
  return meal.items.reduce((totals, item) => ({
    calories: totals.calories + (Number(item.calories) || 0),
    carbohydrate: totals.carbohydrate + (Number(item.carbohydrate) || 0),
    fat: totals.fat + (Number(item.fat) || 0),
    fiber: totals.fiber + (Number(item.fiber) || 0),
    protein: totals.protein + (Number(item.protein) || 0),
  }), { calories: 0, carbohydrate: 0, fat: 0, fiber: 0, protein: 0 });
}

function calculateDayTotals(day) {
  return day.meals.reduce((totals, meal) => {
    const mealTotals = calculateMealTotals(meal);
    return {
      calories: totals.calories + mealTotals.calories,
      carbohydrate: totals.carbohydrate + mealTotals.carbohydrate,
      fat: totals.fat + mealTotals.fat,
      fiber: totals.fiber + mealTotals.fiber,
      protein: totals.protein + mealTotals.protein,
    };
  }, { calories: 0, carbohydrate: 0, fat: 0, fiber: 0, protein: 0 });
}

function calculatePlanTotals(plan, duration) {
  const days = plan.days.slice(0, durationCount(duration));
  const uniqueFoods = new Set();
  const totals = days.reduce((sum, day) => {
    const dayTotals = calculateDayTotals(day);
    day.meals.forEach((meal) => {
      if (meal.items.some((item) => item.food || item.foodId)) sum.mealCount += 1;
      meal.items.forEach((item) => {
        if (item.foodId || item.food) uniqueFoods.add(item.foodId || item.food);
      });
    });
    sum.calories += dayTotals.calories;
    sum.protein += dayTotals.protein;
    sum.carbohydrate += dayTotals.carbohydrate;
    sum.fat += dayTotals.fat;
    sum.fiber += dayTotals.fiber;
    sum.fluid += Number(plan.targets.fluid) || 0;
    sum.totalActivityMinutes += Number(day.physicalActivity?.duration) || 0;
    return sum;
  }, { calories: 0, carbohydrate: 0, fat: 0, fiber: 0, fluid: 0, mealCount: 0, protein: 0, totalActivityMinutes: 0 });
  const dayCount = days.length || 1;
  return {
    averageCalories: Math.round(totals.calories / dayCount),
    averageCarbohydrate: Math.round(totals.carbohydrate / dayCount),
    averageFat: Math.round(totals.fat / dayCount),
    averageProtein: Math.round(totals.protein / dayCount),
    dayCount,
    mealCount: totals.mealCount,
    totalCalories: Math.round(totals.calories),
    totalCarbohydrate: Math.round(totals.carbohydrate),
    totalFat: Math.round(totals.fat),
    totalFiber: Math.round(totals.fiber),
    totalFluid: Math.round(totals.fluid),
    totalProtein: Math.round(totals.protein),
    uniqueFoodCount: uniqueFoods.size,
    totalActivityMinutes: totals.totalActivityMinutes,
  };
}

function buildSafetyAlerts(patient, plan) {
  const alerts = ["Activity plan requires clinician review."];
  const foodText = JSON.stringify(plan.days).toLowerCase();
  const allergyNames = listNames(patient.allergies).split(", ").filter(Boolean);
  allergyNames.forEach((allergy) => {
    if (foodText.includes(allergy.toLowerCase())) alerts.push(`Possible allergy conflict: ${allergy}`);
  });
  if (!patient.height || !patient.weight) alerts.push("Missing height or weight may limit target review.");
  if (!patient.diagnosis) alerts.push("Diagnosis is not recorded.");
  if (!patient.labValues?.some?.((lab) => lab.value)) alerts.push("No laboratory result recorded for plan safety review.");
  if (plan.activity.restrictions) alerts.push("Activity restrictions entered; review daily movement plan.");
  if (alerts.length === 1) alerts.push("No safety conflict detected from available local data.");
  return alerts;
}

function reorderItems(items, itemId, direction) {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
  const nextItems = [...items];
  const [item] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, item);
  return nextItems;
}

function cloneMeals(meals) {
  return meals.map((meal, mealIndex) => ({
    ...meal,
    items: meal.items.map((item, itemIndex) => ({ ...item, id: `${meal.id}-copy-${mealIndex}-${itemIndex}` })),
  }));
}

function durationCount(duration) {
  if (duration === "one") return 1;
  if (duration === "three") return 3;
  return 7;
}

function dietPlanDraftKey(patientId) {
  return `nutripilot.dietPlanBuilder.${patientId || "default"}`;
}

function loadStoredDraft(patientId) {
  try {
    const stored = localStorage.getItem(dietPlanDraftKey(patientId));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function loadLocalList(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeFoodRecord(food) {
  return {
    calcium: food.calcium || "",
    calories: Number(food.calories) || 0,
    carbohydrates: Number(food.carbohydrates) || 0,
    category: food.category || "Custom foods",
    dataStatus: food.dataStatus || "Needs review",
    defaultServingSize: Number(food.defaultServingSize) || 1,
    fat: Number(food.fat) || 0,
    fiber: Number(food.fiber) || 0,
    foodId: food.foodId,
    iron: food.iron || "",
    nameAr: food.nameAr || food.nameEn || "طعام مخصص",
    nameEn: food.nameEn || food.nameAr || "Custom food",
    notes: food.notes || "Demo/custom value. Clinician review required.",
    potassium: food.potassium || "",
    protein: Number(food.protein) || 0,
    sodium: food.sodium || "",
    sourceLabel: food.sourceLabel || "Local custom food",
    servingUnit: food.servingUnit || "serving",
    vitaminD: food.vitaminD || "",
  };
}

function findFoodRecord(foodId) {
  try {
    const customFoods = loadLocalList("nutripilot.customFoods");
    return [...LOCAL_FOODS, ...customFoods].find((food) => food.foodId === foodId);
  } catch {
    return LOCAL_FOODS.find((food) => food.foodId === foodId);
  }
}

function displayNutrient(value, unit) {
  return value === "" || value === undefined || value === null ? "Not available" : `${value} ${unit}`;
}

function listNames(items) {
  if (!Array.isArray(items)) return "";
  return items.map((item) => item.name || item).filter(Boolean).join(", ");
}

function latestPes(patient) {
  return patient?.diagnoses?.find?.((diagnosis) => diagnosis.problem)?.problem || patient?.diagnosis || "";
}

function calculateBmi(height, weight) {
  const numericHeight = Number(height);
  const numericWeight = Number(weight);
  if (!numericHeight || !numericWeight) return "";
  return (numericWeight / ((numericHeight / 100) ** 2)).toFixed(1);
}

const DIET_TYPES = [
  "General balanced diet",
  "Weight management",
  "Diabetes",
  "Renal",
  "IBS",
  "Iron deficiency",
  "High-protein",
  "Low-sodium",
];

const WEEK_DAYS = [
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
];

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "snack-1", label: "Snack" },
  { id: "lunch", label: "Lunch" },
  { id: "snack-2", label: "Snack" },
  { id: "dinner", label: "Dinner" },
  { id: "evening-snack", label: "Evening Snack" },
];

const EMPTY_PATIENT = {};
