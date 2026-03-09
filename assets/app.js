(function () {
  const supportedLangs = ["zh", "ja"];
  const defaultLang = "zh";
  const storageKey = "site_lang";

  function getPreferredLanguage() {
    const stored = window.localStorage.getItem(storageKey);
    return supportedLangs.includes(stored) ? stored : defaultLang;
  }

  function setLanguage(lang) {
    const dict = window.I18N && window.I18N[lang];
    if (!dict) return;

    document.documentElement.lang = lang === "ja" ? "ja" : "zh-CN";
    window.localStorage.setItem(storageKey, lang);

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (dict[key]) node.textContent = dict[key];
    });

    document.querySelectorAll("[data-lang]").forEach((btn) => {
      const active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", active);
    });
  }

  function setupLanguageButtons() {
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLanguage(btn.getAttribute("data-lang"));
      });
    });
  }

  function setupActiveNav() {
    const page = document.body.getAttribute("data-page");
    if (!page) return;
    const current = document.querySelector(`[data-nav="${page}"]`);
    if (current) current.classList.add("active");
  }

  setupLanguageButtons();
  setupActiveNav();
  setLanguage(getPreferredLanguage());
})();
