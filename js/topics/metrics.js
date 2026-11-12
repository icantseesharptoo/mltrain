(() => {
  const tot = c => c.tp + c.fn + c.fp + c.tn;
  const f1Of = c => (2 * c.tp) / (2 * c.tp + c.fp + c.fn);

  const matrix = c =>
    H.table(['', 'Predicted 1', 'Predicted 0'], [['Actual 1', c.tp, c.fn], ['Actual 0', c.fp, c.tn]], { rowHeads: true });

  const makeCm = level => {
    const [unit, lo, hi] = [[10, 10, 60], [5, 10, 80], [1, 8, 90]][level];
    const v = () => R.int(lo / unit, hi / unit) * unit;
    return { tp: v(), fn: v(), fp: v(), tn: v() };
  };

  const confusion = {
    id: 'confusion',
    title: 'Confusion Matrix and Class Balance',
    formulas: [
      ['Actual positives', 'P = TP + FN'],
      ['Actual negatives', 'N = FP + TN'],
      ['Total examples', 'T = TP + FN + FP + TN'],
      ['Positive share', `share = ${H.fr('P', 'T')} × 100%`],
      ['Imbalance ratio', `ratio = ${H.fr('larger class size', 'smaller class size')}`],
      ['Balance rule', 'balanced if each class is 40%–60% of the data, otherwise imbalanced']
    ],
    make: makeCm,
    context: matrix,
    example: { tp: 40, fn: 30, fp: 25, tn: 105 },
    takeaway: 'A strong imbalance means accuracy alone can look good while the minority class is predicted badly.',
    steps: [
      {
        title: 'Row totals',
        formula: 'P = TP + FN<br>N = FP + TN<br>T = P + N',
        how: 'Add the two cells of the Actual 1 row, then the two cells of the Actual 0 row, then add both sums.',
        fields: c => [
          fld('Actual positives (TP + FN)', c.tp + c.fn, 0),
          fld('Actual negatives (FP + TN)', c.fp + c.tn, 0),
          fld('Total examples', tot(c), 0)
        ],
        work: c => [
          `P = ${c.tp} + ${c.fn} = ${c.tp + c.fn}`,
          `N = ${c.fp} + ${c.tn} = ${c.fp + c.tn}`,
          `T = ${c.tp + c.fn} + ${c.fp + c.tn} = ${tot(c)}`
        ]
      },
      {
        title: 'Class share',
        formula: `share = ${H.fr('P', 'T')} × 100%`,
        how: 'Divide the number of actual positives by the total and multiply by 100. Compare with the 40%–60% rule.',
        fields: c => [
          fld('Actual positives', c.tp + c.fn, 0),
          fld('Total examples', tot(c), 0),
          fld('Positive share (%)', ((c.tp + c.fn) / tot(c)) * 100, 1)
        ],
        work: c => {
          const s = ((c.tp + c.fn) / tot(c)) * 100;
          return [
            `share = ${c.tp + c.fn} / ${tot(c)} × 100`,
            `share = ${num(s, 1)}%`,
            `Positives ${num(s, 1)}%, negatives ${num(100 - s, 1)}% → ${s >= 40 && s <= 60 ? 'balanced' : 'imbalanced'}`
          ];
        }
      },
      {
        title: 'Imbalance ratio',
        formula: `ratio = ${H.fr('larger class size', 'smaller class size')}`,
        how: 'Pick the larger and the smaller of P and N, then divide larger by smaller. A ratio near 1 means balanced.',
        fields: c => {
          const p = c.tp + c.fn;
          const n = c.fp + c.tn;
          return [
            fld('Larger class size', Math.max(p, n), 0),
            fld('Smaller class size', Math.min(p, n), 0),
            fld('Ratio larger : smaller', Math.max(p, n) / Math.min(p, n), 2)
          ];
        },
        work: c => {
          const p = c.tp + c.fn;
          const n = c.fp + c.tn;
          const hi = Math.max(p, n);
          const lo = Math.min(p, n);
          return [`Larger = ${hi}, smaller = ${lo}`, `ratio = ${hi} / ${lo} = ${num(hi / lo)}`];
        }
      }
    ]
  };

  const prf = {
    id: 'prf',
    title: 'Accuracy, Precision, Recall, F1',
    formulas: [
      ['Accuracy', `Accuracy = ${H.fr('TP + TN', 'TP + TN + FP + FN')}`],
      ['Precision', `Precision = ${H.fr('TP', 'TP + FP')}`],
      ['Recall', `Recall = ${H.fr('TP', 'TP + FN')}`],
      ['F1 score', `F1 = ${H.fr('2 · Precision · Recall', 'Precision + Recall')}`]
    ],
    make: makeCm,
    context: matrix,
    example: { tp: 40, fn: 30, fp: 25, tn: 105 },
    takeaway: 'Precision asks how many predicted positives are right, recall asks how many real positives were found, F1 balances both.',
    steps: [
      {
        title: 'Accuracy',
        formula: `Accuracy = ${H.fr('TP + TN', 'T')}`,
        how: 'Correct predictions are the diagonal cells TP and TN. Divide their sum by the total number of examples.',
        fields: c => [
          fld('Correct predictions (TP + TN)', c.tp + c.tn, 0),
          fld('Total examples', tot(c), 0),
          fld('Accuracy', (c.tp + c.tn) / tot(c), 2)
        ],
        work: c => [
          `Accuracy = (TP + TN) / T`,
          `Accuracy = (${c.tp} + ${c.tn}) / ${tot(c)} = ${c.tp + c.tn} / ${tot(c)}`,
          `Accuracy = ${num((c.tp + c.tn) / tot(c))}`
        ]
      },
      {
        title: 'Precision',
        formula: `Precision = ${H.fr('TP', 'TP + FP')}`,
        how: 'Predicted positives are the Predicted 1 column: TP + FP. Divide TP by that sum.',
        fields: c => [
          fld('Predicted positives (TP + FP)', c.tp + c.fp, 0),
          fld('Precision', c.tp / (c.tp + c.fp), 2)
        ],
        work: c => [
          `TP + FP = ${c.tp} + ${c.fp} = ${c.tp + c.fp}`,
          `Precision = ${c.tp} / ${c.tp + c.fp} = ${num(c.tp / (c.tp + c.fp))}`
        ]
      },
      {
        title: 'Recall',
        formula: `Recall = ${H.fr('TP', 'TP + FN')}`,
        how: 'Actual positives are the Actual 1 row: TP + FN. Divide TP by that sum.',
        fields: c => [
          fld('Actual positives (TP + FN)', c.tp + c.fn, 0),
          fld('Recall', c.tp / (c.tp + c.fn), 2)
        ],
        work: c => [
          `TP + FN = ${c.tp} + ${c.fn} = ${c.tp + c.fn}`,
          `Recall = ${c.tp} / ${c.tp + c.fn} = ${num(c.tp / (c.tp + c.fn))}`
        ]
      },
      {
        title: 'F1 score',
        formula: `F1 = ${H.fr('2 · Precision · Recall', 'Precision + Recall')}`,
        how: 'Compute precision and recall first, then plug both into the harmonic mean formula.',
        fields: c => [
          fld('Precision', c.tp / (c.tp + c.fp), 2),
          fld('Recall', c.tp / (c.tp + c.fn), 2),
          fld('F1 score', f1Of(c), 2)
        ],
        work: c => {
          const p = c.tp / (c.tp + c.fp);
          const r = c.tp / (c.tp + c.fn);
          return [
            `Precision = ${num(p)}, Recall = ${num(r)}`,
            `F1 = 2 × ${num(p)} × ${num(r)} / (${num(p)} + ${num(r)})`,
            `F1 = ${num(2 * p * r)} / ${num(p + r)} = ${num(f1Of(c))}`
          ];
        }
      }
    ]
  };

  const makeCompare = () => {
    for (;;) {
      const mk = () => {
        const tp = R.int(8, 18) * 5;
        return { tp, fn: 100 - tp, fp: R.int(2, 12) * 5 };
      };
      const m = [mk(), mk()];
      const f1 = m.map(f1Of);
      if (m[0].tp === m[1].tp || Math.abs(f1[0] - f1[1]) < 0.03) continue;
      const disagree = f1[0] > f1[1] !== m[0].tp > m[1].tp;
      if (disagree || R.chance(0.35)) return { m };
    }
  };

  const compare = {
    id: 'compare',
    title: 'Choosing the Best Model',
    formulas: [
      ['F1 score', `F1 = ${H.fr('2TP', '2TP + FP + FN')}`],
      ['Recall', `Recall = ${H.fr('TP', 'TP + FN')}`],
      ['FP and FN equally costly', 'compare models by F1 score'],
      ['FN more costly than FP', 'compare models by Recall']
    ],
    make: makeCompare,
    context: c =>
      `<p>Both models were tested on the same ${c.m[0].tp + c.m[0].fn} actual positive examples.</p>` +
      H.table(['Model', 'TP', 'FN', 'FP'], c.m.map((x, i) => [`Model_${i + 1}`, x.tp, x.fn, x.fp]), { rowHeads: true }),
    example: { m: [{ tp: 66, fn: 34, fp: 22 }, { tp: 60, fn: 40, fp: 26 }] },
    takeaway: 'The right metric depends on the cost of mistakes: F1 for equal costs, recall when missing a positive is worse.',
    steps: [
      {
        title: 'Best model when FP and FN cost the same',
        formula: `F1 = ${H.fr('2TP', '2TP + FP + FN')}`,
        how: 'With equal costs both error types matter, so compare F1. Compute F1 for each model and pick the larger.',
        fields: c => {
          const f = c.m.map(f1Of);
          return [
            fld('F1 of Model_1', f[0], 2),
            fld('F1 of Model_2', f[1], 2),
            fld('Best model by F1 (1 or 2)', f[0] > f[1] ? 1 : 2, 0)
          ];
        },
        work: c => {
          const f = c.m.map(f1Of);
          return [
            ...c.m.map(
              (x, i) => `Model_${i + 1}: F1 = 2 × ${x.tp} / (2 × ${x.tp} + ${x.fp} + ${x.fn}) = ${num(2 * x.tp)} / ${2 * x.tp + x.fp + x.fn} = ${num(f[i])}`
            ),
            `Larger F1 → Model_${f[0] > f[1] ? 1 : 2}`
          ];
        }
      },
      {
        title: 'Best model when FN is more costly',
        formula: `Recall = ${H.fr('TP', 'TP + FN')}`,
        how: 'Missing a positive is the expensive mistake, so compare Recall. Compute it for each model and pick the larger.',
        fields: c => {
          const r = c.m.map(x => x.tp / (x.tp + x.fn));
          return [
            fld('Recall of Model_1', r[0], 2),
            fld('Recall of Model_2', r[1], 2),
            fld('Best model by Recall (1 or 2)', r[0] > r[1] ? 1 : 2, 0)
          ];
        },
        work: c => {
          const r = c.m.map(x => x.tp / (x.tp + x.fn));
          return [
            ...c.m.map((x, i) => `Model_${i + 1}: Recall = ${x.tp} / (${x.tp} + ${x.fn}) = ${num(r[i])}`),
            `Larger Recall → Model_${r[0] > r[1] ? 1 : 2}`
          ];
        }
      }
    ]
  };

  const makeExam = () => {
    for (;;) {
      const c = makeCm(1);
      const mk = () => {
        const p = (R.int(10, 18) * 5) / 100;
        const r = (R.int(10, 18) * 5) / 100;
        return { acc: R.int(70, 90) / 100, p, r, f1: rnd((2 * p * r) / (p + r), 2) };
      };
      const m = [mk(), mk()];
      const m3 = {
        acc: rnd((c.tp + c.tn) / tot(c), 2),
        p: rnd(c.tp / (c.tp + c.fp), 2),
        r: rnd(c.tp / (c.tp + c.fn), 2),
        f1: rnd(f1Of(c), 2)
      };
      const all = [...m, m3];
      const best = key => {
        const v = all.map(x => x[key]).sort((a, b) => b - a);
        return v[0] - v[1] >= 0.02 ? all.findIndex(x => x[key] === v[0]) + 1 : 0;
      };
      const bf = best('f1');
      const br = best('r');
      if (bf && br) return { c, m, m3, bf, br };
    }
  };

  const examParts = e => {
    const { c, m3 } = e;
    const p = c.tp + c.fn;
    const n = c.fp + c.tn;
    const t = tot(c);
    const s = (p / t) * 100;
    return [
      {
        title: 'Is the dataset balanced? Calculate the class shares and the imbalance ratio. Balanced means each class holds roughly 40%–60% of the data.',
        fields: [
          fld('Positive share (%)', s, 1),
          fld('Negative share (%)', 100 - s, 1),
          fld('Ratio larger : smaller class', Math.max(p, n) / Math.min(p, n), 2)
        ],
        work: [
          `P = ${c.tp} + ${c.fn} = ${p}, N = ${c.fp} + ${c.tn} = ${n}, T = ${t}`,
          `Positive share = ${p} / ${t} × 100 = ${num(s, 1)}%, negative share = ${num(100 - s, 1)}%`,
          `Ratio = ${Math.max(p, n)} / ${Math.min(p, n)} = ${num(Math.max(p, n) / Math.min(p, n))} → ${s >= 40 && s <= 60 ? 'balanced' : 'imbalanced'}`
        ]
      },
      {
        title: 'Calculate accuracy, precision, recall and F1 score of Model_3.',
        fields: [
          fld('Correct predictions (TP + TN)', c.tp + c.tn, 0),
          fld('Predicted positives (TP + FP)', c.tp + c.fp, 0),
          fld('Actual positives (TP + FN)', p, 0),
          fld('Accuracy', (c.tp + c.tn) / t, 2),
          fld('Precision', c.tp / (c.tp + c.fp), 2),
          fld('Recall', c.tp / (c.tp + c.fn), 2),
          fld('F1 score', f1Of(c), 2)
        ],
        work: [
          `Accuracy = (${c.tp} + ${c.tn}) / ${t} = ${num((c.tp + c.tn) / t)}`,
          `Precision = ${c.tp} / (${c.tp} + ${c.fp}) = ${num(c.tp / (c.tp + c.fp))}`,
          `Recall = ${c.tp} / (${c.tp} + ${c.fn}) = ${num(c.tp / (c.tp + c.fn))}`,
          `F1 = 2 × ${num(m3.p)} × ${num(m3.r)} / (${num(m3.p)} + ${num(m3.r)}) = ${num(f1Of(c))}`
        ]
      },
      {
        title: 'False positives and false negatives are equally costly. Which metric should be used, and which model (1, 2 or 3) is best? Enter the model number.',
        fields: [fld('Best model by F1', e.bf, 0)],
        work: [`Use F1: ${[...e.m, m3].map((x, i) => `Model_${i + 1} = ${num(x.f1)}`).join(', ')}`, `Largest F1 → Model_${e.bf}`]
      },
      {
        title: 'False negatives are more costly than false positives. Which metric should be used, and which model (1, 2 or 3) is best? Enter the model number.',
        fields: [fld('Best model by Recall', e.br, 0)],
        work: [`Use Recall: ${[...e.m, m3].map((x, i) => `Model_${i + 1} = ${num(x.r)}`).join(', ')}`, `Largest Recall → Model_${e.br}`]
      }
    ];
  };

  const exam = {
    make: makeExam,
    context: e =>
      `<p>The table shows the results of two models trained by your colleagues.</p>` +
      H.table(
        ['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score'],
        e.m.map((x, i) => [`Model_${i + 1}`, x.acc, x.p, x.r, x.f1]),
        { rowHeads: true }
      ) +
      `<p>You trained a new model, Model_3, on the same data and got this confusion matrix:</p>` +
      matrix(e.c),
    parts: examParts
  };

  TOPICS.push({ id: 'metrics', title: 'Classification Metrics', subs: [confusion, prf, compare], exam });
})();
