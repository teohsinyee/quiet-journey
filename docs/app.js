const content = document.getElementById("content");
const listReflections = document.getElementById("list-reflections");
const search = document.getElementById("search");
const themeToggle = document.getElementById("themeToggle");
const progress = document.getElementById("progress");
const palette = document.getElementById("palette");
const homeLink = document.getElementById("homeLink");

function setTheme(mode) {
  if (mode === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  localStorage.setItem("theme", mode);
}
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
  setTheme(next);
});
setTheme(localStorage.getItem("theme") || "light");

function setPalette(name) {
  document.documentElement.setAttribute("data-theme", name);
  localStorage.setItem("palette", name);
  if (palette) palette.value = name;
}
setPalette(localStorage.getItem("palette") || "royal");
if (palette) { palette.addEventListener("change", (e) => setPalette(e.target.value)); }

async function loadManifest() {
  const res = await fetch("./data/manifest.json?v=" + Date.now());
  return await res.json();
}

function card(entry) {
  const div = document.createElement("div");
  div.className = "card";
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = entry.title;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${entry.date} • ${entry.type}`;
  const excerpt = document.createElement("div");
  excerpt.className = "excerpt";
  excerpt.textContent = entry.excerpt || "";
  const link = document.createElement("a");
  link.className = "read";
  link.href = entry.path;
  link.setAttribute("data-route", "");
  link.textContent = "Read";
  div.appendChild(title);
  div.appendChild(meta);
  if (entry.excerpt) div.appendChild(excerpt);
  div.appendChild(link);
  return div;
}
function renderList(data, q = "") {
  listReflections.innerHTML = "";
  const refs = data.entries;
  const filter = (e) => e.title.toLowerCase().includes(q);
  refs.filter(filter).forEach(e => listReflections.appendChild(card(e)));
  const done = refs.length;
  const target = data.target_reflections || 260;
  progress.textContent = `Progress: ${done}/${target}`;
}
async function initFeed() {
  const data = await loadManifest();
  renderList(data);
  window.__manifest = data;
}
initFeed();

search.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  renderList(window.__manifest, q);
});

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[data-route]');
  if (!a) return;
  e.preventDefault();
  const href = a.getAttribute("href");
  if (href.startsWith("?page=open-questions") || href.includes("page=open-questions")) {
    history.pushState({ page: "open-questions" }, "", "?page=open-questions");
    renderOpenQuestions();
  } else {
    const path = href.split("#")[0];
    history.pushState({ page: path }, "", `?page=${encodeURIComponent(path)}`);
    loadMD(path);
  }
});

if (homeLink) {
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    history.pushState({ page: "./notes/000-welcome.md" }, "", `?page=${encodeURIComponent("./notes/000-welcome.md")}`);
    loadMD("./notes/000-welcome.md");
  });
}

window.addEventListener("popstate", () => {
  const url = new URL(window.location.href);
  const pageParam = url.searchParams.get("page");
  if (!pageParam || pageParam.endsWith("index.html")) {
    loadMD("./notes/000-welcome.md");
    return;
  }
  if (pageParam === "open-questions") renderOpenQuestions();
  else loadMD(pageParam);
});

async function loadMD(path) {
  try {
    if (!path || path.endsWith("index.html")) {
      path = "./notes/000-welcome.md"; // relative to /docs/
    }
    // Normalize: ensure starts with ./notes/ or ./pages/
    if (path.startsWith("notes/")) path = "./" + path;
    if (path.startsWith("pages/")) path = "./" + path;
    // Prevent accidental duplication of /docs/
    if (path.startsWith("docs/notes/")) path = path.replace(/^docs\//, "./");
    if (path.startsWith("docs/pages/")) path = path.replace(/^docs\//, "./");
    const fetchPath = path + "?v=" + Date.now();
    console.log("[loadMD] fetching", fetchPath);
    const res = await fetch(fetchPath);
    if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} for ${fetchPath}`);
    const text = await res.text();
    marked.setOptions({ breaks: true });
    let html = marked.parse(text);
    // Post-process to transform paragraphs starting with ChatGPT5 Feedback:
    const chatgptLogoSVG = '<svg class="chatgpt-logo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1890ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2a4.8 4.8 0 0 1 4.53 3.17 4.8 4.8 0 0 1 5.27 4.71 4.8 4.8 0 0 1-2.84 4.38A4.8 4.8 0 0 1 12 20.8a4.8 4.8 0 0 1-4.53-3.17 4.8 4.8 0 0 1-5.27-4.71 4.8 4.8 0 0 1 2.84-4.38A4.8 4.8 0 0 1 12 3.2Z"/></svg>';
    html = html.replace(/<p>\s*(?:<em>)?\*?ChatGPT5 (?:Feedback)+:([\s\S]*?)<\/p>/gi, (m, body) => {
      const feedbackText = body.replace(/^<\/em>/i, '').trim();
      return `<div class="chatgpt5-feedback">${chatgptLogoSVG}<span class="chatgpt5-title">ChatGPT5 Feedback:</span> <span class="chatgpt5-text">${feedbackText}</span></div>`;
    });
    content.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
  content.innerHTML = `<p style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:8px;">Unable to load this page.<br><code>${e.message.replace(/</g,'&lt;')}</code></p>`;
  console.error(e);
  }
}

