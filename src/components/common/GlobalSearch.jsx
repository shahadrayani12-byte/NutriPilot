import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Search, X } from "lucide-react";

import {
  buildGlobalSearchResults,
  globalSearchAliases,
  groupGlobalSearchResults,
  normalizeSearchText,
} from "../../utils/globalSearch";
import { useTranslation } from "../../i18n";

const RECENT_SEARCHES_KEY = "nutripilot.globalSearch.recent.v1";
const groupOrder = ["Patients", "Clinical", "Laboratory", "Reports", "Research", "Daily Work", "NutriMap"];

export function GlobalSearch({
  activePatient,
  className = "",
  onResultSelect,
  patients,
  placeholder = "Search patients, labs, reports...",
  reports,
  schedule,
  tasks,
}) {
  const { isRtl, t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const results = useMemo(
    () => buildGlobalSearchResults(query, { activePatient, patients, reports, schedule, tasks }),
    [activePatient, patients, query, reports, schedule, tasks],
  );
  const groupedResults = groupGlobalSearchResults(results);

  useEffect(() => {
    function handleShortcut(event) {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (!isSearchShortcut) return;

      event.preventDefault();
      setIsOpen(true);
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!panelRef.current?.contains(event.target) && !inputRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function closeSearch() {
    setIsOpen(false);
    setActiveIndex(0);
  }

  function saveRecentSearch(value) {
    const normalizedValue = value.trim();
    if (!normalizedValue) return;

    const nextRecentSearches = [
      normalizedValue,
      ...recentSearches.filter((item) => normalizeSearchText(item) !== normalizeSearchText(normalizedValue)),
    ].slice(0, 5);

    setRecentSearches(nextRecentSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecentSearches));
  }

  function handleSelect(result) {
    saveRecentSearch(query || result.title);
    onResultSelect?.(result);
    setQuery("");
    closeSearch();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      closeSearch();
      inputRef.current?.blur();
      return;
    }

    if (!isOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  }

  return (
    <div className={`relative w-full max-w-[520px] ${className}`}>
      <Search className={`absolute top-3.5 h-5 w-5 text-[var(--np-color-text-soft)] ${isRtl ? "right-4" : "left-4"}`} />
      <input
        className={`np-search-field px-12 ${isRtl ? "pl-20" : "pr-20"}`}
        dir="auto"
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        value={query}
      />
      {query ? (
        <button
          aria-label={t("search.clear")}
          className={`absolute top-3 flex h-6 w-6 items-center justify-center rounded-full text-[var(--np-color-text-muted)] transition hover:bg-[var(--np-color-surface-muted)] ${isRtl ? "left-16" : "right-16"}`}
          onClick={() => setQuery("")}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      <span className={`absolute top-3 rounded-md border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-2 py-1 text-[10px] font-extrabold text-[var(--np-color-text-muted)] ${isRtl ? "left-3" : "right-3"}`}>
        Ctrl K
      </span>

      {isOpen ? (
        <div
          className={`fixed inset-x-3 top-20 z-50 max-h-[78vh] overflow-hidden rounded-[24px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-xl)] sm:absolute sm:inset-x-auto sm:top-14 sm:w-[min(720px,calc(100vw-2rem))] ${isRtl ? "sm:right-0" : "sm:left-0"}`}
          ref={panelRef}
        >
          <div className="border-b border-[var(--np-color-border-soft)] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
              {t("search.panelTitle")}
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
              {t("search.panelSubtitle")}
            </p>
          </div>

          <div className="max-h-[58vh] overflow-y-auto p-3">
            {query.trim() ? (
              results.length ? (
                groupOrder.map((group) =>
                  groupedResults[group]?.length ? (
                    <SearchGroup
                      activeIndex={activeIndex}
                      group={t(`search.groups.${group}`)}
                      key={group}
                      onSelect={handleSelect}
                      results={groupedResults[group]}
                      allResults={results}
                    />
                  ) : null,
                )
              ) : (
                <NoResults query={query} />
              )
            ) : (
              <RecentSearches recentSearches={recentSearches} setQuery={setQuery} />
            )}
          </div>

          <div className="border-t border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3 text-xs font-bold text-[var(--np-color-text-muted)]">
            {t("search.aliasesInclude")}: <bdi dir="auto">{globalSearchAliases.slice(0, 8).map((group) => group.slice(0, 2).join(" / ")).join(", ")}</bdi>.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({ activeIndex, allResults, group, onSelect, results }) {
  const { t } = useTranslation();
  return (
    <section className="mb-4 last:mb-0">
      <p className="mb-2 px-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
        {group}
      </p>
      <div className="space-y-2">
        {results.map((result) => {
          const globalIndex = allResults.findIndex((item) => item.id === result.id);
          const isActive = activeIndex === globalIndex;

          return (
            <button
              className={`w-full rounded-[18px] border p-3 text-left transition ${
                isActive
                  ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]"
                  : "border-[var(--np-color-border-soft)] bg-white hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-surface-muted)]"
              }`}
              key={result.id}
              onClick={() => onSelect(result)}
              type="button"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{result.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]" dir="auto">
                    {result.description}
                  </p>
                  {result.patientName ? (
                    <p className="mt-2 text-xs font-extrabold text-[var(--np-color-brand)]" dir="auto">
                      {t("search.patientLabel")}: <bdi dir="auto">{result.patientName}</bdi>
                    </p>
                  ) : null}
                </div>
                <span className="np-badge np-badge-secondary shrink-0">{t(`search.categories.${result.category}`)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RecentSearches({ recentSearches, setQuery }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <p className="px-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
        {t("search.recent")}
      </p>
      {recentSearches.length ? (
        recentSearches.map((item) => (
          <button
            className="flex min-h-11 w-full items-center gap-3 rounded-[16px] border border-[var(--np-color-border-soft)] bg-white px-3 text-left text-sm font-bold text-[var(--np-color-text)] transition hover:border-[var(--np-color-brand)]"
            key={item}
            onClick={() => setQuery(item)}
            type="button"
          >
            <Clock3 className="h-4 w-4 text-[var(--np-color-brand)]" />
            <span dir="auto">{item}</span>
          </button>
        ))
      ) : (
        <p className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
          {t("search.emptyRecent")}
        </p>
      )}
    </div>
  );
}

function NoResults({ query }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[20px] bg-[var(--np-color-surface-muted)] p-5 text-center">
      <p className="text-base font-extrabold text-[var(--np-color-text)]">{t("search.noResults")}</p>
      <p className="mt-2 text-sm font-bold text-[var(--np-color-text-muted)]">
        {t("search.noResultsDescription", { query: query.trim() })}
      </p>
    </div>
  );
}

function loadRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
  } catch {
    return [];
  }
}

