const LEVELS = ['Easy', 'Medium', 'Hard'];
const BASE_XP = [10, 20, 30];
const RANKS = ['Beginner', 'Learner', 'Analyst', 'Practitioner', 'Engineer', 'Expert', 'Master'];
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');

const Store = (() => {
  const KEY = 'ml-trainer-v1';
  const fresh = () => ({
    xp: 0, attempts: 0, correct: 0, solved: 0, hard: 0,
    bestCombo: 0, bestClean: 0, streak: 0, lastDay: '', badges: {}, progress: {}
  });
  let data;
  try {
    data = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    data = fresh();
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  };
  return {
    get: () => data,
    save,
    reset() {
      data = fresh();
      save();
    }
  };
})();

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};
const activeStreak = () => {
  const s = Store.get();
  return s.lastDay === dayKey(new Date()) || s.lastDay === yesterday() ? s.streak : 0;
};
const touchDay = () => {
  const s = Store.get();
  const today = dayKey(new Date());
  if (s.lastDay === today) return;
  s.streak = s.lastDay === yesterday() ? s.streak + 1 : 1;
  s.lastDay = today;
};

const levelOf = xp => Math.floor(xp / 100) + 1;
const rankOf = xp => RANKS[Math.min(levelOf(xp) - 1, RANKS.length - 1)];
const pKey = (sub, si, lv) => `${sub.id}.${si}.${lv}`;
const isDone = (sub, si, lv) => !!Store.get().progress[pKey(sub, si, lv)];
const subCells = sub => sub.steps.length * 3;
const subDone = sub => sub.steps.reduce((n, _, si) => n + [0, 1, 2].filter(l => isDone(sub, si, l)).length, 0);
const topicCells = t => sum(t.subs.map(subCells));
const topicDone = t => sum(t.subs.map(subDone));
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const BADGES = [
  { id: 'first', name: 'First Step', desc: 'Solve 1 task', test: s => s.solved >= 1 },
  { id: 'ten', name: 'Warm Up', desc: 'Solve 10 tasks', test: s => s.solved >= 10 },
  { id: 'fifty', name: 'Grinder', desc: 'Solve 50 tasks', test: s => s.solved >= 50 },
  { id: 'hard', name: 'Hard Mode', desc: 'Solve a hard task', test: s => s.hard >= 1 },
  { id: 'combo', name: 'On Fire', desc: 'Reach a combo of 5', test: s => s.bestCombo >= 5 },
  { id: 'clean', name: 'Sharp Mind', desc: '5 correct in a row without hints', test: s => s.bestClean >= 5 },
  { id: 'days', name: 'Regular', desc: 'Practise 3 days in a row', test: s => s.streak >= 3 },
  { id: 'lvl5', name: 'Level 5', desc: 'Reach level 5', test: s => levelOf(s.xp) >= 5 },
  ...TOPICS.map(t => ({
    id: `master-${t.id}`,
    name: `${t.title} Master`,
    desc: 'Solve every step on every level',
    test: () => topicDone(t) === topicCells(t)
  }))
];

let combo = 0;
let clean = 0;

const toast = (msg, kind = '') => {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3100);
};

const renderHud = () => {
  const s = Store.get();
  $('#hud').innerHTML = `
    <span class="rank">Lv ${levelOf(s.xp)} · ${rankOf(s.xp)}</span>
    <span class="xpbar" title="${s.xp % 100} / 100 XP"><i style="width:${s.xp % 100}%"></i></span>
    <span class="chip-stat">${s.xp} XP</span>
    <span class="chip-stat">Streak ${activeStreak()}d</span>
    <span class="chip-stat">Combo ${combo}</span>`;
};

const find = id => {
  for (const topic of TOPICS) {
    const sub = topic.subs.find(s => s.id === id);
    if (sub) return { topic, sub };
  }
  return null;
};

const formulaList = sub =>
  `<div class="flist">${sub.formulas.map(([n, f]) => `<div class="fitem"><span>${n}</span><div class="formula">${f}</div></div>`).join('')}</div>`;