function handleRoute() {
  const url = new URL(window.location.href);
  let pageParam = url.searchParams.get("page");
  if (!pageParam || pageParam.endsWith("index.html")) {
    loadMD("./notes/000-welcome.md");
    return;
  }
  if (pageParam === "open-questions") renderOpenQuestions();
  else loadMD(pageParam);
}
window.addEventListener("DOMContentLoaded", handleRoute);

// Open Questions - Notion-like view
async function renderOpenQuestions() {
  content.innerHTML = "<p>Loading questions...</p>";
  try {
    const res = await fetch("./data/open-questions.json?v=" + Date.now());
    const data = await res.json();
    content.innerHTML = "";
    const h1 = document.createElement("h1");
    h1.textContent = "Open Questions";
    content.appendChild(h1);

    const bar = document.createElement("div");
    bar.className = "toolbar";
    bar.innerHTML = `
      <input id="oq-search" placeholder="Search questions..."/>
      <select id="oq-status">
        <option value="">All status</option>
        <option value="open">Open</option>
        <option value="inprogress">In progress</option>
        <option value="answered">Answered</option>
      </select>
      <select id="oq-sort">
        <option value="posted-desc">Sort: Posted desc</option>
        <option value="posted-asc">Sort: Posted asc</option>
        <option value="answered-desc">Sort: Answered desc</option>
        <option value="answered-asc">Sort: Answered asc</option>
      </select>
      <button id="oq-export">Export CSV</button>
    `;
    content.appendChild(bar);

    const table = document.createElement("table");
    table.className = "table";
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Question</th><th>Posted</th><th>Status</th><th>Answer</th><th>Answered</th></tr>";
    const tbody = document.createElement("tbody");
    table.appendChild(thead);
    table.appendChild(tbody);
    content.appendChild(table);

    const form = document.createElement("div");
    form.className = "toolbar";
    form.style.marginTop = "10px";
    form.innerHTML = `
      <textarea id="oq-new-q" placeholder="New question..." style="min-width:240px;min-height:42px;"></textarea>
      <select id="oq-new-status">
        <option value="open">Open</option>
        <option value="inprogress">In progress</option>
        <option value="answered">Answered</option>
      </select>
      <textarea id="oq-new-answer" placeholder="Answer (optional)" style="min-width:240px;min-height:42px;"></textarea>
      <button id="oq-make">Make JSON snippet</button>
      <button id="oq-copy">Copy snippet</button>
    `;
    content.appendChild(form);

    const help = document.createElement("div");
    help.className = "help";
    help.innerHTML = "To save changes: edit <code>/docs/data/open-questions.json</code> in your repo, paste the snippet, and commit.";
    content.appendChild(help);

    function renderRows(items) {
      tbody.innerHTML = "";
      items.forEach(it => {
        const tr = document.createElement("tr");
        const statusClass = it.status === "answered" ? "status-answered" : (it.status === "inprogress" ? "status-inprogress" : "status-open");
        tr.innerHTML = `
          <td>${it.question}</td>
          <td>${it.posted}</td>
          <td><span class="status-pill ${statusClass}">${it.status}</span></td>
          <td>${it.answer || ""}</td>
          <td>${it.answered || ""}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    function applyFilters() {
      const q = document.getElementById("oq-search").value.toLowerCase();
      const s = document.getElementById("oq-status").value;
      const sort = document.getElementById("oq-sort").value;
      let items = data.items.filter(it => it.question.toLowerCase().includes(q));
      if (s) items = items.filter(it => it.status === s);
      const key = sort.includes("answered") ? "answered" : "posted";
      const dir = sort.endsWith("desc") ? -1 : 1;
      items.sort((a,b) => ((a[key]||"") < (b[key]||"") ? -1 : (a[key]||"") > (b[key]||"") ? 1 : 0) * dir);
      renderRows(items);
    }

    document.getElementById("oq-search").addEventListener("input", applyFilters);
    document.getElementById("oq-status").addEventListener("change", applyFilters);
    document.getElementById("oq-sort").addEventListener("change", applyFilters);

    document.getElementById("oq-export").addEventListener("click", () => {
      const rows = [["Question","Posted","Status","Answer","Answered"]].concat(
        data.items.map(it => [it.question, it.posted, it.status, it.answer || "", it.answered || ""])
      );
      const csv = rows.map(r => r.map(x => '"' + (String(x).replace('"','""')) + '"').join(",")).join("\n");
      const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "open-questions.csv"; a.click();
      URL.revokeObjectURL(url);
    });

    let snippet = "";
    document.getElementById("oq-make").addEventListener("click", () => {
      const qv = document.getElementById("oq-new-q").value.trim();
      const sv = document.getElementById("oq-new-status").value;
      const av = document.getElementById("oq-new-answer").value.trim();
      const today = new Date().toISOString().slice(0,10);
      const answered = sv === "answered" && av ? today : "";
      snippet = JSON.stringify({question:qv, posted:today, status:sv, answer:av || "", answered:answered}, null, 2);
      const pre = document.createElement("pre");
      pre.textContent = snippet;
      const existing = content.querySelector("pre.__snippet");
      if (existing) existing.remove();
      pre.className = "__snippet";
      content.appendChild(pre);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
    document.getElementById("oq-copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(snippet); alert("Snippet copied. Paste into open-questions.json and commit."); }
      catch { alert("Copy failed. Select the snippet and copy manually."); }
    });

    renderRows(data.items);
  } catch (e) {
    content.innerHTML = "<p>Failed to load open questions.</p>";
  }
}
