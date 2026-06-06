;(() => {
   /**
    * @typedef {expr[]} vertical
    * @typedef {[number, vertical]} entry
    * @typedef {entry[]} column
    * @typedef {column[]} expr
    */

   /**
    * @type {Map<string, expr>}
    */
   const data = new Map(),
      data_short = new Map()

   /**
    * @template T
    * @param {T} obj
    * @return T
    */
   function deepcopy(obj) {
      if (!obj) return obj;
      if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string') return obj;
      let result = Array.isArray(obj) ? Array.from({length: obj.length}) : {};
      for (let key in obj) {
         result[key] = deepcopy(obj[key]);
      }
      return result;
   }

   /**
    * @param {number} v
    * @param {expr} s
    * @return string
    */
   function entry_single_display(v, s) {
      if (s.length === 1) return '' + v
      return '' + v + '<sup>' + expr_display(s) + '</sup>';
   }

   /**
    * @param {entry} e
    * @return string
    */
   function entry_display([v, ss]) {
      return ss.map(s => entry_single_display(v, s)).join(',');
   }

   /**
    * @param {column} c
    * @return string
    */
   function column_display(c) {
      return '(' + c.map(entry_display).join(',') + ')';
   }

   /**
    * @param {expr} m
    * @return {string}
    */
   function expr_display(m) {
      if ('' + m === 'Infinity') return 'Limit'
      return m.map(column_display).join('')
   }

   /**
    * @param {expr} m
    * @return {boolean}
    */
   function expr_is_limit(m) {
      if ('' + m === 'Infinity') return true;
      return m.length > 0 && m[m.length - 1].length > 0;
   }

   /**
    * @param {number} a
    * @param {number} b
    * @return {number}
    */
   function number_compare(a, b) {
      return a === b ? 0 : a < b ? -1 : 1;
   }

   /**
    * @template T
    * @param {T[]} a
    * @param {T[]} b
    * @param {function(T, T): number} cmp
    * @return number
    */
   function lex_compare(a, b, cmp) {
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
         let result = cmp(a[i], b[i]);
         if (result !== 0) return result;
      }
      return number_compare(a.length, b.length);
   }

   /**
    * @param {vertical} ss1
    * @param {vertical} ss2
    */
   function vertical_compare(ss1, ss2) {
      return lex_compare(ss1, ss2, expr_compare);
   }

   /**
    * @param {entry} e1
    * @param {entry} e2
    * @return number
    */
   function entry_compare([v1, ss1], [v2, ss2]) {
      if (v1 !== v2) return number_compare(v1, v2);
      return vertical_compare(ss1, ss2);
   }

   /**
    * @param {column} c1
    * @param {column} c2
    * @return {number}
    */
   function column_compare(c1, c2) {
      return lex_compare(c1, c2, entry_compare);
   }

   /**
    * @param {expr} m1
    * @param {expr} m2
    * @return {number}
    */
   function expr_compare(m1, m2) {
      if ('' + m1 === 'Infinity' && '' + m2 === 'Infinity') return 0;
      if ('' + m1 === 'Infinity') return 1;
      if ('' + m2 === 'Infinity') return -1;
      return lex_compare(m1, m2, column_compare)
   }

   /**
    * @param {vertical} v1
    * @param {vertical} v2
    * @returns {vertical}
    */
   function vertical_add(v1, v2) {
      if (v1.length === 0) return v2.slice();
      if (v2.length === 0) return v1.slice();

      const first2 = v2[0];

      let i = v1.length;
      while (i > 0 && expr_compare(v1[i - 1], first2) < 0) i--;
      return v1.slice(0, i).concat(v2);
   }

   /**
    * @param {vertical} v1
    * @param {vertical} v2
    * @returns {vertical}
    */
   function vertical_sub(v1, v2) {
      for (let i = 0; i < v2.length; i++) {
         if (expr_compare(v1[i], v2[i]) > 0) return v1.slice(i);
      }
      return v1.slice(v2.length);
   }

   /**
    * @param {column} col
    * @returns {vertical[]}
    */
   function column_verticals(col) {
      /** @type {vertical} */
      let acc = [];                      // 累积高度，初始为 0（空数组）
      const result = [];
      for (const entry of col) {
         acc = vertical_add(acc, entry[1]); // 加上当前段的长度
         result.push(acc.slice());         // 记录当前累积高度（复制）
      }
      return result;
   }

   /**
    * @param {vertical} v0
    * @param {[number, number][]} parents
    * @param {vertical[]} verticals
    * @returns {[number, number] | undefined}
    */
   function vertical_parent(v0, parents, verticals) {
      for (let i = 0; i < verticals.length; i++) {
         if (vertical_compare(v0, verticals[i]) <= 0) {
            return parents[i];
         }
      }
      return undefined;
   }

   /**
    * @param {vertical[]} verticals
    * @param {vertical} v
    * @returns {number}
    */
   function index_after(verticals, v) {
      for (let j = 0; j < verticals.length; j++) {
         if (vertical_compare(verticals[j], v) > 0) return j;
      }
      return verticals.length;
   }

   /**
    * @param {expr} m
    * @param {vertical[][]} V
    * @return {[number, number][][]}
    */
   function parents(m, V) {
      /**
       * @type {[number, number][][]}
       */
      let P = [];
      for (let i = 0; i < m.length; i++) {
         let mi = m[i];
         let Vi = V[i];
         /**
          * @type {[number, number][]}
          */
         let Pi = [];
         let p = i - 1;
         let j_p = -1
         for (let j = 0; j < m[i].length; j++) {
            let v_prev = j === 0 ? [] : V[i][j - 1];
            let value = m[i][j][0];
            while (true) {
               j_p = j === 0 ? 0 : index_after(V[p], v_prev);
               let value_p = m[p][j_p]?.[0] ?? 0;
               if (value_p < value) break;

               p = j === 0 ? p - 1 : vertical_parent(v_prev, P[p], V[p])[0];
            }

            Pi.push([p, j_p]);
         }

         P.push(Pi);
      }
      return P;
   }

   /**
    * @param {column} col1
    * @param {vertical[]} V1
    * @param {column} col2
    * @param {vertical[]} V2
    * @param {vertical} v_max
    * @return {column}
    */
   function diff(col1, V1, col2, V2, v_max) {
      if (v_max.length === 0) return [];
      /**
       * @type {vertical}
       */
      let v_current = [];
      let j1 = 0, j2 = 0;
      /**
       * @type {column}
       */
      let result = [];
      while (true) {
         let v1 = V1[j1] ?? v_max, v2 = V2[j2];
         let diff = col2[j2][0] - (col1[j1]?.[0] ?? 0);
         let v_next = v_max;
         if (vertical_compare(v1, v_next) < 0) v_next = v1;
         if (vertical_compare(v2, v_next) < 0) v_next = v2;
         let v_diff = vertical_sub(v_next, v_current)
         if (result.length === 0 || result[result.length - 1][0] !== diff) {
            result.push([diff, v_diff]);
         } else {
            result[result.length - 1][1] = vertical_add(result[result.length - 1][1], v_diff);
         }
         v_current = v_next;
         if (vertical_compare(v1, v_next) === 0) j1++;
         if (vertical_compare(v2, v_next) === 0) j2++;
         if (vertical_compare(v_max, v_next) === 0) break;
      }
      return result;
   }

   /**
    * @param {[number, number][][]} P
    * @param {number} r
    * @param {[number, number]} pos
    */
   function is_ancient(P, r, [i, j]) {
      while (i > r && j < P[i].length) [i, j] = P[i][j];
      return i === r;
   }

   /**
    * @param {vertical[][]} V
    * @param {[number, number][][]} P
    * @param {number} r
    * @param {number} i
    * @param {vertical} v_max
    * @return vertical
    */
   function inc_bound(V, P, r, i, v_max) {
      for (let j = 0; j < V[i].length; j++) {
         if (!is_ancient(P, r, [i, j])) return j === 0 ? [] : V[i][j - 1];
         if (vertical_compare(V[i][j], v_max) >= 0) return v_max;
      }
      return V[i].length === 0 ? [] : V[i][V[i].length - 1];
   }

   /**
    * @param {column} col
    * @param {vertical[]} Vi
    * @param {column} d
    * @param {vertical[]} Vd
    * @param {number} mult
    * @param {vertical} v_max
    * @return {column}
    */
   function inc_column(col, Vi, d, Vd, mult, v_max) {
      if (v_max.length === 0) return deepcopy(col);
      /**
       * @type {vertical}
       */
      let v_current = [];
      let ji = 0, jd = 0;
      /**
       * @type {column}
       */
      let result = [];
      while (true) {
         let vi = Vi[ji] ?? v_max, vd = Vd[jd];
         let value = (col[ji]?.[0] ?? 0) + d[jd][0] * mult;
         let v_next = v_max;
         if (vertical_compare(vi, v_next) < 0) v_next = vi;
         if (vertical_compare(vd, v_next) < 0) v_next = vd;
         let v_diff = vertical_sub(v_next, v_current)
         result.push([value, v_diff]);
         v_current = v_next;
         if (vertical_compare(vi, v_next) === 0) ji++;
         if (vertical_compare(vd, v_next) === 0) jd++;
         if (vertical_compare(v_max, v_next) === 0) break;
      }
      if (ji < col.length) {
         result.push([col[ji][0], vertical_sub(Vi[ji], v_current)]);
         result.push(...deepcopy(col.slice(ji + 1)));
      }
      return result;
   }

   /**
    * @param {expr} m
    * @return {vertical}
    */
   function to_vertical(m) {
      let v = [];
      let prev = 0;
      for (let i = 1; i <= m.length; i++) {
         if (i === m.length || m[i].length === 0) {
            v.push(m.slice(prev, i));
            prev = i;
         }
      }
      return v;
   }

   /**
    * @param {number} index
    * @return {expr}
    */
   function Limit(index) {
      if (index === 0) return [[]];
      return [[], [[1, [Limit(index - 1)]]]];
   }

   /**
    * @param {expr} m
    * @param {number} index
    * @param {boolean} shorter
    * @return {expr}
    */
   function expand(m, index, shorter= false) {
      if ('' + m === 'Infinity') return Limit(index);
      if (m.length === 0) return [];
      if (m[m.length - 1].length === 0) return m.slice(0, m.length - 1);

      let rightmost = m.length - 1;
      let topmost = m[rightmost].length - 1;

      m = deepcopy(m);

      let [_, tr_vertical] = m[rightmost][topmost];
      if (tr_vertical[tr_vertical.length - 1].length > 1) {
         let tail = tr_vertical[tr_vertical.length - 1];
         let tailFS = expand(tail, index);
         tr_vertical.pop();
         tr_vertical.push(...to_vertical(tailFS));
         return m;
      }

      /**
       * @type {vertical[][]}
       */
      let V = m.map(column_verticals);
      let P = parents(m, V);

      let r = P[rightmost][topmost][0];
      let v_max = deepcopy(V[rightmost][topmost]);
      v_max.pop();
      /**
       * @type {vertical[]}
       */
      let inc_bounds = [];
      inc_bounds[r] = v_max;
      for (let i = r + 1; i < rightmost; i++) inc_bounds[i] = inc_bound(V, P, r, i, v_max);
      let d = diff(m[r], V[r], m[rightmost], V[rightmost], v_max);
      let Vd = column_verticals(d);

      m.pop();
      for (let w = 1; w <= index + 1; w++) {
         if (shorter && w > index) break;
         for (let i = r; i < rightmost; i++) {
            m.push(inc_column(m[i], V[i], d, Vd, w, inc_bounds[i]));
            if (w > index) break;
         }
      }
      return m;
   }

   register.push({
      id: 'tbm4',
      name: 'Transfinite Bashicu matrix',
      display: expr_display,
      able: expr_is_limit,
      compare: expr_compare,
      FS: (m, index) => {
         if ('' + m === 'Infinity') return Limit(index)
         if (m.length === 0) return []
         return expand(m, index, true)
      },
      FSalter: (m, index) => {
         if ('' + m === 'Infinity') return Limit(index)
         if (m.length === 0) return []
         return expand(m, index)
      },
      FSShort: (m, index) => {
         if ('' + m === 'Infinity') return Limit(index)
         if (m.length === 0) return []
         if (index === 0) return expand(m, 0, true)
         if (index === 1) {
            if (expr_compare(expand(m, 0, true), expand(m, 0, false)) === 0)
               return expand(m, 1, true)
            else return expand(m, 0, false)
         }
         if (
            expr_compare(expand(m, 0, true), expand(m, 0, false)) === 0 ||
            expr_compare(expand(m, 1, true), expand(m, 0, false)) === 0
         ) return expand(m, index, true)
         return expand(m, index - 1, true)
      },
      init: () => ([
         {expr: [[Infinity]], low: [[]], subitems: []}
         , {expr: [], low: [[]], subitems: []}
      ])
   })
})()