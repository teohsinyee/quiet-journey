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
  } else if (href.startsWith("?page=calendar") || href.includes("page=calendar")) {
    history.pushState({ page: "calendar" }, "", "?page=calendar");
    renderCalendar();
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
  else if (pageParam === "calendar") renderCalendar();
  else loadMD(pageParam);
});

async function loadMD(path) {
  try {
    if (!path || path.endsWith("index.html")) {
      path = "./notes/000-welcome.md";
    }
    const res = await fetch(path + "?v=" + Date.now());
    const text = await res.text();
    content.innerHTML = marked.parse(text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    content.innerHTML = "<p>Unable to load this page.</p>";
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
  else if (pageParam === "calendar") renderCalendar();
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

async function renderCalendar() {
  const data = window.__manifest || await loadManifest();
  content.innerHTML = "";
  const h1 = document.createElement("h1");
  h1.textContent = "Calendar";
  content.appendChild(h1);

  const stats = document.createElement("div");
  stats.className = "meta";
  const dates = data.entries.map(e => e.date).sort();
  if (dates.length) {
    const start = new Date(dates[0]);
    const today = new Date();
    const daysSinceStart = Math.floor((today - start) / 86400000) + 1;
    const skipped = daysSinceStart - dates.length;
    stats.textContent = `Entries: ${dates.length} • Days since start: ${daysSinceStart} • Days skipped: ${skipped}`;
  } else {
    stats.textContent = "No reflections yet.";
  }
  content.appendChild(stats);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const table = document.createElement("table");
  table.className = "calendar";
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
    const th = document.createElement("th"); th.textContent = d; hr.appendChild(th);
  });
  thead.appendChild(hr); table.appendChild(thead);
  const tbody = document.createElement("tbody");
  let tr = document.createElement("tr");
  for (let i=0; i<first.getDay(); i++) tr.appendChild(document.createElement("td"));
  for (let d=1; d<=last.getDate(); d++) {
    const td = document.createElement("td");
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const entry = data.entries.find(e => e.date === dateStr);
    if (entry) {
      const a = document.createElement("a");
      a.href = entry.path; a.setAttribute("data-route", ""); a.textContent = d;
      td.className = "done"; td.appendChild(a);
    } else {
      td.textContent = d; td.className = "miss";
    }
    tr.appendChild(td);
    if ((first.getDay() + d) % 7 === 0) { tbody.appendChild(tr); tr = document.createElement("tr"); }
  }
  if (tr.children.length) tbody.appendChild(tr);
  table.appendChild(tbody);
  content.appendChild(table);
}
