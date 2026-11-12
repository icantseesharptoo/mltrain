(() => {
  const FUNCS = [
    ['sin', (x, d) => Math.sin(d ? (x * Math.PI) / 180 : x)],
    ['cos', (x, d) => Math.cos(d ? (x * Math.PI) / 180 : x)],
    ['tan', (x, d) => Math.tan(d ? (x * Math.PI) / 180 : x)],
    ['ln', x => Math.log(x)],
    ['log', x => Math.log10(x)],
    ['√', x => Math.sqrt(x)]
  ];

  const evaluate = (src, deg, ans) => {
    const s = src
      .replace(/\s+/g, '')
      .replace(/−/g, '-')
      .replace(/×/g, '*')
      .replace(/÷/g, '/');
    let i = 0;
    const peek = () => s[i];
    const fail = () => {
      throw new Error('syntax');
    };
    const number = () => {
      const m = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(s.slice(i));
      if (!m) fail();
      i += m[0].length;
      return Number(m[0]);
    };
    const startsOperand = () => /[\d.(πeA√sctl]/.test(peek() || '');
    const expr = () => {
      let v = term();
      while (peek() === '+' || peek() === '-') {
        const o = s[i++];
        const t = term();
        v = o === '+' ? v + t : v - t;
      }
      return v;
    };
    const term = () => {
      let v = unary();
      for (;;) {
        const c = peek();
        if (c === '*' || c === '/') {
          i++;
          const r = unary();
          v = c === '*' ? v * r : v / r;
        } else if (c !== undefined && startsOperand()) {
          v *= power();
        } else return v;
      }
    };
    const unary = () => {
      if (peek() === '-') {
        i++;
        return -unary();
      }
      if (peek() === '+') {
        i++;
        return unary();
      }
      return power();
    };
    const power = () => {
      const b = primary();
      if (peek() === '^') {
        i++;
        return Math.pow(b, unary());
      }
      return b;
    };
    const primary = () => {
      const c = peek();
      if (c === '(') {
        i++;
        const v = expr();
        if (peek() === ')') i++;
        else if (i < s.length) fail();
        return v;
      }
      if (c === 'π') {
        i++;
        return Math.PI;
      }
      if (c === 'e') {
        i++;
        return Math.E;
      }
      if (s.startsWith('Ans', i)) {
        i += 3;
        return ans;
      }
      for (const [name, fn] of FUNCS) {
        if (s.startsWith(name, i)) {
          i += name.length;
          return fn(peek() === '(' ? primary() : unary(), deg);
        }
      }
      return number();
    };
    const v = expr();
    if (i < s.length || !Number.isFinite(v)) fail();
    return Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(10));
  };

  const KEYS = [
    ['DEG', '#mode', 'fn'], ['(', '('], [')', ')'], ['⌫', '#back', 'fn'], ['AC', '#clear', 'danger'],
    ['sin', 'sin(', 'fn'], ['cos', 'cos(', 'fn'], ['tan', 'tan(', 'fn'], ['π', 'π', 'fn'], ['e', 'e', 'fn'],
    ['ln', 'ln(', 'fn'], ['log', 'log(', 'fn'], ['√', '√(', 'fn'], ['x²', '^2', 'fn'], ['xʸ', '^', 'fn'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['÷', '÷', 'op'], ['1/x', '1/(', 'fn'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['×', '×', 'op'], ['Ans', 'Ans', 'fn'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['−', '−', 'op'], ['+', '+', 'op'],
    ['0', '0'], ['.', '.'], ['EE', 'E', 'fn'], ['Use', '#use', 'fn'], ['=', '#eq', 'eq']
  ];

  const root = document.createElement('div');
  root.className = 'calc';
  root.innerHTML = `
    <button class="calc-tab" type="button"><span>Calculator</span><i>▲</i></button>
    <div class="calc-body">
      <input id="calcIn" type="text" autocomplete="off" spellcheck="false" placeholder="Type or tap an expression">
      <div id="calcOut" class="calc-out"></div>
      <div class="calc-keys">${KEYS.map(([l, a, c = '']) => `<button type="button" class="k ${c}" data-k="${a}">${l}</button>`).join('')}</div>
    </div>`;
  document.body.appendChild(root);

  const input = root.querySelector('#calcIn');
  const out = root.querySelector('#calcOut');
  let deg = true;
  let ans = 0;
  let fresh = false;
  let value = null;
  let target = null;

  document.addEventListener('focusin', e => {
    if (e.target.matches('#app input')) target = e.target;
  });

  const setOut = (text, cls = '') => {
    out.className = `calc-out ${cls}`;
    out.textContent = text;
  };

  const preview = () => {
    if (!input.value.trim()) {
      value = null;
      return setOut('');
    }
    try {
      value = evaluate(input.value, deg, ans);
      setOut(`= ${value}`, 'soft');
    } catch {
      value = null;
      setOut('');
    }
  };

  const equals = () => {
    try {
      value = evaluate(input.value, deg, ans);
      ans = value;
      fresh = true;
      setOut(`= ${value}`, 'final');
    } catch {
      value = null;
      setOut('Error', 'err');
    }
  };

  const insert = text => {
    if (fresh) {
      input.value = /^[+−×÷^]/.test(text) ? `Ans${text}` : text;
      fresh = false;
    } else {
      const a = input.selectionStart ?? input.value.length;
      const b = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, a) + text + input.value.slice(b);
      input.setSelectionRange(a + text.length, a + text.length);
    }
    input.focus();
    preview();
  };

  const useResult = () => {
    if (value === null) return setOut('Nothing to use', 'err');
    if (!target || !target.isConnected || target.disabled) return setOut('Click an answer field first', 'err');
    target.value = String(Number(value.toFixed(6)));
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.focus();
  };

  const special = {
    '#mode': el => {
      deg = !deg;
      el.textContent = deg ? 'DEG' : 'RAD';
      preview();
    },
    '#back': () => {
      fresh = false;
      const a = input.selectionStart ?? input.value.length;
      if (a > 0) {
        input.value = input.value.slice(0, a - 1) + input.value.slice(input.selectionEnd ?? a);
        input.setSelectionRange(a - 1, a - 1);
      }
      input.focus();
      preview();
    },
    '#clear': () => {
      input.value = '';
      fresh = false;
      value = null;
      setOut('');
      input.focus();
    },
    '#eq': () => {
      equals();
      input.focus();
    },
    '#use': useResult
  };

  const toggle = open => {
    root.classList.toggle('open', open);
    if (open) input.focus();
  };

  root.querySelector('.calc-tab').addEventListener('click', () => toggle(!root.classList.contains('open')));
  root.querySelector('.calc-keys').addEventListener('mousedown', e => e.preventDefault());
  root.querySelector('.calc-keys').addEventListener('click', e => {
    const el = e.target.closest('[data-k]');
    if (!el) return;
    const k = el.dataset.k;
    if (special[k]) special[k](el);
    else insert(k);
  });
  input.addEventListener('input', () => {
    fresh = false;
    preview();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      equals();
    } else if (e.key === 'Escape') toggle(false);
  });
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      toggle(!root.classList.contains('open'));
    }
  });
})();
