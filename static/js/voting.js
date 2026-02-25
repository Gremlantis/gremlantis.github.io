// Define the voting records hierarchy
const votingRecords = [
  {
    title: "Amendments",
    items: [
      { file: "article_xiii.txt", title: "Article XIII: Treaties and Agreements" },
      { file: "article_xiv.txt", title: "Article XIV: Declaration of War" },
    ]
  }
];

// ---------------- Sidebar Builder ----------------

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";
  buildSidebar(sidebar, votingRecords);

  // Load only if hash exists
  loadFromHash();
});

function buildSidebar(container, records) {
  const ul = document.createElement("ul");

  records.forEach(record => {
    const li = document.createElement("li");

    // If this record has a file, make it a link
    if (record.file) {
      const slug = record.file.replace(".txt", "");

      const a = document.createElement("a");
      a.href = `#${slug}`;
      a.textContent = record.title;

      li.appendChild(a);
    } 
    // Otherwise it's just a header
    else {
      const span = document.createElement("span");
      span.textContent = record.title;
      span.className = "header-item";
      li.appendChild(span);
    }

    // Recursively build children
    if (record.items && record.items.length) {
      buildSidebar(li, record.items);
    }

    ul.appendChild(li);
  });

  container.appendChild(ul);
}

// ---------------- Hash Routing ----------------

function findRecordBySlug(records, slug) {
  for (const record of records) {
    if (record.file) {
      const fileSlug = record.file.replace(".txt", "");
      if (fileSlug === slug) return record;
    }

    if (record.items) {
      const found = findRecordBySlug(record.items, slug);
      if (found) return found;
    }
  }
  return null;
}

function updateActiveLink(slug) {
  const links = document.querySelectorAll("#sidebar a");

  links.forEach(link => {
    if (link.getAttribute("href") === `#${slug}`) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function loadFromHash() {
  const hash = location.hash.slice(1);

  if (!hash) {
    updateActiveLink(null);
    return;
  }

  const record = findRecordBySlug(votingRecords, hash);

  if (record) {
    loadVote(record.file);
    updateActiveLink(hash);
  } else {
    console.warn("No voting record found for:", hash);
    updateActiveLink(null);
  }
}

window.addEventListener("hashchange", loadFromHash);

// ---------------- Load Vote ----------------

async function loadVote(filename) {
  const content = document.getElementById("content-inner");
  content.textContent = "Loading…";

  try {
    const res = await fetch(`/static/txt/voting-records/${filename}`);
    if (!res.ok) throw new Error("File not found: " + filename);

    const text = await res.text();
    renderFromText(text);
  } catch (err) {
    content.textContent = "Failed to load voting record.";
    console.error(err);
  }
}

// ---------------- Render Text ----------------

function renderFromText(text) {
  const lines = text.split(/\r?\n/);
  const content = document.getElementById("content-inner");
  content.innerHTML = "";

  let currentSection = null;
  let listStack = [];
  let bulletBaseIndent = null;

  function startSection(title) {
    if (currentSection) {
      content.appendChild(currentSection);
      listStack = [];
      bulletBaseIndent = null;
    }

    const section = document.createElement("div");
    section.className = "section";

    const h2 = document.createElement("h2");
    h2.textContent = title;
    section.appendChild(h2);

    currentSection = section;
  }

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;
    if (/^_+$/.test(rawLine.trim())) continue;

    const indent = rawLine.match(/^\s*/)[0].length;
    const line = rawLine.trim();

    if (/^(Preamble:|Article\s+[IVXLC]+:)/i.test(line)) {
      startSection(line);
      continue;
    }

    if (!currentSection) startSection("Voting Record:");

    if (line.startsWith("*")) {
      if (bulletBaseIndent === null) bulletBaseIndent = indent;

      let level = Math.floor((indent - bulletBaseIndent) / 3);
      if (level < 0) level = 0;

      listStack.length = level + 1;

      if (!listStack[level]) {
        const ul = document.createElement("ul");
        if (level === 0) currentSection.appendChild(ul);
        else listStack[level - 1].lastElementChild.appendChild(ul);
        listStack[level] = ul;
      }

      const li = document.createElement("li");
      li.textContent = line.replace(/^\*\s*/, "");
      listStack[level].appendChild(li);

    } else {
      bulletBaseIndent = null;
      listStack = [];

      const p = document.createElement("p");
      p.textContent = line;
      currentSection.appendChild(p);
    }
  }

  if (currentSection) content.appendChild(currentSection);
}

// ---------------- Layout Resize ----------------

const header = document.querySelector("header");
const wrapper = document.querySelector(".constitution-wrapper");

function resizeLayout() {
  wrapper.style.height = `calc(100vh - ${header.offsetHeight}px)`;
}

window.addEventListener("resize", resizeLayout);
resizeLayout();
