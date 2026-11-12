(() => {
  const yhat = (c, p) => c.a * p.x + c.b;
  const res = (c, p) => p.y - yhat(c, p);
  const sq = x => x * x;
  const par = x => (x < 0 ? `(${num(x)})` : num(x));

  const makeReg = level => {
    const n = [3, 4, 5][level];
    const xs = level === 2 ? [1, 3, 5, 7, 9] : Array.from({ length: n }, (_, i) => i + 1);
    const a = R.int(2, [5, 6, 7][level]);
    const b = level === 0 ? R.int(1, 4) * 10 : R.int(2, 8) * 5;
    const [lo, hi] = [[-3, 3], [-5, 5], [-6, 8]][level];
    const pts = xs.map(x => {
      let r = 0;
      while (r === 0) r = R.int(lo, hi);
      return { x, y: a * x + b + r };
    });
    return { a, b, pts, t: R.int(0, n - 1) };
  };

  const stats = c => {
    const n = c.pts.length;
    const mean = sum(c.pts.map(p => p.y)) / n;
    const sse = sum(c.pts.map(p => sq(res(c, p))));
    const sst = sum(c.pts.map(p => sq(p.y - mean)));
    return { n, mean, sse, sst, r2: 1 - sse / sst, mse: sse / n };
  };

  const makeR2 = level => {
    for (;;) {
      const c = makeReg(level);
      if (sum(c.pts.map(p => p.y)) % c.pts.length) continue;
      const r2 = stats(c).r2;
      if (r2 > 0.8 && r2 < 0.995) return c;
    }
  };

  const dataTable = c =>
    H.table(['x', ...c.pts.map(p => p.x)], [['y', ...c.pts.map(p => p.y)]], { rowHeads: true });
  const model = c => `<p>Model: <b>ŷ = ${c.a}x + ${c.b}</b></p>`;
  const ctx = c => model(c) + dataTable(c);

  const exam = { a: 6, b: 30, pts: [[1, 35], [3, 50], [5, 63], [7, 78], [9, 92]].map(([x, y]) => ({ x, y })), t: 1 };
  const exam2 = { ...exam, a: 7, b: 25 };

  const errorSub = {
    id: 'error',
    title: 'Predictions and Squared Errors',
    formulas: [
      ['Prediction', 'ŷ = a·x + b'],
      ['Error (residual)', 'e = y − ŷ'],
      ['Squared error', 'e² = (y − ŷ)²']
    ],
    make: makeReg,
    context: c => {
      const p = c.pts[c.t];
      return ctx(c) + `<p>Use the point with x = <b>${p.x}</b> and y = <b>${p.y}</b>.</p>`;
    },
    example: exam,
    takeaway: 'The squared error is always non-negative; the closer ŷ is to y, the smaller it gets.',
    steps: [
      {
        title: 'Predicted value',
        formula: 'ŷ = a·x + b',
        how: 'Multiply the slope by x, then add the intercept.',
        fields: c => {
          const p = c.pts[c.t];
          return [fld(`${c.a} × ${p.x}`, c.a * p.x, 0), fld('Predicted ŷ', yhat(c, p), 0)];
        },
        work: c => {
          const p = c.pts[c.t];
          return [`ŷ = ${c.a} × ${p.x} + ${c.b}`, `ŷ = ${c.a * p.x} + ${c.b} = ${yhat(c, p)}`];
        }
      },
      {
        title: 'Error',
        formula: 'e = y − ŷ',
        how: 'Compute ŷ first, then subtract it from the actual y. The sign matters.',
        fields: c => {
          const p = c.pts[c.t];
          return [fld('Predicted ŷ', yhat(c, p), 0), fld('Error e = y − ŷ', res(c, p), 0)];
        },
        work: c => {
          const p = c.pts[c.t];
          return [`ŷ = ${c.a} × ${p.x} + ${c.b} = ${yhat(c, p)}`, `e = ${p.y} − ${yhat(c, p)} = ${num(res(c, p))}`];
        }
      },
      {
        title: 'Squared error',
        formula: 'e² = (y − ŷ)²',
        how: 'Compute the error, then square it. A negative error gives a positive square.',
        fields: c => {
          const p = c.pts[c.t];
          return [fld('Error e', res(c, p), 0), fld('Squared error e²', sq(res(c, p)), 0)];
        },
        work: c => {
          const p = c.pts[c.t];
          return [`e = ${p.y} − ${yhat(c, p)} = ${num(res(c, p))}`, `e² = ${par(res(c, p))}² = ${sq(res(c, p))}`];
        }
      }
    ]
  };

  const eLabel = (c, i) => `e${i + 1} (x = ${c.pts[i].x})`;

  const mseSub = {
    id: 'mse',
    title: 'Mean Squared Error',
    formulas: [
      ['Error', 'eᵢ = yᵢ − ŷᵢ'],
      ['Sum of squared errors', 'SSE = Σ eᵢ²'],
      ['Mean Squared Error', `MSE = ${H.fr('SSE', 'n')} = ${H.fr('1', 'n')} Σ (yᵢ − ŷᵢ)²`],
      ['Model choice', 'the model with the smaller MSE fits the data better']
    ],
    make: makeReg,
    context: ctx,
    example: exam,
    takeaway: 'MSE is the average squared miss; of two models, the one with the lower MSE is more plausible.',
    steps: [
      {
        title: 'Errors of all points',
        formula: 'eᵢ = yᵢ − (a·xᵢ + b)',
        how: 'For each point compute ŷ = a·x + b and subtract it from y.',
        fields: c => c.pts.map((p, i) => fld(eLabel(c, i), res(c, p), 0)),
        work: c => c.pts.map((p, i) => `e${i + 1} = ${p.y} − (${c.a}×${p.x} + ${c.b}) = ${p.y} − ${yhat(c, p)} = ${num(res(c, p))}`)
      },
      {
        title: 'Squared errors and their sum',
        formula: 'SSE = Σ eᵢ²',
        how: 'Square every error, then add all the squares.',
        fields: c => [
          ...c.pts.map((p, i) => fld(`${eLabel(c, i)}²`, sq(res(c, p)), 0)),
          fld('SSE', stats(c).sse, 0)
        ],
        work: c => [
          ...c.pts.map((p, i) => `e${i + 1}² = ${par(res(c, p))}² = ${sq(res(c, p))}`),
          `SSE = ${c.pts.map(p => sq(res(c, p))).join(' + ')} = ${stats(c).sse}`
        ]
      },
      {
        title: 'Mean Squared Error',
        formula: `MSE = ${H.fr('SSE', 'n')}`,
        how: 'Divide the sum of squared errors by the number of points.',
        fields: c => [fld('SSE', stats(c).sse, 0), fld('Number of points n', stats(c).n, 0), fld('MSE', stats(c).mse, 2)],
        work: c => [`MSE = ${stats(c).sse} / ${stats(c).n}`, `MSE = ${num(stats(c).mse)}`]
      }
    ]
  };

  const r2Sub = {
    id: 'r2',
    title: 'Coefficient of Determination R²',
    formulas: [
      ['Mean of y', `ȳ = ${H.fr('Σ y', 'n')}`],
      ['Residual sum of squares', `SS${H.sub('res')} = Σ (y − ŷ)${H.sup(2)}`],
      ['Total sum of squares', `SS${H.sub('tot')} = Σ (y − ȳ)${H.sup(2)}`],
      ['R²', `R${H.sup(2)} = 1 − ${H.fr(`SS${H.sub('res')}`, `SS${H.sub('tot')}`)}`],
      ['Interpretation', 'R² is the share of the variation in y explained by the model']
    ],
    make: makeR2,
    context: ctx,
    example: exam2,
    takeaway: 'R² close to 1 means the model explains almost all of the variation in y.',
    steps: [
      {
        title: 'Mean of y',
        formula: `ȳ = ${H.fr('Σ y', 'n')}`,
        how: 'Add all y values and divide by the number of points.',
        fields: c => [fld('Σ y', sum(c.pts.map(p => p.y)), 0), fld('Mean ȳ', stats(c).mean, 2)],
        work: c => [
          `Σy = ${c.pts.map(p => p.y).join(' + ')} = ${sum(c.pts.map(p => p.y))}`,
          `ȳ = ${sum(c.pts.map(p => p.y))} / ${c.pts.length} = ${num(stats(c).mean)}`
        ]
      },
      {
        title: 'Residual sum of squares',
        formula: `SS${H.sub('res')} = Σ (y − ŷ)${H.sup(2)}`,
        how: 'For each point compute ŷ from the model, square (y − ŷ), then add.',
        fields: c => [
          ...c.pts.map((p, i) => fld(`(y − ŷ)² at x = ${p.x}`, sq(res(c, p)), 0)),
          fld('SS_res', stats(c).sse, 0)
        ],
        work: c => [
          ...c.pts.map((p, i) => `x = ${p.x}: (${p.y} − ${yhat(c, p)})² = ${sq(res(c, p))}`),
          `SS_res = ${c.pts.map(p => sq(res(c, p))).join(' + ')} = ${stats(c).sse}`
        ]
      },
      {
        title: 'Total sum of squares',
        formula: `SS${H.sub('tot')} = Σ (y − ȳ)${H.sup(2)}`,
        how: 'Compute the mean ȳ, then square the distance of every y from it and add.',
        fields: c => [
          ...c.pts.map(p => fld(`(y − ȳ)² at x = ${p.x}`, sq(p.y - stats(c).mean), 2)),
          fld('SS_tot', stats(c).sst, 2)
        ],
        work: c => [
          `ȳ = ${num(stats(c).mean)}`,
          ...c.pts.map(p => `x = ${p.x}: (${p.y} − ${num(stats(c).mean)})² = ${num(sq(p.y - stats(c).mean))}`),
          `SS_tot = ${c.pts.map(p => num(sq(p.y - stats(c).mean))).join(' + ')} = ${num(stats(c).sst)}`
        ]
      },
      {
        title: 'R²',
        formula: `R${H.sup(2)} = 1 − ${H.fr(`SS${H.sub('res')}`, `SS${H.sub('tot')}`)}`,
        how: 'Divide SS_res by SS_tot and subtract the result from 1.',
        fields: c => [fld('SS_res', stats(c).sse, 0), fld('SS_tot', stats(c).sst, 2), fld('R²', stats(c).r2, 3)],
        work: c => [
          `R² = 1 − ${stats(c).sse} / ${num(stats(c).sst)}`,
          `R² = ${num(stats(c).r2, 3)}`,
          `The model explains about ${num(stats(c).r2 * 100, 1)}% of the variation in y`
        ]
      }
    ]
  };

  TOPICS.push({ id: 'regression', title: 'Linear Regression Evaluation', subs: [errorSub, mseSub, r2Sub] });
})();
