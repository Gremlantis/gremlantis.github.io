document.addEventListener("DOMContentLoaded", () => {
  loadConstitution();
});

async function loadConstitution(){
  try{
    const res = await fetch('/static/txt/constitution.txt');
    if(!res.ok) throw new Error('Could not fetch constitution');

    const text = await res.text();
    renderFromText(text);

  }catch(err){
    document.getElementById('content-inner').textContent = 'Failed to load constitution.';
    console.error(err);
  }
}

function renderFromText(text){
  const lines = text.split(/\r?\n/);

  const content = document.getElementById('content-inner');
  const sidebar = document.getElementById('sidebar');
  content.innerHTML = '';
  sidebar.innerHTML = '';

  let currentSection = null;
  let sectionCount = 0;
  let listStack = [];
  let bulletBaseIndent = null;

  function startSection(title){
    if(currentSection){
      content.appendChild(currentSection);
      listStack = [];
      bulletBaseIndent = null;
    }

    sectionCount++;
    const id = "s" + sectionCount;

    const section = document.createElement('div');
    section.className = "section";
    section.id = id;

    const h2 = document.createElement('h2');
    h2.textContent = title;
    section.appendChild(h2);

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = "#" + id;
    a.textContent = title;
    li.appendChild(a);
    sidebar.appendChild(li);

    currentSection = section;
  }

  for(const rawLine of lines){
    if(!rawLine.trim()) continue;
    if(/^_+$/.test(rawLine.trim())) continue;

    const indent = rawLine.match(/^\s*/)[0].length;
    const line = rawLine.trim();

    // Section headers
    if (/^(Preamble:|Article\s+[IVXLC]+:)/i.test(line)) {
      startSection(line);
      continue;
    }

    if(!currentSection){
      startSection("Preamble");
    }

    // Bullet lines (ONLY *)
    if(line.startsWith("*")){
      if(bulletBaseIndent === null){
        bulletBaseIndent = indent;
      }

      let level = Math.floor((indent - bulletBaseIndent) / 3);
      if(level < 0) level = 0;

      // remove deeper nesting
      listStack.length = level + 1;

      if(!listStack[level]){
        const ul = document.createElement("ul");

        if(level === 0){
          currentSection.appendChild(ul);
        } else {
          const parentList = listStack[level - 1];
          const parentLi = parentList.lastElementChild;
          parentLi.appendChild(ul);
        }

        listStack[level] = ul;
      }

      const li = document.createElement("li");
      li.textContent = line.replace(/^\*\s*/, "");
      listStack[level].appendChild(li);

    } else {
      // normal paragraph resets bullet tracking
      bulletBaseIndent = null;
      listStack = [];

      const p = document.createElement("p");
      p.textContent = line;
      currentSection.appendChild(p);
    }
  }

  if(currentSection){
    content.appendChild(currentSection);
  }

  // Smooth scrolling
  sidebar.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if(target){
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Signature SVG
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='160' viewBox='0 0 320 160'>
    <path d='M10 120 C70 20,130 180,200 80 C240 30,300 140,310 100'
      stroke='#333' stroke-width='3' fill='none' stroke-linecap='round'/>
  </svg>`;

  document.getElementById('signature').src =
    'data:image/svg+xml;base64,' + btoa(svg);
}

const header = document.querySelector("header");
const wrapper = document.querySelector(".constitution-wrapper");

function resizeLayout() {
  wrapper.style.height = `calc(100vh - ${header.offsetHeight}px)`;
}

window.addEventListener("resize", resizeLayout);
resizeLayout();