const renderHome = () => {
  const s = Store.get();
  const acc = s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0;
  app.innerHTML = `
    <section class="stats">
      <div class="card stat"><b>${levelOf(s.xp)}</b><span>${rankOf(s.xp)}</span></div>
      <div class="card stat"><b>${s.solved}</b><span>Tasks solved</span></div>
      <div class="card stat"><b>${acc}%</b><span>Accuracy</span></div>
      <div class="card stat"><b>${activeStreak()}</b><span>Day streak</span></div>
      <div class="card stat"><b>${s.bestCombo}</b><span>Best combo</span></div>
    </section>
    <h2>Topics</h2>
    <section class="grid">
      ${TOPICS.map(t => {
        const p = pct(topicDone(t), topicCells(t));
        return `<a class="card topic" href="#/topic/${t.id}">
          <h3>${t.title}</h3>
          <span class="muted">${t.subs.length} subtopics</span>
          <div class="bar"><i style="width:${p}%"></i></div>
          <span class="muted">${p}% complete</span>
        </a>`;
      }).join('')}
    </section>
    <h2>Badges</h2>
    <section class="grid badges">
      ${BADGES.map(b => `<div class="card badge ${s.badges[b.id] ? 'on' : ''}"><i>${s.badges[b.id] ? '★' : '☆'}</i><div><b>${b.name}</b><span>${b.desc}</span></div></div>`).join('')}
    </section>
    <p><button class="btn ghost" data-act="reset">Reset progress</button></p>`;
};

const renderTopic = id => {
  const t = TOPICS.find(x => x.id === id);
  if (!t) return renderHome();
  app.innerHTML = `
    <a class="back" href="#/">← Topics</a>
    <h1>${t.title}</h1>
    <section class="grid">
      ${t.subs.map(sub => {
        const p = pct(subDone(sub), subCells(sub));
        return `<a class="card topic" href="#/sub/${sub.id}/formulas">
          <h3>${sub.title}</h3>
          <span class="muted">${sub.steps.length} steps · 3 levels each</span>
          <div class="bar"><i style="width:${p}%"></i></div>
          <span class="muted">${p}% complete</span>
        </a>`;
      }).join('')}
    </section>`;
};

const renderSheet = () => {
  app.innerHTML = `<h1>Formula sheet</h1>${TOPICS.map(
    t => `<h2>${t.title}</h2>${t.subs.map(s => `<h3>${s.title}</h3>${formulaList(s)}`).join('')}`
  ).join('')}`;
};

const cur = { sub: null, topic: null };
const E = { shown: 1 };
const P = { step: 0, level: 0, task: null };

const renderSub = (id, tab) => {
  const found = find(id);
  if (!found) return renderHome();
  cur.sub = found.sub;
  cur.topic = found.topic;
  E.shown = 1;
  const tabs = [['formulas', 'Formulas'], ['example', 'Example'], ['practice', 'Practice']];
  app.innerHTML = `
    <a class="back" href="#/topic/${found.topic.id}">← ${found.topic.title}</a>
    <h1>${found.sub.title}</h1>
    <div class="tabs">${tabs.map(([k, n]) => `<a class="${tab === k ? 'on' : ''}" href="#/sub/${id}/${k}">${n}</a>`).join('')}</div>
    <div id="tab"></div>`;
  if (tab === 'example') drawExample();
  else if (tab === 'practice') drawPractice();
  else $('#tab').innerHTML = formulaList(found.sub);
};

const resultList = fields =>
  fields.map(f => `${f.label} = <b>${num(f.value, f.dp)}</b>`).join('<br>');

const drawExample = () => {
  const sub = cur.sub;
  const ex = sub.example;
  const blocks = sub.steps
    .slice(0, E.shown)
    .map(
      (st, i) => `<div class="ex-step">
        <h4><span class="num">${i + 1}</span>${st.title}</h4>
        <div class="formula">${st.formula}</div>
        <p>${st.how}</p>
        <ul class="work">${st.work(ex).map(l => `<li>${l}</li>`).join('')}</ul>
        <p class="result">${resultList(st.fields(ex))}</p>
      </div>`
    )
    .join('');
  const more = E.shown < sub.steps.length;
  $('#tab').innerHTML = `
    <div class="card">${sub.context(ex)}</div>
    ${blocks}
    ${more ? '' : `<div class="card takeaway">${sub.takeaway}</div>`}
    <div class="actions">
      ${more ? '<button class="btn primary" data-act="ex-next">Next step</button><button class="btn" data-act="ex-all">Show all</button>' : ''}
      ${E.shown > 1 ? '<button class="btn ghost" data-act="ex-restart">Restart</button>' : ''}
    </div>`;
};

