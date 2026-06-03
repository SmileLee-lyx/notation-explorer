// code by hypcos
(()=>{
   let wa_omega2_mn

   function waw2mn() {
      if (!wa_omega2_mn) {
         wa_omega2_mn = register.find(n => n.id === 'wa-omega2-mn')
      }
      return wa_omega2_mn
   }

   function calcAncestorDepths(mountain) {
      if(!Array.isArray(mountain) || mountain.length === 0) return []
      const verticalss = mountain.map(waw2mn().column_verticals)
      const depthMap = Array.from({ length: mountain.length }, () => [])
      const visited = new Set()
      function getDepth(i, j) {
         const key = `${i},${j}`
         if(visited.has(key)) return 0
         visited.add(key)
         const [pCol, pRow] = waw2mn().Parent(mountain, verticalss, [i, j])
         if(
            pCol < 0 || pCol >= mountain.length ||
            pRow < 0 || pRow >= mountain[pCol].length
         ) {
            visited.delete(key)
            return 0
         }
         const depth = 1 + getDepth(pCol, pRow)
         visited.delete(key)
         return depth
      }
      for(let i = 0; i < mountain.length; i++) {
         const column = mountain[i]
         for(let j = 0; j < column.length; j++) {
            depthMap[i][j] = getDepth(i, j)
         }
      }
      return depthMap
   }

   function convertToWDMN(originalMountain) {
      if(!Array.isArray(originalMountain)) return []
      const depthMap = calcAncestorDepths(originalMountain)
      const wdmnMountain = JSON.parse(JSON.stringify(originalMountain))
      for(let i = 0; i < wdmnMountain.length; i++) {
         const column = wdmnMountain[i]
         for(let j = 0; j < column.length; j++) {
            const entry = column[j]
            entry[0] = depthMap[i][j] + 1
            if(Array.isArray(entry[1]) && entry[1].length > 0) {
               entry[1] = convertToWDMN(entry[1])
            }
         }
      }
      return wdmnMountain
   }

   function mountain_display(m) {
      if(''+m==='Infinity') return 'Limit'
      return waw2mn().display(convertToWDMN(m))
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

      let wmnCore = waw2mn();
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
                  [i1, j1] = wmnCore.Parent(wmnMountain, verticalss, [i1, j1]);
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

   function mountain_from_display(str) {
      return convertFromWDMN(waw2mn().fromDisplay(str, true))
   }

   register.push({
      id:'wa-omega2-dmn'
      ,name:'Weak Astral ω·2 DMN'
      ,display: mountain_display
      ,fromDisplay:mountain_from_display
      ,able: (m) => waw2mn().able(m)
      ,compare: (a, b) => waw2mn().compare(a, b)
      ,FS:(m,FSterm)=> waw2mn().FS(m,FSterm)
      ,FSalter:(m,FSterm)=> waw2mn().FSalter(m,FSterm)
      ,FSShort:(m,FSterm)=> waw2mn().FSShort(m,FSterm)
      ,init:()=> waw2mn().init()
   })
})()