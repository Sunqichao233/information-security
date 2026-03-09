(function () {
  const supportedLangs = ["zh", "ja"];
  const defaultLang = "zh";
  const storageKey = "site_lang";
  let currentLang = defaultLang;
  const questionState = {
    query: "",
    tag: "all",
    page: 1,
    pageSize: 5
  };

  function getPreferredLanguage() {
    const stored = window.localStorage.getItem(storageKey);
    return supportedLangs.includes(stored) ? stored : defaultLang;
  }

  function t(key) {
    const dict = window.I18N && window.I18N[currentLang];
    if (dict && dict[key]) return dict[key];
    const fallback = window.I18N && window.I18N[defaultLang];
    return (fallback && fallback[key]) || key;
  }

  function setLanguage(lang) {
    const dict = window.I18N && window.I18N[lang];
    if (!dict) return;
    currentLang = lang;

    document.documentElement.lang = lang === "ja" ? "ja" : "zh-CN";
    window.localStorage.setItem(storageKey, lang);

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (dict[key]) node.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      const key = node.getAttribute("data-i18n-placeholder");
      if (dict[key]) node.setAttribute("placeholder", dict[key]);
    });

    document.querySelectorAll("[data-lang]").forEach((btn) => {
      const active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", active);
    });

    renderQuestionsPage();
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

  function getFilteredQuestions() {
    const all = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
    const query = questionState.query.trim().toLowerCase();
    return all.filter((q) => {
      const matchTag = questionState.tag === "all" || q.tags.includes(questionState.tag);
      if (!matchTag) return false;
      if (!query) return true;
      const title = (q.title[currentLang] || "").toLowerCase();
      const prompt = (q.prompt[currentLang] || "").toLowerCase();
      return title.includes(query) || prompt.includes(query);
    });
  }

  function renderQuestionCard(question) {
    const card = document.createElement("article");
    card.className = "question-card";

    const meta = document.createElement("p");
    meta.className = "question-meta";
    meta.textContent = question.exam;

    const title = document.createElement("h2");
    title.textContent = question.title[currentLang];

    const prompt = document.createElement("p");
    prompt.textContent = question.prompt[currentLang];

    let figure = null;
    if (question.figure && question.figure.src) {
      figure = document.createElement("figure");
      figure.className = "question-figure";
      const img = document.createElement("img");
      img.src = question.figure.src;
      img.alt = (question.figure.alt && question.figure.alt[currentLang]) || question.title[currentLang];
      img.loading = "lazy";
      figure.appendChild(img);
      if (question.figure.caption && question.figure.caption[currentLang]) {
        const cap = document.createElement("figcaption");
        cap.textContent = question.figure.caption[currentLang];
        figure.appendChild(cap);
      }
    }

    const list = document.createElement("ul");
    list.className = "option-list";
    question.options.forEach((opt) => {
      const li = document.createElement("li");
      const marker = document.createElement("span");
      marker.className = "option-marker";
      marker.textContent = opt.key;
      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = opt.text[currentLang];
      li.appendChild(marker);
      li.appendChild(text);
      list.appendChild(li);
    });

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = t("showAnswer");
    const answer = document.createElement("p");
    answer.textContent =
      t("answerLabel") +
      " " +
      question.answerKey +
      "。 " +
      question.explanation[currentLang];
    details.appendChild(summary);
    details.appendChild(answer);

    card.appendChild(meta);
    card.appendChild(title);
    card.appendChild(prompt);
    if (figure) card.appendChild(figure);
    card.appendChild(list);
    card.appendChild(details);
    return card;
  }

  function renderQuestionsPage() {
    if (document.body.getAttribute("data-page") !== "questions") return;
    const listRoot = document.getElementById("question-list");
    if (!listRoot) return;

    const filtered = getFilteredQuestions();
    const totalPages = Math.max(1, Math.ceil(filtered.length / questionState.pageSize));
    if (questionState.page > totalPages) questionState.page = totalPages;

    const start = (questionState.page - 1) * questionState.pageSize;
    const pageItems = filtered.slice(start, start + questionState.pageSize);

    listRoot.innerHTML = "";
    if (pageItems.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = t("noResults");
      listRoot.appendChild(empty);
    } else {
      pageItems.forEach((q) => listRoot.appendChild(renderQuestionCard(q)));
    }

    const countNode = document.getElementById("question-count");
    if (countNode) {
      countNode.textContent = t("totalCount").replace("{count}", String(filtered.length));
    }
    const pageNode = document.getElementById("question-page");
    if (pageNode) {
      pageNode.textContent = t("pageText")
        .replace("{page}", String(questionState.page))
        .replace("{total}", String(totalPages));
    }
    const prevBtn = document.getElementById("page-prev");
    const nextBtn = document.getElementById("page-next");
    if (prevBtn) prevBtn.disabled = questionState.page <= 1;
    if (nextBtn) nextBtn.disabled = questionState.page >= totalPages;
  }

  function setupQuestionControls() {
    if (document.body.getAttribute("data-page") !== "questions") return;

    const searchInput = document.getElementById("question-search");
    const tagSelect = document.getElementById("question-tag");
    const prevBtn = document.getElementById("page-prev");
    const nextBtn = document.getElementById("page-next");

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        questionState.query = searchInput.value;
        questionState.page = 1;
        renderQuestionsPage();
      });
    }
    if (tagSelect) {
      tagSelect.addEventListener("change", () => {
        questionState.tag = tagSelect.value;
        questionState.page = 1;
        renderQuestionsPage();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        questionState.page -= 1;
        renderQuestionsPage();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        questionState.page += 1;
        renderQuestionsPage();
      });
    }
  }

  setupLanguageButtons();
  setupActiveNav();
  setupQuestionControls();
  setLanguage(getPreferredLanguage());
})();
