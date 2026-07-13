import { useEffect, useMemo, useState } from "react";

import ar from "./ar.json";
import en from "./en.json";
import { I18nContext } from "./I18nContextValue";
import { uiPhraseTranslations } from "./uiPhrases";

const LANGUAGE_STORAGE_KEY = "nutripilot.language.v1";
const resources = { ar, en };
const fallbackLanguage = "en";
const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();
const reverseUiPhraseTranslations = Object.fromEntries(
  Object.entries(uiPhraseTranslations).map(([english, arabic]) => [arabic, english]),
);
const sortedUiPhrases = Object.entries(uiPhraseTranslations).sort((first, second) => second[0].length - first[0].length);
const sortedReverseUiPhrases = Object.entries(reverseUiPhraseTranslations).sort((first, second) => second[0].length - first[0].length);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(loadInitialLanguage);
  const direction = language === "ar" ? "rtl" : "ltr";
  const locale = language === "ar" ? "ar-SA" : "en-US";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [direction, language]);

  useEffect(() => {
    applyVisibleTextTranslations(language);
    const observer = new MutationObserver(() => applyVisibleTextTranslations(language));
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      direction,
      isRtl: direction === "rtl",
      language,
      locale,
      setLanguage: (nextLanguage) => {
        setLanguageState(resources[nextLanguage] ? nextLanguage : fallbackLanguage);
      },
      toggleLanguage: () => {
        setLanguageState((currentLanguage) => (currentLanguage === "ar" ? "en" : "ar"));
      },
      t: (key, variables = {}) => translate(language, key, variables),
      formatDate: (value, options = { day: "numeric", month: "long", year: "numeric" }) =>
        new Intl.DateTimeFormat(locale, options).format(value instanceof Date ? value : new Date(value)),
    }),
    [direction, language, locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function translate(language, key, variables) {
  const template = resources[language]?.[key] || resources[fallbackLanguage]?.[key] || variables.defaultValue || readableFallback(key);

  return Object.entries(variables).reduce(
    (text, [variableKey, value]) => (variableKey === "defaultValue" ? text : text.replaceAll(`{{${variableKey}}}`, String(value))),
    template,
  );
}

function readableFallback(key) {
  return key
    .split(".")
    .pop()
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}


function loadInitialLanguage() {
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (resources[storedLanguage]) return storedLanguage;
  } catch {
    return fallbackLanguage;
  }

  return fallbackLanguage;
}

function applyVisibleTextTranslations(language) {
  const root = document.getElementById("root");
  if (!root) return;

  translateTextNodes(root, language);
  translateElementAttributes(root, language);
}

function translateTextNodes(root, language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!node.nodeValue?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    if (!originalTextNodes.has(node)) {
      originalTextNodes.set(node, recoverOriginalPhrase(node.nodeValue));
    }

    const original = originalTextNodes.get(node);
    const nextValue = language === "ar" ? translatePhrase(original) : original;
    if (node.nodeValue !== nextValue) {
      node.nodeValue = nextValue;
    }
    node = walker.nextNode();
  }
}

function translateElementAttributes(root, language) {
  const elements = root.querySelectorAll("[placeholder], [aria-label], [title]");

  elements.forEach((element) => {
    if (!originalAttributes.has(element)) {
      originalAttributes.set(element, {
        ariaLabel: recoverOriginalPhrase(element.getAttribute("aria-label")),
        placeholder: recoverOriginalPhrase(element.getAttribute("placeholder")),
        title: recoverOriginalPhrase(element.getAttribute("title")),
      });
    }

    const original = originalAttributes.get(element);
    setTranslatedAttribute(element, "aria-label", original.ariaLabel, language);
    setTranslatedAttribute(element, "placeholder", original.placeholder, language);
    setTranslatedAttribute(element, "title", original.title, language);
  });
}

function setTranslatedAttribute(element, attribute, originalValue, language) {
  if (!originalValue) return;
  const nextValue = language === "ar" ? translatePhrase(originalValue) : originalValue;
  if (element.getAttribute(attribute) !== nextValue) {
    element.setAttribute(attribute, nextValue);
  }
}

function translatePhrase(value) {
  let text = String(value);
  const trimmed = text.trim();
  const translated = uiPhraseTranslations[trimmed];

  if (translated) {
    return text.replace(trimmed, translated);
  }

  sortedUiPhrases.forEach(([english, arabic]) => {
    if (text.includes(english)) {
      text = text.replaceAll(english, arabic);
    }
  });

  return text;
}

function recoverOriginalPhrase(value) {
  if (!value) return value;

  let text = String(value);
  const trimmed = text.trim();
  const original = reverseUiPhraseTranslations[trimmed];

  if (original) {
    return text.replace(trimmed, original);
  }

  sortedReverseUiPhrases.forEach(([arabic, english]) => {
    if (text.includes(arabic)) {
      text = text.replaceAll(arabic, english);
    }
  });

  return text;
}