const drawPractice = () => {
  const sub = cur.sub;
  $('#tab').innerHTML = `
    <details class="card"><summary>Formulas</summary>${formulaList(sub)}</details>
    <div class="practice"><aside id="steps"></aside><section id="task" class="card"></section></div>`;
  let start = [0, 0];
  outer: for (let si = 0; si < sub.steps.length; si++) {
    for (let lv = 0; lv < 3; lv++) {
      if (!isDone(sub, si, lv)) {
        start = [si, lv];
        break outer;
      }
    }
  }
  startTask(start[0], start[1]);
};

const renderSteps = () => {
  const sub = cur.sub;
  $('#steps').innerHTML = sub.steps
    .map(
      (st, si) => `<div class="step ${P.step === si ? 'active' : ''}">
        <div class="step-title"><span class="num">${si + 1}</span>${st.title}</div>
        <div class="levels">${LEVELS.map((l, lv) => {
          const d = isDone(sub, si, lv);
          return `<button class="lvl lv${lv} ${P.step === si && P.level === lv ? 'on' : ''} ${d ? 'done' : ''}" data-act="start" data-step="${si}" data-lv="${lv}">${d ? '✓ ' : ''}${l}</button>`;
        }).join('')}</div>
      </div>`
    )
    .join('');
};

const startTask = (si, lv) => {
  const sub = cur.sub;
  const step = sub.steps[si];
  const c = sub.make(lv);
  const all = step.fields(c);
  const asked = lv === 2 ? all : [all[all.length - 1]];
  const given = lv === 0 ? [...all.slice(0, -1), ...(step.given ? step.given(c) : [])] : [];
  P.step = si;
  P.level = lv;
  P.task = {
    sub, step, si, level: lv, asked, given,
    ctx: sub.context(c),
    hints: [step.how, ...step.work(c)],
    work: step.work(c),
    shown: 0, done: false
  };
  $('#task').innerHTML = taskHTML(P.task);
  renderSteps();
  const first = $('#task input');
  if (first) first.focus();
};

const placeholder = f => (f.dp > 0 ? `${f.dp} decimals` : 'integer');

const taskHTML = t => `
  <div class="task-head"><span class="tag lv${t.level}">${LEVELS[t.level]}</span><h3>Step ${t.si + 1}. ${t.step.title}</h3></div>
  <div class="formula">${t.step.formula}</div>
  <div class="context">${t.ctx}</div>
  ${t.given.length ? `<div class="given"><b>Given</b><br>${t.given.map(g => `${g.label} = <b>${num(g.value, g.dp)}</b>`).join('<br>')}</div>` : ''}
  <p class="prompt">${t.asked.length > 1 ? 'Fill in the empty values.' : 'Calculate the value.'}</p>
  <div class="fields">${t.asked
    .map(
      (a, i) => `<label class="fld"><span>${a.label}</span><b>=</b><input data-i="${i}" inputmode="decimal" autocomplete="off" placeholder="${placeholder(a)}"></label>`
    )
    .join('')}</div>
  <div class="actions" id="actions">
    <button class="btn primary" data-act="check">Check</button>
    <button class="btn" data-act="hint" id="hintBtn">Hint (0/${t.hints.length})</button>
    <button class="btn ghost" data-act="solution">Show solution</button>
  </div>
  <div id="feedback"></div>
  <ol class="hints" id="hints"></ol>
  <div id="solution"></div>`;

