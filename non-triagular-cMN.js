;(() => {
   /**
    * @typedef {number} separator
    * @typedef {separator[]} vertical
    * @typedef {[number, separator]} entry
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
    * @param {entry} a
    * @param {entry} b
    * @return {number}
    */
   function entry_compare(a, b) {
      if (a[0] !== b[0]) number_compare(a[0], b[0])
      return number_compare(a[1], b[1])
   }

   /**
    * @param {column} a
    * @param {column} b
    * @return {number}
    */
   function column_compare(a, b) {
      return lex_compare(a, b, entry_compare);
   }

   /**
    * @param {expr} a
    * @param {expr} b
    * @return number
    */
   function mountain_compare(a, b) {
      if ('' + a === 'Infinity' && '' + b === 'Infinity') return 0;
      if ('' + a === 'Infinity') return 1;
      if ('' + b === 'Infinity') return -1;
      return lex_compare(a, b, column_compare);
   }

   /**
    * @param {expr} m
    * @return {boolean}
    */
   function mountain_is_limit(m) {
      return '' + m === 'Infinity' || m.length > 0 && m[m.length - 1].length > 0;
   }

   /**
    * @param {number} sep
    * @return {string}
    */
   function sep_display(sep) {
      return ','.repeat(sep + 1);
   }

   /**
    * @param {entry} e
    * @return {string}
    */
   function entry_display(e) {
      return sep_display(e[1]) + e[0];
   }

   /**
    * @param {column} col
    * @return {string}
    */
   function column_display(col) {
      return '(' + col.map(entry_display).join('') + ')';
   }

   /**
    * @param {expr} m
    * @return string
    */
   function mountain_display(m) {
      if ('' + m === 'Infinity') return 'Limit';
      return m.map(column_display).join('');
   }

   /**
    * @param {number} sep
    * @return {string}
    */
   function sep_display_simple(sep) {
      if (sep === 0) return '';
      return ','.repeat(sep + 1);
   }

   /**
    * @param {entry} e
    * @return {string}
    */
   function entry_display_simple(e) {
      return sep_display_simple(e[1]) + e[0];
   }

   /**
    * @param {column} col
    * @return {string}
    */
   function column_display_simple(col) {
      if (col.length === 0) return '0';
      return col.map(entry_display_simple).join('');
   }

   /**
    * @param {expr} m
    * @return string
    */
   function mountain_display_simple(m) {
      if ('' + m === 'Infinity') return 'Limit';
      return m.map(column_display_simple).join(' ');
   }

   /**
    * @param {string} str
    * @return {expr}
    */
   function mountain_fromDisplay(str) {
      if (typeof str !== 'string') {
         throw new Error(`illegal input string: ${str}`);
      }

      if (str === 'Limit') return [[[Infinity]]];

      /**
       * @param {number} start
       * @return {[number, number]}
       */
      function parseSimpleSep(start) {
         let c0 = 0;
         while (start + c0 < str.length && str[start + c0] === ',') {
            c0++;
         }
         return [c0 - 1, start + c0];
      }

      /**
       * @param {number} start
       * @return {[expr, number]}
       */
      function parseExprPrefix(start) {
         /**
          * @type {expr}
          */
         const expr = [];
         let i = start;
         while (i < str.length && str[i] === '(') {
            i++;

            /**
             * @type {column}
             */
            const col = [];
            while (i < str.length && str[i] !== ')') {
               const [sep, nextI] = parseSimpleSep(i);
               i = nextI;

               let valueStart = i;
               while (i < str.length && str[i] >= '0' && str[i] <= '9') {
                  i++;
               }
               const valueStr = str.substring(valueStart, i);
               if (valueStr === '') throw new Error(`illegal input string: ${str}`);
               col.push([parseInt(valueStr), sep]);
            }

            expr.push(col);

            if (i === str.length || str[i] !== ')') throw new Error(`illegal input string: ${str}`);
            i++;
         }

         return [expr, i];
      }

      const [result, end] = parseExprPrefix(0);
      if (end !== str.length) {
         throw new Error(`illegal input string: ${str}`);
      }
      return result;
   }

   function mountain_fromDisplay_simple(str) {
      if (typeof str !== 'string') {
         throw new Error(`illegal input string: ${str}`);
      }
      if (str === 'Limit') return [[[Infinity]]];

      str = str.trim();
      if (str === '') return [];

      /**
       * @param {number} start
       * @return {[number, number]}
       */
      function parseSimpleSep(start) {
         let c0 = 0;
         while (start + c0 < str.length && str[start + c0] === ',') {
            c0++;
         }
         return [c0 - 1, start + c0];
      }

      /**
       * @param start
       * @return {[expr, number]}
       */
      function parseExpr(start) {
         /**
          * @type {expr}
          */
         const expr = [];
         let i = start;
         const len = str.length;

         while (i < len && str[i] === ' ') i++;

         while (i < len && str[i] !== ']') {
            if (str[i] === ' ') {
               i++;
               continue;
            }

            if (str[i] === '0') {
               expr.push([]);
               i++;
               continue;
            }

            /**
             * @type {column}
             */
            const col = [];
            while (i < len && str[i] !== ' ' && str[i] !== ']') {
               let sep;

               if (str[i] === ',') {
                  let [sepExpr, nextI] = parseSimpleSep(i);
                  sep = sepExpr;
                  i = nextI;
               } else {
                  sep = 0;
               }

               let valueStr = '';
               if (i < len && str[i] === '(') {
                  const closeParen = str.indexOf(')', i);
                  if (closeParen === -1) {
                     throw new Error(`illegal input string: ${str}`);
                  }
                  valueStr = str.substring(i + 1, closeParen);
                  i = closeParen + 1;
               } else {
                  if (i >= len || str[i] < '0' || str[i] > '9') {
                     throw new Error(`illegal input string: ${str}`);
                  }
                  valueStr = str[i];
                  i++;
               }

               col.push([parseInt(valueStr, 10), sep]);
            }

            expr.push(col);
            while (i < len && str[i] === ' ') i++;
         }

         return [expr, i];
      }

      const [result, end] = parseExpr(0);
      if (end !== str.length) {
         throw new Error(`illegal input string: ${str}`);
      }
      return result;
   }

   /**
    * @param {vertical} a
    * @param {vertical} b
    * @return {number}
    */
   function vertical_compare(a, b) {
      return lex_compare(a, b, number_compare);
   }

   /**
    * @param {vertical} v
    * @param {separator} s
    * @return {vertical}
    */
   function vertical_increase(v, s) {
      let i = v.length
      while (i > 0 && v[i - 1] < s) --i
      return v.slice(0, i).concat([s])
   }

   /**
    * @param {vertical[]} Vi
    * @param {vertical} v
    * @return {number}
    */
   function find_index_below_row(Vi, v) {
      /**
       * @type {vertical[]}
       */
      const working = [[]].concat(Vi);
      let i1 = 0, i2 = working.length - 1, i;
      while (i1 < i2) {
         i = Math.ceil((i1 + i2) / 2)
         if (vertical_compare(working[i], v) < 0) i1 = i
         else i2 = i - 1
      }
      return i1
   }

   /**
    * @param {expr} m
    * @param {vertical[][]} V
    * @param {[number, number]} pos
    * @return {[number, number]}
    */
   function parent(m, V, [i, j]) {
      const pi = m[i][j][0] - 1;
      const pj = find_index_below_row(V[pi], V[i][j]);
      return [pi, pj]
   }


   /**
    * @param column
    * @return {vertical[]}
    */
   function column_verticals(column) {
      /**
       * @type {vertical[]}
       */
      let v = [[]];
      for (let j = 0; j < column.length; ++j) v.push(vertical_increase(v[j], column[j][1]))
      return v.slice(1)
   }


   /**
    * @param {expr} m
    * @param {vertical[]} rtops
    * @return {number[]}
    */
   function get_references(m, rtops) {
      const verticals = column_verticals(m[m.length - 1]);
      verticals.unshift([])
      let ref = [], i = 0, j = 0;
      while (i < verticals.length && j < rtops.length) {
         if (vertical_compare(verticals[i], rtops[j]) < 0) {
            ref[j] = i
            ++i
         } else {
            ++j
         }
      }
      return ref
   }

   /**
    * @param {expr} m
    * @param {vertical[][]} V
    */
   function fill_ghost_elements(m, V) {
      for (let i = 0; i < m.length; i++) {
         for (let j = 0; j < m[i].length; j++) {
            let [value, sep] = m[i][j];
            if (value === undefined) break;
            let [pi, pj] = parent(m, V, [i, j]);
            let parent_vertical = V[pi][pj - 1] ?? [];
            let current_vertical = V[i][j];
            if (vertical_compare(vertical_increase(parent_vertical, sep), current_vertical) < 0) {
               let ghost_vertical = current_vertical.slice(0, current_vertical.length - 1);
               V[pi].push(ghost_vertical);
               let ghost_separator = ghost_vertical[ghost_vertical.length - 1];
               m[pi].push([undefined, ghost_separator])
            }
         }
      }
   }

   /**
    * @param {expr} m
    */
   function remove_ghost_elements(m) {
      for (let i = 0; i < m.length; i++) {
         for (let j = 0; j < m[i].length; j++) {
            let [value, sep] = m[i][j];
            if (value === undefined || Number.isNaN(value)) {
               m[i].splice(j, m[i].length - j);
               break;
            }
         }
      }
   }

   /**
    * @param {expr} m0
    * @param {number} index
    * @param {boolean} shorter
    * @return {expr}
    */
   function expand(m0, index, shorter = false) {
      const data_key = mountain_display(m0)
      if (shorter) {
         const map_val = data_short.get(data_key + '"' + index)
         if (map_val) return map_val
      } else {
         const map_val = data.get(data_key + '"' + index);
         if (map_val) return map_val
      }

      const rightmost = m0.length - 1
      const topmost = m0[rightmost].length - 1;
      const m = deepcopy(m0)

      if (topmost === -1) {
         m.pop()
         return m
      }

      const tr_entry = m[rightmost][topmost];
      const tr_separator = tr_entry[1];

      const V0 = m.map(column_verticals);
      fill_ghost_elements(m, V0);
      const BRij = parent(m, V0, [rightmost, topmost]);
      const width = rightmost - BRij[0];

      const top_verticals = V0[BRij[0]].slice(0, BRij[1]);
      top_verticals.push(V0[rightmost][topmost])

      if (tr_separator === 0) {
         m[rightmost].pop()
      } else {
         let new_tr_separator = tr_separator - 1
         if (vertical_compare(vertical_increase(V0[BRij[0]][BRij[1] - 1] ?? [], new_tr_separator), V0[rightmost][topmost - 1] ?? []) <= 0)
            m[rightmost].pop()
         else
            m[rightmost][topmost][1] = new_tr_separator
      }
      m[rightmost] = m[rightmost].concat(m[BRij[0]].slice(BRij[1]))

      const V = m.map(column_verticals)
      /**
       * @type {number[][]}
       */
      const magma_checkss = []
      for (let i = BRij[0] + 1; i <= rightmost; ++i) {
         magma_checkss[i] = []
         for (let j = 0; j < m[i].length; ++j) {
            let working = [i, j];
            while (working[0] > BRij[0]) {
               if (m[working[0]].length <= working[1]) --working[1]
               if (m[working[0]][working[1]][0] === undefined) break
               working = parent(m, V, working)
            }
            magma_checkss[i][j] = (
               working[0] === BRij[0] && working[1] <= BRij[1] && !vertical_compare(V[working[0]][working[1] - 1] ?? [], V[i][j - 1] ?? [])
            ) ? working[1] : -1
         }
      }

      for (let n = 1; n <= index; ++n) {
         const refs = get_references(m, top_verticals);
         refs[-1] = -1
         for (let dx = 1; dx <= width; ++dx) {
            const x = BRij[0] + dx;
            const source_magmas = magma_checkss[x];
            /**
             * @type {column}
             */
            const target_column = [];
            m[x].forEach((entry, y) => {
               const value = entry[0];
               if (~source_magmas[y]) {
                  const BRindex = source_magmas[y];
                  for (let j = refs[BRindex - 1] + 1; j <= refs[BRindex]; ++j) {
                     if (j === refs[BRindex]) target_column.push([value + width * n, entry[1]])
                     else target_column.push([value + width * n, m[BRij[0] + width * n][j][1]])
                  }
               } else {
                  target_column.push([value + (value > BRij[0] ? width * n : 0), entry[1]])
               }
            })
            m[x + width * n] = target_column;
         }
      }

      remove_ghost_elements(m);

      if (shorter) m.pop()
      if (shorter) {
         data_short.set(data_key + '"' + index, m)
      } else {
         data.set(data_key + '"' + index, m)
      }
      return m
   }

   /**
    * @param {number} n
    * @param {number} k
    * @return {expr}
    */
   function Limit(n, k) {
      let col = []
      for (let j = 0; j < n; j++) col.push([1, k - 1]);
      return [[], col];
   }

   /**
    * @param {number} k
    */
   function create(k) {
      return {
         id: 'nt-' + k + '-mn',
         name: 'non triangular ' + k + 'MN',
         display: mountain_display,
         display_alter: mountain_display_simple,
         fromDisplay: mountain_fromDisplay,
         fromDisplay_alter: mountain_fromDisplay_simple,
         able: mountain_is_limit,
         compare: mountain_compare,
         FS: (m, index) => {
            if ('' + m === 'Infinity') return Limit(index, k)
            if (m.length === 0) return []
            return expand(m, index, true)
         },
         FSalter: (m, index) => {
            if ('' + m === 'Infinity') return Limit(index, k)
            if (m.length === 0) return []
            return expand(m, index)
         },
         FSShort: (m, index) => {
            if ('' + m === 'Infinity') return Limit(index, k)
            if (m.length === 0) return []
            if (index === 0) return expand(m, 0, true)
            if (index === 1) {
               if (mountain_compare(expand(m, 0, true), expand(m, 0, false)) === 0)
                  return expand(m, 1, true)
               else return expand(m, 0, false)
            }
            if (
               mountain_compare(expand(m, 0, true), expand(m, 0, false)) === 0 ||
               mountain_compare(expand(m, 1, true), expand(m, 0, false)) === 0
            ) return expand(m, index, true)
            return expand(m, index - 1, true)
         },
         init: () => ([
            {expr: [[Infinity]], low: [[]], subitems: []}
            , {expr: [], low: [[]], subitems: []}
         ]),
         column_verticals,
         find_index_below_row,
         parent,
         mountain_display,
         expand,
         column_compare
      }
   }

   register.push(create(1), create(2), create(3))
})()