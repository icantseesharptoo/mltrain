const TOPICS = [];

const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  chance: p => Math.random() < p,
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  sample(arr, n) {
    return R.shuffle(arr).slice(0, n);
  }
};

const rnd = (x, d = 2) => Math.round((x + Number.EPSILON) * 10 ** d) / 10 ** d;
const num = (x, d = 2) => String(rnd(x, d)).replace('-', '−');
const sum = arr => arr.reduce((s, v) => s + v, 0);
const fld = (label, value, dp = 2) => ({ label, value, dp });

const H = {
  fr: (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`,
  sup: x => `<sup>${x}</sup>`,
  sub: x => `<sub>${x}</sub>`,
  sqrt: x => `<span class="rad">√<span>${x}</span></span>`,
  table(head, body, o = {}) {
    const th = head ? `<thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>` : '';
    const rows = body
      .map(r => `<tr>${r.map((c, i) => (o.rowHeads && i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`)
      .join('');
    return `<div class="tbl"><table>${th}<tbody>${rows}</tbody></table></div>`;
  },
  chips: list => `<div class="chips">${list.map(l => `<span class="chip">${l}</span>`).join('')}</div>`
};
