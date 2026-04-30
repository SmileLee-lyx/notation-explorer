;(() => {
   let t_omega_mn

   function wmn() {
      if (!t_omega_mn) {
         t_omega_mn = register.find(n => n.id === 't-omega-mn')
      }
      return t_omega_mn
   }

   function calcAncestorDepths(mountain) {
      let wmnCore = wmn()

      if (!Array.isArray(mountain) || mountain.length === 0) return [];
      const verticalss = mountain.map(wmnCore.column_verticals);
      const depthMap = Array.from({length: mountain.length}, () => []);
      const visited = new Set();

      function getDepth(i, j) {
         const key = `${i},${j}`;
         if (visited.has(key)) return 0;
         visited.add(key);
         const [pCol, pRow] = wmnCore.parent(mountain, verticalss, [i, j]);
         if (
            pCol < 0 || pCol >= mountain.length ||
            pRow < 0 || pRow >= mountain[pCol].length
         ) {
            visited.delete(key);
            return 0;
         }
         const depth = 1 + getDepth(pCol, pRow);
         visited.delete(key);
         return depth;
      }

      for (let i = 0; i < mountain.length; i++) {
         const column = mountain[i];
         for (let j = 0; j < column.length; j++) {
            depthMap[i][j] = getDepth(i, j);
         }
      }
      return depthMap;
   }

   function convertToWDMN(originalMountain) {
      if (!Array.isArray(originalMountain)) return originalMountain;
      const depthMap = calcAncestorDepths(originalMountain);
      const wdmnMountain = JSON.parse(JSON.stringify(originalMountain));
      for (let i = 0; i < wdmnMountain.length; i++) {
         const column = wdmnMountain[i];
         for (let j = 0; j < column.length; j++) {
            const entry = column[j];
            entry[0] = depthMap[i][j] + 1;
            if (Array.isArray(entry[1]) && entry[1].length > 0) {
               entry[1] = convertToWDMN(entry[1]);
            }
         }
      }
      return wdmnMountain;
   }

   function convertFromWDMN(dMountain) {
      const wmnMountain = JSON.parse(JSON.stringify(dMountain));
      for (let i = 0; i < wmnMountain.length; i++) {
         const column = wmnMountain[i];
         for (let j = 0; j < column.length; j++) {
            const entry = column[j];
            if (Array.isArray(entry[1]) && entry[1].length > 0) {
               entry[1] = convertFromWDMN(entry[1]);
            }
         }
      }

      let wmnCore = wmn();
      let verticalss = wmnMountain.map(wmnCore.column_verticals);
      for (let i = 0; i < wmnMountain.length; i++) {
         const column = wmnMountain[i];
         for (let j = 0; j < column.length; j++) {
            const entry = column[j];

            let i1 = i, j1 = j - 1;
            while (true) {
               if (i1 === 0) {
                  entry[0] = 1;
                  break;
               }
               if (j1 >= 0) {
                  [i1, j1] = wmnCore.parent(wmnMountain, verticalss, [i1, j1]);
               } else {
                  i1 = i1 - 1;
               }
               let j0 = wmnCore.find_index_below_row(verticalss[i1], j === 0 ? [[[]]] : verticalss[i][j-1].concat([[[]]]));
               if (j0 === dMountain[i1].length || dMountain[i1][j0][0] < entry[0]) {
                  entry[0] = i1 + 1;
                  break;
               }
            }
         }
      }

      return wmnMountain;
   }

   let core

   register.push(core = {
      id: 't-omega-dmn',
      name: 'TωDMN',
      display: expr => '' + expr === 'Infinity' ? 'Limit' : wmn().display(convertToWDMN(expr)),
      display_alter: expr => '' + expr === 'Infinity' ? 'Limit' : wmn().display_alter(convertToWDMN(expr)),
      fromDisplay: str => str === 'Limit' ? Infinity : convertFromWDMN(wmn().fromDisplay(str)),
      fromDisplay_alter: str => str === 'Limit' ? Infinity : convertFromWDMN(wmn().fromDisplay_alter(str)),
      able: (a) => wmn().able(a),
      compare: (a, b) => wmn().compare(a, b),
      FS: (m, FSterm) => wmn().FS(m, FSterm),
      FSalter: (m, FSterm) => wmn().FSalter(m, FSterm),
      FSShort: (m, FSterm) => wmn().FSShort(m, FSterm),
      init: () => wmn().init()
   })
   analysis_register.push({
      id:'t-omega-mn',
      name:'TωDMN',
      FS:core.FS,
      display:core.display,
      fromDisplay:core.fromDisplay,
      fs_default:1,
   }, {
      id:'t-omega-mn-simple',
      name:'TωDMN (Simple)',
      FS:core.FS,
      display:core.display_alter,
      fromDisplay:core.fromDisplay_alter,
      fs_default:1,
   }, )
})()