(() => {
  const giniOf = labels => {
    const n = labels.length;
    const cnt = {};
    labels.forEach(l => {
      cnt[l] = (cnt[l] || 0) + 1;
    });
    return 1 - sum(Object.values(cnt).map(k => (k / n) ** 2));
  };

  const VALS = { Color: ['Green', 'Red', 'Yellow'], Shape: ['Round', 'Oval'], Weight: ['Heavy', 'Light'] };

  const impurityCounts = c => c.classes.map(cl => c.labels.filter(l => l === cl).length);

  const makeImpurity = level => {
    if (level < 2) {
      const k = R.int(2, 8);
      const labels = [...Array(k).fill('Yes'), ...Array(10 - k).fill('No')];
      return { classes: ['Yes', 'No'], labels: level ? R.shuffle(labels) : labels, list: level > 0 };
    }
    for (;;) {
      const a = R.int(1, 8);
      const b = R.int(1, 9 - a);
      const counts = [a, b, 10 - a - b];
      if (counts.every(x => x >= 1)) {
        const classes = ['Apple', 'Banana', 'Cherry'];
        return { classes, labels: R.shuffle(classes.flatMap((cl, i) => Array(counts[i]).fill(cl))), list: true };
      }
    }
  };

  const impParts = c => {
    const n = c.labels.length;
    const counts = impurityCounts(c);
    const p = counts.map(k => k / n);
    const sq = p.map(x => x * x);
    return { n, counts, p, sq, s: sum(sq), gi: 1 - sum(sq) };
  };

  const impurity = {
    id: 'impurity',
    title: 'Gini Impurity',
    formulas: [
      ['Class probability', `p${H.sub('j')} = ${H.fr('count of class j', 'n')}`],
      ['Gini Impurity', `GI(S) = 1 − Σ p${H.sub('j')}${H.sup(2)}`],
      ['Meaning', 'GI = 0 for a pure set; the larger GI, the more mixed the set']
    ],
    make: makeImpurity,
    context: c =>
      c.list
        ? `<p>Class labels of the ${c.labels.length} examples:</p>${H.chips(c.labels)}`
        : H.table(['Class', 'Count'], c.classes.map((cl, i) => [cl, impurityCounts(c)[i]]), { rowHeads: true }),
    example: { classes: ['Yes', 'No'], labels: ['No', 'Yes', 'No', 'No', 'No'], list: true },
    takeaway: 'GI is small when one class dominates and reaches its maximum when the classes are evenly mixed.',
    steps: [
      {
        title: 'Class probabilities',
        formula: `p${H.sub('j')} = ${H.fr('count of class j', 'n')}`,
        how: 'Count the examples of each class and divide each count by the total number of examples.',
        fields: c => {
          const m = impParts(c);
          return [fld('Total examples', m.n, 0), ...c.classes.map((cl, i) => fld(`p(${cl})`, m.p[i], 2))];
        },
        work: c => {
          const m = impParts(c);
          return [
            `n = ${m.counts.join(' + ')} = ${m.n}`,
            ...c.classes.map((cl, i) => `p(${cl}) = ${m.counts[i]} / ${m.n} = ${num(m.p[i], 3)}`)
          ];
        }
      },
      {
        title: 'Squared probabilities',
        formula: `p${H.sub('j')}${H.sup(2)}  and  Σ p${H.sub('j')}${H.sup(2)}`,
        how: 'Square every class probability, then add the squares.',
        fields: c => {
          const m = impParts(c);
          return [...c.classes.map((cl, i) => fld(`p(${cl})²`, m.sq[i], 2)), fld('Σ p²', m.s, 2)];
        },
        work: c => {
          const m = impParts(c);
          return [
            ...c.classes.map((cl, i) => `p(${cl})² = ${num(m.p[i], 3)}² = ${num(m.sq[i], 3)}`),
            `Σ p² = ${m.sq.map(x => num(x, 3)).join(' + ')} = ${num(m.s, 3)}`
          ];
        }
      },
      {
        title: 'Gini Impurity',
        formula: `GI = 1 − Σ p${H.sub('j')}${H.sup(2)}`,
        how: 'Subtract the sum of squared probabilities from 1.',
        fields: c => {
          const m = impParts(c);
          return [fld('Σ p²', m.s, 2), fld('Gini Impurity', m.gi, 2)];
        },
        work: c => {
          const m = impParts(c);
          return [`GI = 1 − ${num(m.s, 3)}`, `GI = ${num(m.gi, 3)}`];
        }
      }
    ]
  };

  const genRows = (attrs, vals) => {
    for (;;) {
      const rows = Array.from({ length: 10 }, () => {
        const r = {};
        attrs.forEach(a => {
          r[a] = R.pick(vals[a]);
        });
        return r;
      });
      const yes = R.int(4, 6);
      const ys = R.shuffle(Array.from({ length: 10 }, (_, i) => (i < yes ? 'Yes' : 'No')));
      rows.forEach((r, i) => {
        r.y = ys[i];
      });
      if (attrs.every(a => vals[a].every(v => rows.filter(r => r[a] === v).length >= 2))) return rows;
    }
  };

  const analyse = (rows, attr, values) => {
    const gi0 = giniOf(rows.map(r => r.y));
    const groups = values
      .map(v => {
        const ls = rows.filter(r => r[attr] === v).map(r => r.y);
        const yes = ls.filter(l => l === 'Yes').length;
        return { v, n: ls.length, yes, no: ls.length - yes, gi: ls.length ? giniOf(ls) : 0, w: ls.length / rows.length };
      })
      .filter(g => g.n > 0);
    const weighted = sum(groups.map(g => g.w * g.gi));
    return { gi0, groups, weighted, gain: gi0 - weighted, yes: rows.filter(r => r.y === 'Yes').length };
  };

  const rawTable = (rows, attrs) =>
    H.table(
      ['Example', ...rows.map((_, i) => i + 1)],
      [...attrs.map(a => [a, ...rows.map(r => r[a])]), ['Bitten', ...rows.map(r => r.y)]],
      { rowHeads: true }
    );

  const makeGain = level => {
    const attr = level === 2 ? 'Color' : R.pick(['Shape', 'Weight']);
    for (;;) {
      const rows = genRows([attr], VALS);
      if (analyse(rows, attr, VALS[attr]).gain >= 0.03) return { rows, attr, values: VALS[attr], summary: level === 0 };
    }
  };

  const examRows = [
    ['Green', 'Round', 'Heavy', 'No'],
    ['Green', 'Round', 'Light', 'Yes'],
    ['Green', 'Oval', 'Light', 'No'],
    ['Red', 'Round', 'Heavy', 'Yes'],
    ['Red', 'Oval', 'Light', 'Yes'],
    ['Yellow', 'Round', 'Heavy', 'No'],
    ['Yellow', 'Oval', 'Heavy', 'No'],
    ['Yellow', 'Oval', 'Light', 'Yes'],
    ['Orange', 'Round', 'Light', 'Yes'],
    ['Orange', 'Oval', 'Heavy', 'No']
  ].map(([Color, Shape, Weight, y]) => ({ Color, Shape, Weight, y }));

  const gainFormulas = [
    ['Gini Impurity', `GI(S) = 1 − Σ p${H.sub('j')}${H.sup(2)}`],
    ['Weight of a value', `w${H.sub('v')} = ${H.fr(`|S${H.sub('v')}|`, '|S|')}`],
    ['Weighted impurity', `Σ w${H.sub('v')} · GI(S${H.sub('v')})`],
    ['Gini Gain', `GG(S, A) = GI(S) − Σ ${H.fr(`|S${H.sub('v')}|`, '|S|')} · GI(S${H.sub('v')})`],
    ['Root choice', 'the attribute with the largest Gini Gain becomes the root']
  ];

  const subGiLine = g => `GI(${g.v}) = 1 − (${g.yes}/${g.n})² − (${g.no}/${g.n})² = ${num(g.gi, 3)}`;
  const weightedLine = a => `weighted = ${a.groups.map(g => `${num(g.w, 1)} × ${num(g.gi, 3)}`).join(' + ')} = ${num(a.weighted, 3)}`;

  const gainSub = {
    id: 'gain',
    title: 'Gini Gain of an Attribute',
    formulas: gainFormulas,
    make: makeGain,
    context: c => {
      const a = analyse(c.rows, c.attr, c.values);
      return c.summary
        ? `<p>Class label: Bitten (Yes / No)</p>` +
            H.table([c.attr, 'Yes', 'No'], a.groups.map(g => [g.v, g.yes, g.no]), { rowHeads: true })
        : rawTable(c.rows, [c.attr]);
    },
    example: { rows: examRows, attr: 'Shape', values: ['Round', 'Oval'], summary: false },
    takeaway: 'A positive gain means splitting on this attribute makes the groups purer than the original set.',
    steps: [
      {
        title: 'Impurity of the whole set',
        formula: `GI(S) = 1 − Σ p${H.sub('j')}${H.sup(2)}`,
        how: 'Count Yes and No in the whole dataset, turn them into probabilities, square, add and subtract from 1.',
        fields: c => {
          const a = analyse(c.rows, c.attr, c.values);
          return [fld('Yes count', a.yes, 0), fld('No count', c.rows.length - a.yes, 0), fld('GI(S)', a.gi0, 3)];
        },
        work: c => {
          const a = analyse(c.rows, c.attr, c.values);
          const n = c.rows.length;
          return [
            `Yes = ${a.yes}, No = ${n - a.yes}, n = ${n}`,
            `GI(S) = 1 − (${a.yes}/${n})² − (${n - a.yes}/${n})² = ${num(a.gi0, 3)}`
          ];
        }
      },
      {
        title: 'Impurity of each subset',
        formula: `GI(S${H.sub('v')}) = 1 − Σ p${H.sub('j')}${H.sup(2)}`,
        how: 'Split the rows by the attribute value. For each group count Yes and No and compute its Gini Impurity.',
        fields: c => analyse(c.rows, c.attr, c.values).groups.map(g => fld(`GI(${c.attr} = ${g.v})`, g.gi, 3)),
        work: c => analyse(c.rows, c.attr, c.values).groups.map(subGiLine)
      },
      {
        title: 'Weighted impurity',
        formula: `Σ w${H.sub('v')} · GI(S${H.sub('v')}),  w${H.sub('v')} = ${H.fr(`|S${H.sub('v')}|`, '|S|')}`,
        how: 'Weight of a group = its size divided by the total size. Multiply each weight by the group impurity and add.',
        given: c => analyse(c.rows, c.attr, c.values).groups.map(g => fld(`GI(${c.attr} = ${g.v})`, g.gi, 3)),
        fields: c => {
          const a = analyse(c.rows, c.attr, c.values);
          return [...a.groups.map(g => fld(`Weight of ${g.v}`, g.w, 1)), fld('Weighted impurity', a.weighted, 3)];
        },
        work: c => {
          const a = analyse(c.rows, c.attr, c.values);
          return [...a.groups.map(g => `w(${g.v}) = ${g.n} / ${c.rows.length} = ${num(g.w, 1)}`), weightedLine(a)];
        }
      },
      {
        title: 'Gini Gain',
        formula: `GG = GI(S) − weighted impurity`,
        how: 'Subtract the weighted impurity of the split from the impurity of the whole set.',
        fields: c => {
          const a = analyse(c.rows, c.attr, c.values);
          return [fld('GI(S)', a.gi0, 3), fld('Weighted impurity', a.weighted, 3), fld('Gini Gain', a.gain, 3)];
        },
        work: c => {
          const a = analyse(c.rows, c.attr, c.values);
          return [`GG = ${num(a.gi0, 3)} − ${num(a.weighted, 3)}`, `GG = ${num(a.gain, 3)}`];
        }
      }
    ]
  };

  const makeRoot = level => {
    const attrs = level < 2 ? ['Shape', 'Weight'] : ['Color', 'Shape', 'Weight'];
    for (;;) {
      const rows = genRows(attrs, VALS);
      const g = attrs.map(a => analyse(rows, a, VALS[a]).gain).sort((x, y) => y - x);
      if (g[0] >= 0.03 && g[0] - g[1] >= 0.02) return { rows, attrs, vals: VALS };
    }
  };

  const rootParts = c => {
    const res = c.attrs.map(a => analyse(c.rows, a, c.vals[a]));
    const gains = res.map(r => r.gain);
    return { res, gains, best: gains.indexOf(Math.max(...gains)) };
  };

  const attrLines = c => {
    const { res } = rootParts(c);
    return c.attrs.map((a, i) => {
      const r = res[i];
      return `${a}: ${r.groups.map(g => `${g.v} (${g.yes}Y/${g.no}N) GI ${num(g.gi, 3)}`).join('; ')} → weighted ${num(r.weighted, 3)}, GG = ${num(r.gi0, 3)} − ${num(r.weighted, 3)} = ${num(r.gain, 3)}`;
    });
  };

  const root = {
    id: 'root',
    title: 'Choosing the Root Attribute',
    formulas: gainFormulas,
    make: makeRoot,
    context: c => rawTable(c.rows, c.attrs),
    example: {
      rows: examRows,
      attrs: ['Color', 'Shape', 'Weight'],
      vals: { Color: ['Green', 'Red', 'Yellow', 'Orange'], Shape: VALS.Shape, Weight: VALS.Weight }
    },
    takeaway: 'The attribute with the highest Gini Gain separates the classes best, so it is placed at the root of the tree.',
    steps: [
      {
        title: 'Gini Gain of every attribute',
        formula: `GG(S, A) = GI(S) − Σ ${H.fr(`|S${H.sub('v')}|`, '|S|')} · GI(S${H.sub('v')})`,
        how: 'For each attribute split the rows by its values, compute the impurity of every group, weight them, and subtract the result from GI(S).',
        fields: c => rootParts(c).gains.map((g, i) => fld(`Gini Gain (${c.attrs[i]})`, g, 3)),
        work: c => [`GI(S) = ${num(rootParts(c).res[0].gi0, 3)}`, ...attrLines(c)]
      },
      {
        title: 'Root attribute',
        formula: 'root = attribute with the largest Gini Gain',
        how: 'Compute the Gini Gain of each attribute and choose the largest. Answer with the attribute number.',
        fields: c => {
          const p = rootParts(c);
          return [
            ...p.gains.map((g, i) => fld(`Gini Gain (${c.attrs[i]})`, g, 3)),
            fld(`Root attribute number (${c.attrs.map((a, i) => `${i + 1} = ${a}`).join(', ')})`, p.best + 1, 0)
          ];
        },
        work: c => {
          const p = rootParts(c);
          return [
            ...attrLines(c),
            `Largest gain: ${c.attrs[p.best]} (${num(p.gains[p.best], 3)}) → root is ${c.attrs[p.best]}`
          ];
        }
      }
    ]
  };

  const examParts = c => {
    const rp = rootParts(c);
    const n = c.rows.length;
    return [
      {
        title: 'Calculate the Gini Impurity of the whole dataset.',
        fields: [
          fld('Yes count', rp.res[0].yes, 0),
          fld('No count', n - rp.res[0].yes, 0),
          fld('GI(S)', rp.res[0].gi0, 3)
        ],
        work: [
          `Yes = ${rp.res[0].yes}, No = ${n - rp.res[0].yes}`,
          `GI(S) = 1 − (${rp.res[0].yes}/${n})² − (${n - rp.res[0].yes}/${n})² = ${num(rp.res[0].gi0, 3)}`
        ]
      },
      ...c.attrs.map((a, i) => {
        const r = rp.res[i];
        return {
          title: `Calculate the Gini Gain of ${a}: the impurity and weight of every value, the weighted impurity and the gain.`,
          fields: [
            ...r.groups.flatMap(g => [fld(`GI(${a} = ${g.v})`, g.gi, 3), fld(`Weight of ${g.v}`, g.w, 1)]),
            fld('Weighted impurity', r.weighted, 3),
            fld(`Gini Gain (${a})`, r.gain, 3)
          ],
          work: [
            ...r.groups.map(subGiLine),
            ...r.groups.map(g => `w(${g.v}) = ${g.n} / ${n} = ${num(g.w, 1)}`),
            weightedLine(r),
            `GG = ${num(r.gi0, 3)} − ${num(r.weighted, 3)} = ${num(r.gain, 3)}`
          ]
        };
      }),
      {
        title: `Which attribute should be the root of the tree? Enter its number (${c.attrs.map((a, i) => `${i + 1} = ${a}`).join(', ')}).`,
        fields: [fld('Root attribute number', rp.best + 1, 0)],
        work: [`Largest Gini Gain: ${c.attrs[rp.best]} (${num(rp.gains[rp.best], 3)})`]
      }
    ];
  };

  const exam = {
    make: () => makeRoot(2),
    context: c =>
      `<p>The dataset below describes fruits and whether they are bitten. Build a decision tree using Gini Impurity and Gini Gain.</p>${rawTable(c.rows, c.attrs)}`,
    parts: examParts
  };

  TOPICS.push({ id: 'gini', title: 'Decision Tree with Gini', subs: [impurity, gainSub, root], exam });
})();
