const fs = require("fs");
const p = "C:/Users/sanch/Documents/mes projets open code/kleo/app/app.js";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
`  const LIBRARY_LEVELS = ['6e', '5e', '4e', '3e'];
  let levelFilter = 'all';`,
`  const LIBRARY_LEVELS = ['6e', '5e', '4e', '3e'];
  const LIBRARY_SUBJECTS = [
    { id: 'histoire', label: 'Histoire', icon: 'i-column', line: 'Enquêtes, contrôles et parcours sur les périodes du programme.' },
    { id: 'geo', label: 'Géographie', icon: 'i-planet', line: 'Territoires, cartes et enjeux du monde d’aujourd’hui.' }
  ];
  const subjectFilters = { histoire: 'all', geo: 'all' };
  let editTexts = false;
  let textOverrides = {};
  let lastTextsJson = '';
  let textsTimer = null;`
);

const start = s.indexOf("  function renderLevels(allProjects) {");
const end = s.indexOf("  function renderLibrary() {");
if (start < 0 || end < 0) throw new Error("bloc renderProjects introuvable");

const block = `  function projectView(project) {
    const read = (field) => {
      const value = textOverrides[project.id + ':' + field];
      return typeof value === 'string' && value.trim() ? value : project[field] || '';
    };
    return { ...project, title: read('title'), subtitle: read('subtitle'), description: read('description') };
  }

  function editAttr(project, field) {
    if (!editTexts) return '';
    return ' contenteditable="true" spellcheck="false" data-text="' + esc(project.id) + ':' + field + '"';
  }

  function levelTiles(list, subjectId) {
    const filter = subjectFilters[subjectId] || 'all';
    const tiles = [
      { id: 'all', label: 'Toutes les classes', count: list.length },
      ...LIBRARY_LEVELS.map((level) => ({ id: level, label: level, count: list.filter((p) => p.level === level).length }))
    ];
    return tiles
      .map(
        (tile) => \`<button type="button" class="level-folder\${filter === tile.id ? ' is-on' : ''}" data-level="\${esc(tile.id)}" data-subject="\${esc(subjectId)}">
          <svg class="ico"><use href="#i-folder"/></svg>
          <span><strong>\${esc(tile.label)}</strong><small>\${tile.count} expérience\${tile.count > 1 ? 's' : ''}</small></span>
        </button>\`
      )
      .join('');
  }

  function renderLibrarySections() {
    const mount = $('#subject-sections');
    if (!mount) return;
    const all = D.PROJECTS || [];
    mount.innerHTML = LIBRARY_SUBJECTS.map((subject) => {
      const list = all.filter((project) => (project.subject || 'histoire') === subject.id);
      const filter = subjectFilters[subject.id] || 'all';
      const visible = filter === 'all' ? list : list.filter((project) => project.level === filter);
      const cards = visible.length
        ? visible.map(projectCard).join('')
        : \`<div class="empty-grid"><div class="empty-card"><span class="empty-icon"><svg class="ico"><use href="#\${subject.icon}"/></svg></span>
             <h3>Rien encore \${filter === 'all' ? '' : 'en ' + esc(filter)}.</h3>
             <p>Les prochaines expériences de \${esc(subject.label.toLowerCase())} viendront se ranger ici.</p>
           </div></div>\`;
      return \`<section class="subject-block subject-\${subject.id}">
        <svg class="subject-watermark" aria-hidden="true"><use href="#\${subject.icon}"/></svg>
        <header class="subject-head">
          <span class="subject-icon" aria-hidden="true"><svg class="ico"><use href="#\${subject.icon}"/></svg></span>
          <div class="subject-copy">
            <h2>\${esc(subject.label)}</h2>
            <p>\${esc(subject.line)}</p>
          </div>
          <span class="subject-count">\${list.length} expérience\${list.length > 1 ? 's' : ''}</span>
        </header>
        <div class="level-folders">\${levelTiles(list, subject.id)}</div>
        <div class="project-grid">\${cards}</div>
      </section>\`;
    }).join('');
  }

  function renderProjects() {
    const all = D.PROJECTS || [];
    const section = $('#projects-section');
    if (section) section.style.display = all.length ? '' : 'none';
    if (LIBRARY_ONLY) {
      renderLibrarySections();
    } else {
      const grid = $('#project-grid');
      if (grid) grid.innerHTML = all.map(projectCard).join('');
    }
    const count = $('#project-count');
    if (count) {
      count.textContent = LIBRARY_ONLY
        ? 'Choisis une matière, une classe, puis une expérience.'
        : all.length
          ? \`\${plural(all.length, 'projet', 'projets')} prêt\${all.length > 1 ? 's' : ''} à lancer, à côté de vos séances.\`
          : 'Des enquêtes prêtes à lancer.';
    }
    const heading = section ? section.querySelector('.section-head h2') : null;
    if (heading) heading.textContent = LIBRARY_ONLY ? 'Mes expériences' : 'Projets interactifs';
    const badge = section ? section.querySelector('.badge-ready') : null;
    if (badge && LIBRARY_ONLY) badge.textContent = 'Bibliothèque';
  }

`;

s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s, "utf8");
console.log("renderProjects remplacé");
