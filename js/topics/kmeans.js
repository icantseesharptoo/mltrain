(() => {
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const sq = x => x * x;
  const diff = (a, b) => `(${a} − ${b})`;

  const makeAssign = level => {
    const hi = [10, 10, 12][level];
    for (;;) {
      const p = [R.int(4, hi - 3), R.int(4, hi - 3)];
      const cents = [];
      if (level === 0) {
        const [dx, dy] = R.pick([[3, 4], [4, 3]]);
        cents.push([p[0] + (R.chance(0.5) ? dx : -dx), p[1] + (R.chance(0.5) ? dy : -dy)]);
      } else {
        cents.push([R.int(1, hi), R.int(1, hi)]);
      }
      cents.push([R.int(1, hi), R.int(1, hi)], [R.int(1, hi), R.int(1, hi)]);
      const ds = cents.map(q => dist(p, q)).sort((a, b) => a - b);
      const distinct = new Set(cents.map(q => q.join(','))).size === 3;
      if (distinct && ds[0] > 0 && ds[1] - ds[0] >= 0.1) return { p, cents };
    }
  };

  const assign = {
    id: 'assign',
    title: 'Distances and Cluster Assignment',
    formulas: [
      ['Euclidean distance', `d(P, C) = ${H.sqrt(`(x − c${H.sub('x')})${H.sup(2)} + (y − c${H.sub('y')})${H.sup(2)}`)}`],
      ['Squared distance', `d${H.sup(2)} = (x − c${H.sub('x')})${H.sup(2)} + (y − c${H.sub('y')})${H.sup(2)}`],
      ['Assignment rule', 'put the point in the cluster of the nearest centroid (smallest d)']
    ],
    make: makeAssign,
    context: c =>
      `<p>Point P(${c.p[0]}, ${c.p[1]})</p>` +
      H.table(['Centroid', 'x', 'y'], c.cents.map((q, i) => [`C${i + 1}`, q[0], q[1]]), { rowHeads: true }),
    example: { p: [1, 7], cents: [[8, 7], [9, 5], [5, 2]] },
    takeaway: 'Every point joins the cluster whose centroid is closest to it.',
    steps: [
      {
        title: 'Squared differences to C1',
        formula: `(x − c${H.sub('x')})${H.sup(2)}  and  (y − c${H.sub('y')})${H.sup(2)}`,
        how: 'Subtract the centroid coordinate from the point coordinate, square the result, and do this for x and y. Then add the two squares.',
        fields: c => [
          fld('Squared x-difference to C1', sq(c.p[0] - c.cents[0][0]), 0),
          fld('Squared y-difference to C1', sq(c.p[1] - c.cents[0][1]), 0),
          fld('Sum of squared differences', sq(c.p[0] - c.cents[0][0]) + sq(c.p[1] - c.cents[0][1]), 0)
        ],
        work: c => {
          const [x, y] = c.p;
          const [cx, cy] = c.cents[0];
          return [
            `x: ${diff(x, cx)}² = (${x - cx})² = ${sq(x - cx)}`,
            `y: ${diff(y, cy)}² = (${y - cy})² = ${sq(y - cy)}`,
            `sum = ${sq(x - cx)} + ${sq(y - cy)} = ${sq(x - cx) + sq(y - cy)}`
          ];
        }
      },
      {
        title: 'Distance to C1',
        formula: `d = ${H.sqrt('sum of squared differences')}`,
        how: 'Take the square root of the sum of squared differences.',
        fields: c => [
          fld('Sum of squared differences', sq(c.p[0] - c.cents[0][0]) + sq(c.p[1] - c.cents[0][1]), 0),
          fld('Distance to C1', dist(c.p, c.cents[0]), 2)
        ],
        work: c => {
          const s = sq(c.p[0] - c.cents[0][0]) + sq(c.p[1] - c.cents[0][1]);
          return [`d = √${s}`, `d = ${num(Math.sqrt(s))}`];
        }
      },
      {
        title: 'Assign to the nearest centroid',
        formula: 'cluster = centroid with the smallest distance',
        how: 'Compute the distance from P to each of the three centroids and choose the centroid with the smallest value.',
        fields: c => {
          const ds = c.cents.map(q => dist(c.p, q));
          return [
            fld('Distance to C1', ds[0], 2),
            fld('Distance to C2', ds[1], 2),
            fld('Distance to C3', ds[2], 2),
            fld('Cluster number (1, 2 or 3)', ds.indexOf(Math.min(...ds)) + 1, 0)
          ];
        },
        work: c => {
          const ds = c.cents.map(q => dist(c.p, q));
          return [
            ...c.cents.map(
              (q, i) =>
                `d(P, C${i + 1}) = √(${sq(c.p[0] - q[0])} + ${sq(c.p[1] - q[1])}) = √${sq(c.p[0] - q[0]) + sq(c.p[1] - q[1])} = ${num(ds[i])}`
            ),
            `Smallest distance is ${num(Math.min(...ds))} → cluster ${ds.indexOf(Math.min(...ds)) + 1}`
          ];
        }
      }
    ]
  };

  const makeUpdate = level => {
    const n = [3, 4, 5][level];
    for (;;) {
      const pts = Array.from({ length: n }, () => [R.int(1, 9), R.int(1, 9)]);
      const sx = sum(pts.map(p => p[0]));
      const sy = sum(pts.map(p => p[1]));
      if (level === 0 && (sx % n || sy % n)) continue;
      return { pts, old: [R.int(1, 9), R.int(1, 9)] };
    }
  };

  const means = c => {
    const n = c.pts.length;
    const sx = sum(c.pts.map(p => p[0]));
    const sy = sum(c.pts.map(p => p[1]));
    const mx = sx / n;
    const my = sy / n;
    return { n, sx, sy, mx, my, dx: mx - c.old[0], dy: my - c.old[1] };
  };

  const update = {
    id: 'update',
    title: 'Updating Centroids',
    formulas: [
      ['New centroid x', `c${H.sub('x')} = ${H.fr('Σ x', 'n')}`],
      ['New centroid y', `c${H.sub('y')} = ${H.fr('Σ y', 'n')}`],
      ['Centroid shift', `shift = ${H.sqrt(`(Δx)${H.sup(2)} + (Δy)${H.sup(2)}`)},  Δ = new − old`]
    ],
    make: makeUpdate,
    context: c =>
      `<p>Old centroid: (${c.old[0]}, ${c.old[1]}). The cluster contains these points:</p>` +
      H.table(['Point', 'x', 'y'], c.pts.map((p, i) => [`P${i + 1}`, p[0], p[1]]), { rowHeads: true }),
    example: { pts: [[1, 7], [2, 6], [3, 4], [4, 4], [5, 4], [5, 2], [2, 1]], old: [5, 2] },
    takeaway: 'The centroid moves to the mean of its points; when the shift is zero for all clusters, K-Means has converged.',
    steps: [
      {
        title: 'New centroid x',
        formula: `c${H.sub('x')} = ${H.fr('Σ x', 'n')}`,
        how: 'Add all x values of the cluster and divide by the number of points.',
        fields: c => {
          const m = means(c);
          return [fld('Sum of x', m.sx, 0), fld('Number of points', m.n, 0), fld('New centroid x', m.mx, 2)];
        },
        work: c => {
          const m = means(c);
          return [
            `Σx = ${c.pts.map(p => p[0]).join(' + ')} = ${m.sx}`,
            `c_x = ${m.sx} / ${m.n} = ${num(m.mx)}`
          ];
        }
      },
      {
        title: 'New centroid y',
        formula: `c${H.sub('y')} = ${H.fr('Σ y', 'n')}`,
        how: 'Add all y values of the cluster and divide by the number of points.',
        fields: c => {
          const m = means(c);
          return [fld('Sum of y', m.sy, 0), fld('Number of points', m.n, 0), fld('New centroid y', m.my, 2)];
        },
        work: c => {
          const m = means(c);
          return [
            `Σy = ${c.pts.map(p => p[1]).join(' + ')} = ${m.sy}`,
            `c_y = ${m.sy} / ${m.n} = ${num(m.my)}`
          ];
        }
      },
      {
        title: 'Centroid shift',
        formula: `shift = ${H.sqrt(`(Δx)${H.sup(2)} + (Δy)${H.sup(2)}`)}`,
        how: 'Compute the new centroid first. Subtract the old centroid from it for x and y (new − old), then apply the distance formula to the two differences.',
        fields: c => {
          const m = means(c);
          return [
            fld('Δx = new x − old x', m.dx, 2),
            fld('Δy = new y − old y', m.dy, 2),
            fld('Shift of the centroid', Math.hypot(m.dx, m.dy), 2)
          ];
        },
        work: c => {
          const m = means(c);
          return [
            `New centroid = (${num(m.mx)}, ${num(m.my)})`,
            `Δx = ${num(m.mx)} − ${c.old[0]} = ${num(m.dx)}, Δy = ${num(m.my)} − ${c.old[1]} = ${num(m.dy)}`,
            `shift = √(${num(m.dx)}² + ${num(m.dy)}²) = ${num(Math.hypot(m.dx, m.dy))}`
          ];
        }
      }
    ]
  };

  TOPICS.push({ id: 'kmeans', title: 'K-Means Clustering', subs: [assign, update] });
})();
