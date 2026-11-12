(() => {
  const common = c =>
    c.r
      .map((row, u) => ({ u, x: row[c.a], y: row[c.b] }))
      .filter(o => o.x != null && o.y != null);

  const parts = c => {
    const co = common(c);
    const dot = sum(co.map(o => o.x * o.y));
    const sa = sum(co.map(o => o.x * o.x));
    const sb = sum(co.map(o => o.y * o.y));
    const na = Math.sqrt(sa);
    const nb = Math.sqrt(sb);
    return { co, dot, sa, sb, na, nb, sim: dot / (na * nb) };
  };

  const ratingsTable = c =>
    H.table(
      ['', ...c.movies],
      c.r.map((row, u) => [c.users[u], ...row.map(v => (v == null ? '–' : v))]),
      { rowHeads: true }
    );

  const makeRatings = level => {
    const nU = [3, 4, 5][level];
    const nM = [2, 3, 4][level];
    const miss = [0, 0.25, 0.3][level];
    for (;;) {
      const r = Array.from({ length: nU }, () =>
        Array.from({ length: nM }, () => (R.chance(miss) ? null : R.int(1, 5)))
      );
      const [a, b] = R.sample([...Array(nM).keys()], 2).sort();
      const c = {
        users: Array.from({ length: nU }, (_, i) => `U${i + 1}`),
        movies: Array.from({ length: nM }, (_, i) => `M${i + 1}`),
        r,
        a,
        b
      };
      if (common(c).length >= 3) return c;
    }
  };

  const examRatings = {
    users: ['U1', 'U2', 'U3', 'U4', 'U5'],
    movies: ['M1', 'M2', 'M3', 'M4'],
    r: [
      [3, 4, null, 5],
      [5, null, 4, null],
      [null, 3, 5, 4],
      [2, 5, 4, null],
      [4, 4, null, 3]
    ]
  };

  const cosine = {
    id: 'cosine',
    title: 'Cosine Similarity of Two Movies',
    formulas: [
      ['Cosine similarity', `sim(i, j) = ${H.fr(`Σ${H.sub('u')} r${H.sub('u,i')} · r${H.sub('u,j')}`, `${H.sqrt(`Σ${H.sub('u')} r${H.sub('u,i')}${H.sup(2)}`)} · ${H.sqrt(`Σ${H.sub('u')} r${H.sub('u,j')}${H.sup(2)}`)}`)}`],
      ['Users used', 'only users who rated both movies i and j'],
      ['Dot product', `Σ r${H.sub('u,i')} · r${H.sub('u,j')}`],
      ['Vector length', `‖i‖ = ${H.sqrt(`Σ r${H.sub('u,i')}${H.sup(2)}`)}`]
    ],
    make: makeRatings,
    context: c =>
      ratingsTable(c) +
      `<p>Find the cosine similarity between <b>${c.movies[c.a]}</b> and <b>${c.movies[c.b]}</b>. A dash means not rated; use only users who rated both movies.</p>`,
    example: { ...examRatings, a: 0, b: 1 },
    takeaway: 'A value close to 1 means the two movies are rated in a very similar way by the same users.',
    steps: [
      {
        title: 'Users who rated both movies',
        formula: 'count users with a rating for both movies',
        how: 'Look at the two movie columns and keep only the rows where neither cell is a dash.',
        fields: c => [fld('Number of users who rated both', common(c).length, 0)],
        work: c => [
          `Users with both ratings: ${common(c).map(o => c.users[o.u]).join(', ')}`,
          `Count = ${common(c).length}`
        ]
      },
      {
        title: 'Dot product',
        formula: `dot = Σ r${H.sub('u,i')} · r${H.sub('u,j')}`,
        how: 'For every user who rated both movies multiply the two ratings, then add the products.',
        fields: c => {
          const p = parts(c);
          return [
            ...p.co.map(o => fld(`${c.users[o.u]}: ${o.x} × ${o.y}`, o.x * o.y, 0)),
            fld('Dot product', p.dot, 0)
          ];
        },
        work: c => {
          const p = parts(c);
          return [
            ...p.co.map(o => `${c.users[o.u]}: ${o.x} × ${o.y} = ${o.x * o.y}`),
            `dot = ${p.co.map(o => o.x * o.y).join(' + ')} = ${p.dot}`
          ];
        }
      },
      {
        title: 'Vector lengths',
        formula: `‖i‖ = ${H.sqrt(`Σ r${H.sub('u,i')}${H.sup(2)}`)}`,
        how: 'Using only the users who rated both movies, square each rating of one movie, add them, and take the square root. Repeat for the other movie.',
        fields: c => {
          const p = parts(c);
          return [
            fld(`Sum of squares of ${c.movies[c.a]}`, p.sa, 0),
            fld(`Length of ${c.movies[c.a]}`, p.na, 2),
            fld(`Sum of squares of ${c.movies[c.b]}`, p.sb, 0),
            fld(`Length of ${c.movies[c.b]}`, p.nb, 2)
          ];
        },
        work: c => {
          const p = parts(c);
          return [
            `${c.movies[c.a]}: ${p.co.map(o => `${o.x}²`).join(' + ')} = ${p.sa}`,
            `‖${c.movies[c.a]}‖ = √${p.sa} = ${num(p.na)}`,
            `${c.movies[c.b]}: ${p.co.map(o => `${o.y}²`).join(' + ')} = ${p.sb}`,
            `‖${c.movies[c.b]}‖ = √${p.sb} = ${num(p.nb)}`
          ];
        }
      },
      {
        title: 'Cosine similarity',
        formula: `sim = ${H.fr('dot', '‖i‖ · ‖j‖')}`,
        how: 'Multiply the two lengths, then divide the dot product by that number.',
        fields: c => {
          const p = parts(c);
          return [
            fld('Dot product', p.dot, 0),
            fld(`Length of ${c.movies[c.a]}`, p.na, 2),
            fld(`Length of ${c.movies[c.b]}`, p.nb, 2),
            fld('Cosine similarity', p.sim, 2)
          ];
        },
        work: c => {
          const p = parts(c);
          return [
            `sim = ${p.dot} / (${num(p.na)} × ${num(p.nb)})`,
            `sim = ${p.dot} / ${num(p.na * p.nb)}`,
            `sim = ${num(p.sim)}`
          ];
        }
      }
    ]
  };

  const makePred = level => {
    const k = [2, 3, 4][level];
    const sims = R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], k).map(x => x / 10);
    return {
      target: `M${k + 1}`,
      user: 'U2',
      items: sims.map((s, i) => ({ name: `M${i + 1}`, sim: s, rating: R.int(1, 5) }))
    };
  };

  const predParts = c => {
    const terms = c.items.map(i => i.sim * i.rating);
    const num_ = sum(terms);
    const den = sum(c.items.map(i => i.sim));
    return { terms, num_, den, pred: num_ / den };
  };

  const simOf = (i, j) => rnd(parts({ ...examRatings, a: i, b: j }).sim, 2);

  const predict = {
    id: 'predict',
    title: 'Predicting a Rating',
    formulas: [
      ['Item-based prediction', `r${H.sub('u,j')} = ${H.fr(`Σ${H.sub('i')} sim(j, i) · r${H.sub('u,i')}`, `Σ${H.sub('i')} sim(j, i)`)}`],
      ['Items used', 'movies i already rated by user u'],
      ['Numerator', `Σ sim(j, i) · r${H.sub('u,i')}`],
      ['Denominator', 'Σ sim(j, i)']
    ],
    make: makePred,
    context: c =>
      `<p>Predict the rating of <b>${c.target}</b> for user <b>${c.user}</b>.</p>` +
      H.table(
        ['Rated movie', `Similarity to ${c.target}`, `Rating by ${c.user}`],
        c.items.map(i => [i.name, i.sim, i.rating]),
        { rowHeads: true }
      ),
    example: {
      target: 'M4',
      user: 'U2',
      items: [
        { name: 'M1', sim: simOf(0, 3), rating: 5 },
        { name: 'M3', sim: simOf(2, 3), rating: 4 }
      ]
    },
    takeaway: 'The prediction is a weighted average of the user\'s own ratings, so more similar movies count more.',
    steps: [
      {
        title: 'Weighted ratings',
        formula: `sim(j, i) · r${H.sub('u,i')}  for each rated movie, then add`,
        how: 'Multiply each similarity by the rating the user gave to that movie, then add all the products.',
        fields: c => {
          const p = predParts(c);
          return [
            ...c.items.map((i, k) => fld(`${i.name}: ${i.sim} × ${i.rating}`, p.terms[k], 2)),
            fld('Numerator (sum of products)', p.num_, 2)
          ];
        },
        work: c => {
          const p = predParts(c);
          return [
            ...c.items.map((i, k) => `${i.name}: ${i.sim} × ${i.rating} = ${num(p.terms[k])}`),
            `Numerator = ${p.terms.map(t => num(t)).join(' + ')} = ${num(p.num_)}`
          ];
        }
      },
      {
        title: 'Sum of similarities',
        formula: 'Σ sim(j, i)',
        how: 'Add the similarity values of all the movies the user has rated.',
        fields: c => [fld('Denominator (sum of similarities)', predParts(c).den, 2)],
        work: c => [`Denominator = ${c.items.map(i => i.sim).join(' + ')} = ${num(predParts(c).den)}`]
      },
      {
        title: 'Predicted rating',
        formula: `prediction = ${H.fr('numerator', 'denominator')}`,
        how: 'Divide the numerator by the denominator.',
        fields: c => {
          const p = predParts(c);
          return [
            fld('Numerator', p.num_, 2),
            fld('Denominator', p.den, 2),
            fld('Predicted rating', p.pred, 2)
          ];
        },
        work: c => {
          const p = predParts(c);
          return [`prediction = ${num(p.num_)} / ${num(p.den)}`, `prediction = ${num(p.pred)}`];
        }
      }
    ]
  };

  const PAIRS = [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3]];
  const pairName = ([a, b]) => `M${a + 1} – M${b + 1}`;

  const makeExam = () => {
    for (;;) {
      const c = {
        users: ['U1', 'U2', 'U3', 'U4', 'U5'],
        movies: ['M1', 'M2', 'M3', 'M4'],
        r: Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => (R.chance(0.3) ? null : R.int(1, 5))))
      };
      if (!PAIRS.every(([a, b]) => common({ ...c, a, b }).length >= 2)) continue;
      const targets = c.r.map((_, u) => u).filter(u => c.r[u][3] == null);
      if (!targets.length || targets.length > 2) continue;
      if (!targets.every(u => c.r[u].slice(0, 3).filter(v => v != null).length >= 2)) continue;
      return c;
    }
  };

  const examParts = c => {
    const ps = PAIRS.map(([a, b]) => parts({ ...c, a, b }));
    const sims = ps.slice(3).map(p => rnd(p.sim, 2));
    const targets = c.r.map((_, u) => u).filter(u => c.r[u][3] == null);
    const preds = targets.map(u => {
      const items = [0, 1, 2].filter(i => c.r[u][i] != null);
      const numr = sum(items.map(i => sims[i] * c.r[u][i]));
      const den = sum(items.map(i => sims[i]));
      return { u, items, numr, den, pred: numr / den };
    });
    const simFields = ps.flatMap(p => [fld('', p.dot, 0), fld('', p.na, 2), fld('', p.nb, 2), fld('', p.sim, 2)]);
    const predFields = preds.flatMap(p => [fld('', p.numr, 2, 0.05), fld('', p.den, 2, 0.05), fld('', p.pred, 2, 0.05)]);
    return [
      {
        title: 'Calculate the similarity matrix for the movies using cosine similarity. Use only users who rated both movies. For each pair give the dot product, the two vector lengths and the similarity.',
        grid: { head: ['Dot product', 'Length of first', 'Length of second', 'Similarity'], rows: PAIRS.map(pairName) },
        fields: simFields,
        work: PAIRS.map(([a, b], k) => {
          const p = ps[k];
          return `${pairName([a, b])}: users ${p.co.map(o => c.users[o.u]).join(', ')}; dot = ${p.dot}; ‖M${a + 1}‖ = √${p.sa} = ${num(p.na)}; ‖M${b + 1}‖ = √${p.sb} = ${num(p.nb)}; sim = ${p.dot} / (${num(p.na)} × ${num(p.nb)}) = ${num(p.sim)}`;
        })
      },
      {
        title: 'Predict the ratings of M4 for the users who have not rated it, using item-based collaborative filtering. Round similarities to 2 decimals before using them.',
        grid: { head: ['Numerator', 'Denominator', 'Predicted rating'], rows: preds.map(p => c.users[p.u]) },
        fields: predFields,
        work: preds.map(
          p =>
            `${c.users[p.u]}: (${p.items.map(i => `${num(sims[i])}×${c.r[p.u][i]}`).join(' + ')}) / (${p.items.map(i => num(sims[i])).join(' + ')}) = ${num(p.numr)} / ${num(p.den)} = ${num(p.pred)}`
        )
      }
    ];
  };

  const exam = {
    make: makeExam,
    context: c => `<p>The ratings of four movies by five users are given (– means not rated).</p>${ratingsTable(c)}`,
    parts: examParts
  };

  TOPICS.push({ id: 'recommender', title: 'Item-Based Collaborative Filtering', subs: [cosine, predict], exam });
})();