const parse = raw => {
  let s = raw.trim().replace(',', '.').replace('%', '').replace('−', '-');
  const m = s.match(/^(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return s === '' ? NaN : Number(s);
};

const tol = f => (f.dp >= 2 ? 0.011 : f.dp === 1 ? 0.11 : 1e-6);

const feedback = (msg, kind) => {
  $('#feedback').innerHTML = `<div class="fb ${kind}">${msg}</div>`;
};

const showSolution = () => {
  $('#solution').innerHTML = `<div class="card solution"><b>Solution</b><ul class="work">${P.task.work.map(l => `<li>${l}</li>`).join('')}</ul></div>`;
};

const finishTask = () => {
  const t = P.task;
  t.done = true;
  document.querySelectorAll('#task input').forEach(i => (i.disabled = true));
  const last = t.level === 2 && t.si === t.sub.steps.length - 1;
  $('#actions').innerHTML = `
    <button class="btn primary" data-act="again">New task</button>
    ${last ? '' : '<button class="btn" data-act="continue">Continue</button>'}`;
  renderSteps();
};

const award = t => {
  const s = Store.get();
  const before = levelOf(s.xp);
  touchDay();
  combo++;
  clean = t.shown === 0 ? clean + 1 : 0;
  const bonus = Math.min(combo - 1, 5) * 2;
  const gain = Math.round(BASE_XP[t.level] * Math.max(0.4, 1 - 0.2 * t.shown)) + bonus;
  s.xp += gain;
  s.solved++;
  if (t.level === 2) s.hard++;
  s.bestCombo = Math.max(s.bestCombo, combo);
  s.bestClean = Math.max(s.bestClean, clean);
  const k = pKey(t.sub, t.si, t.level);
  s.progress[k] = (s.progress[k] || 0) + 1;
  BADGES.forEach(b => {
    if (!s.badges[b.id] && b.test(s)) {
      s.badges[b.id] = Date.now();
      toast(`Badge unlocked: ${b.name}`, 'badge');
    }
  });
  if (levelOf(s.xp) > before) toast(`Level up! You are now level ${levelOf(s.xp)}`, 'level');
  Store.save();
  return { gain, bonus };
};

const check = () => {
  const t = P.task;
  if (!t || t.done) return;
  const inputs = [...document.querySelectorAll('#task input')];
  const vals = inputs.map(i => parse(i.value));
  if (vals.some(Number.isNaN)) return feedback('Enter a number in every field.', 'warn');
  const s = Store.get();
  s.attempts++;
  let ok = true;
  vals.forEach((v, i) => {
    const good = Math.abs(v - t.asked[i].value) <= tol(t.asked[i]);
    inputs[i].classList.toggle('good', good);
    inputs[i].classList.toggle('bad', !good);
    if (!good) ok = false;
  });
  if (!ok) {
    combo = 0;
    clean = 0;
    Store.save();
    renderHud();
    return feedback('Not quite. Check the red fields or use a hint.', 'bad');
  }
  s.correct++;
  const r = award(t);
  feedback(`Correct! +${r.gain} XP${r.bonus ? ` (combo bonus ${r.bonus})` : ''}`, 'good');
  showSolution();
  finishTask();
  renderHud();
};

const hint = () => {
  const t = P.task;
  if (!t || t.done || t.shown >= t.hints.length) return;
  t.shown++;
  $('#hints').innerHTML = t.hints
    .slice(0, t.shown)
    .map((h, i) => `<li><b>${i === 0 ? 'Approach' : `Step ${i}`}</b> ${h}</li>`)
    .join('');
  $('#hintBtn').textContent = `Hint (${t.shown}/${t.hints.length})`;
  if (t.shown >= t.hints.length) $('#hintBtn').disabled = true;
};

const solution = () => {
  const t = P.task;
  if (!t || t.done) return;
  combo = 0;
  clean = 0;
  feedback(`Answer: ${t.asked.map(a => `${a.label} = <b>${num(a.value, a.dp)}</b>`).join('; ')}. No XP for this task.`, 'warn');
  showSolution();
  finishTask();
  renderHud();
};

const next = () => {
  const { step, level } = P;
  const n = cur.sub.steps.length;
  if (level < 2) startTask(step, level + 1);
  else if (step + 1 < n) startTask(step + 1, 0);
};

const actions = {
  reset() {
    if (confirm('Delete all saved progress?')) {
      Store.reset();
      combo = 0;
      clean = 0;
      render();
    }
  },
  'ex-next'() {
    E.shown++;
    drawExample();
  },
  'ex-all'() {
    E.shown = cur.sub.steps.length;
    drawExample();
  },
  'ex-restart'() {
    E.shown = 1;
    drawExample();
  },
  start: el => startTask(Number(el.dataset.step), Number(el.dataset.lv)),
  check,
  hint,
  solution,
  again: () => startTask(P.step, P.level),
  continue: next
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && actions[el.dataset.act]) actions[el.dataset.act](el);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('#task input')) check();
});

const render = () => {
  const [view, a, b] = location.hash.replace(/^#\/?/, '').split('/');
  renderHud();
  window.scrollTo(0, 0);
  if (view === 'topic') renderTopic(a);
  else if (view === 'sub') renderSub(a, b || 'formulas');
  else if (view === 'sheet') renderSheet();
  else renderHome();
};

window.addEventListener('hashchange', render);
render();
