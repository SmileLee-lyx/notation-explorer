;(()=>{
   var data=new Map()
   ,datashort=new Map()
   ,entry_compare = (a,b)=>{//each entry = [value,separator] where separator is mountain
      if(a[0]<b[0]) return -1
      if(a[0]>b[0]) return 1
      return mountain_compare(a[1],b[1])
   }
   ,column_compare = (a,b)=>{//each column = [entry,entry,...,entry]
      var i=0,c
      while(true){
         if(i>=a.length){
            if(i>=b.length) return 0
            return -1
         }
         if(i>=b.length) return 1
         c = entry_compare(a[i],b[i])
         if(c) return c
         ++i
      }
   }
   ,mountain_compare = (a,b)=>{//each mountain = [column,column,...,column]
      var i=0,c
      while(true){
         if(i>=a.length){
            if(i>=b.length) return 0
            return -1
         }
         if(i>=b.length) return 1
         c = column_compare(a[i],b[i])
         if(c) return c
         ++i
      }
   }
   ,mountain_is_limit = m=> m.length>0 && m[m.length-1].length>0
   ,mountain_is_one = m=> m.length===1 && m[0].length===0
   ,mountain_display = m=>m.map(column=>'('+column.map(([v,sep])=>{
      if(sep.every(column=>!column.length)) return ','.repeat(sep.length)+v
      return mountain_display(sep)+v
   }).join('')+')').join('')
   ,mountain_display_simple = m=> {
      return m.map(column => {
         if (column.length === 0) return '0'
         return column.map(([v, sep]) => {
            let v_rep = v >= 10 ? '(' + v + ')' : v.toString()
            let sep_rep
            if (sep.every(column=>!column.length)) {
               if (sep.length === 1) sep_rep = ''
               else sep_rep = ','.repeat(sep.length)
            } else sep_rep = '[' + mountain_display_simple(sep) + ']'
            return sep_rep + v_rep
         }).join('')
      }).join(' ')
   }
   ,mountain_fromDisplay = (str) => {
      if (typeof str !== 'string') {
         throw new Error(`illegal input string: ${str}`);
      }

      function findMatchingParen(s, start) {
         let count = 1;
         let i = start + 1;
         while (i < s.length) {
            if (s[i] === '(') count++;
            else if (s[i] === ')') {
               count--;
               if (count === 0) return i;
            }
            i++;
         }
         throw new Error(`illegal input string: ${str}`);
      }

      function parseExprPrefix(s, start, isSepContext) {
         if (start >= s.length) return [[], start];

         if (isSepContext && s[start] === ',') {
            let commaCount = 0;
            while (start + commaCount < s.length && s[start + commaCount] === ',') {
               commaCount++;
            }
            const expr = [];
            for (let i = 0; i < commaCount; i++) {
               expr.push([]);
            }
            return [expr, start + commaCount];
         }

         const cols = [];
         let i = start;
         while (i < s.length && s[i] === '(') {
            const j = findMatchingParen(s, i);
            const colContent = s.substring(i + 1, j);

            const terms = [];
            let idx = 0;
            while (idx < colContent.length) {
               const [sep, nextIdx] = parseExprPrefix(colContent, idx, true);
               idx = nextIdx;

               let valueStr = '';
               while (idx < colContent.length && colContent[idx] >= '0' && colContent[idx] <= '9') {
                  valueStr += colContent[idx];
                  idx++;
               }
               if (valueStr === '') {
                  throw new Error(`illegal input string: ${str}`);
               }
               terms.push([parseInt(valueStr, 10), sep]);
            }

            cols.push(terms);
            i = j + 1;
         }

         return [cols, i];
      }

      const [result, end] = parseExprPrefix(str, 0, false);
      if (end !== str.length) {
         throw new Error(`illegal input string: ${str}`);
      }
      return result;
   }
   ,mountain_fromDisplay_simple = (str) => {
      if (typeof str !== 'string') {
         throw new Error(`illegal input string: ${str}`);
      }

      str = str.trim();
      if (str === '') return [];

      function parseExpr(s, start) {
         const cols = [];
         let i = start;
         const len = s.length;

         while (i < len && s[i] === ' ') i++;

         while (i < len && s[i] !== ']') {
            if (s[i] === ' ') {
               i++;
               continue;
            }

            if (s[i] === '0') {
               cols.push([]);
               i++;
               continue;
            }

            const terms = [];
            while (i < len && s[i] !== ' ' && s[i] !== ']') {
               let sep;

               if (s[i] === '[') {
                  const [sepExpr, nextI] = parseExpr(s, i + 1);
                  if (nextI >= len || s[nextI] !== ']') {
                     throw new Error(`illegal input string: ${str}`);
                  }
                  sep = sepExpr;
                  i = nextI + 1;
               } else if (s[i] === ',') {
                  let commaCount = 0;
                  while (i < len && s[i] === ',') {
                     commaCount++;
                     i++;
                  }
                  sep = [];
                  for (let t = 0; t < commaCount; t++) {
                     sep.push([]);
                  }
               } else {
                  sep = [[]];
               }

               let valueStr = '';
               if (i < len && s[i] === '(') {
                  const closeParen = s.indexOf(')', i);
                  if (closeParen === -1) {
                     throw new Error(`illegal input string: ${str}`);
                  }
                  valueStr = s.substring(i + 1, closeParen);
                  i = closeParen + 1;
               } else {
                  if (i >= len || s[i] < '0' || s[i] > '9') {
                     throw new Error(`illegal input string: ${str}`);
                  }
                  valueStr = s[i];
                  i++;
               }

               terms.push([parseInt(valueStr, 10), sep]);
            }

            cols.push(terms);
            while (i < len && s[i] === ' ') i++;
         }

         return [cols, i];
      }

      const [result, end] = parseExpr(str, 0);
      if (end !== str.length) {
         throw new Error(`illegal input string: ${str}`);
      }
      return result;
   }
   ,vertical_compare = (a,b)=>{//each vertical = [separator,separator,...,separator]
      var i=0,c
      while(true){
         if(i>=a.length){
            if(i>=b.length) return 0
            return -1
         }
         if(i>=b.length) return 1
         c = mountain_compare(a[i],b[i])
         if(c) return c
         ++i
      }
   }
   ,vertical_increase = (v,m)=>{
      var i=v.length-1
      while(i>=0&&mountain_compare(v[i],m)<0) --i
      return v.slice(0,i+1).concat([m])
   }
   //an entry [value,separator] means a pair of left-leg + right-leg
   ,find_index_below_row = (verticals,y)=>{
      var working = [[]].concat(verticals)
      var i1=0,i2=working.length-1,i
      while(i1<i2){
         i=Math.ceil((i1+i2)/2)
         if(vertical_compare(working[i],y)<0) i1=i
         else i2=i-1
      }
      return i1
   }
   ,parent = (A,verticalss,[i,j])=>{
      var targetcolumn = A[i][j][0]-1
      var targeti = find_index_below_row(verticalss[targetcolumn],verticalss[i][j])
      return [targetcolumn,targeti]
   }
   ,column_verticals = column=>{
      var v=[[]]
      for(var j=0;j<column.length;++j) v.push(vertical_increase(v[j],column[j][1]))
      return v.slice(1)
   }
   ,get_references = (A,rtops)=>{
      var verticals = column_verticals(A[A.length-1])
      verticals.unshift([])
      var ref=[],i=0,j=0
      while(i<verticals.length&&j<rtops.length){
         if(vertical_compare(verticals[i],rtops[j])<0){
            ref[j] = i
            ++i
         }else{
            ++j
         }
      }
      return ref
   }
   ,threshold = (A,shorter,low,high)=>{
      var res,n=0
      while(true){
         res = expand(A,n,shorter)
         if(vertical_compare(vertical_increase(low,res),vertical_increase(high,res))>=0) return n
         n++
      }
   }
   ,expand = (A0,FSterm,shorter=false)=>{
      var datakey = mountain_display(A0)
      if(shorter){
         var mapval = datashort.get(datakey+'"'+FSterm)
         if(mapval) return mapval
      }else{
         var mapval = data.get(datakey+'"'+FSterm)
         if(mapval) return mapval
      }

      var rightmost = A0.length-1
      var topmost = A0[rightmost].length-1
      var A = JSON.parse(JSON.stringify(A0))

      if (topmost === -1) {
         A.pop()
         return A
      }

      var topright_entry = A[rightmost][topmost]
      var topright_separator = topright_entry[1]

      var V0 = A.map(column_verticals)
      var BRij = parent(A,V0,[rightmost,topmost])
      var width = rightmost - BRij[0]

      if(mountain_is_limit(topright_separator)){
         A[rightmost][topmost][1] = expand(topright_separator,
            threshold(topright_separator,shorter,V0[BRij[0]][BRij[1]-1]??[],V0[rightmost][topmost-1]??[])+FSterm
         ,shorter)
         return A
      }

      var topverticals = V0[BRij[0]].slice(0,BRij[1])
      topverticals.push(V0[rightmost][topmost])

      if(mountain_is_one(topright_separator)) A[rightmost].pop()
      else{
         topright_separator = topright_separator.slice(0,-1)
         if(vertical_compare(vertical_increase(V0[BRij[0]][BRij[1]-1]??[],topright_separator),V0[rightmost][topmost-1]??[])<=0)
            A[rightmost].pop()
         else
            A[rightmost][topmost][1] = topright_separator
      }
      A[rightmost] = A[rightmost].concat(A[BRij[0]].slice(BRij[1]))

      var V = A.map(column_verticals)
      var magma_checkss = []
      for(var i=BRij[0]+1;i<=rightmost;++i){
         magma_checkss[i] = []
         for(var j=0;j<A[i].length;++j){
            var working = [i,j]
            while(working[0]>BRij[0]){
               if(A[working[0]].length<=working[1]) --working[1]
               working = parent(A,V,working)
            }
            magma_checkss[i][j] = (
               working[0]===BRij[0] && working[1]<=BRij[1] && !vertical_compare(V[working[0]][working[1]-1]??[],V[i][j-1]??[])
            ) ? working[1] : -1
         }
      }

      for(var n=1;n<=FSterm;++n){
         var refs = get_references(A,topverticals)
         refs[-1] = -1
         for(var dx=1;dx<=width;++dx){
            var x = BRij[0]+dx
            var source_magmas = magma_checkss[x]
            var target_column = A[x+width*n] = []
            A[x].forEach((entry,y)=>{
               var value = entry[0]
               if(~source_magmas[y]){
                  var BRindex = source_magmas[y]
                  for(var j=refs[BRindex-1]+1;j<=refs[BRindex];++j){
                     if(j===refs[BRindex]) target_column.push([value+width*n,entry[1]])
                     else target_column.push([value+width*n,A[BRij[0]+width*n][j][1]])
                  }
               }else{
                  target_column.push([value + (value>BRij[0] ? width*n :0) ,entry[1]])
               }
            })
         }
      }

      if(shorter) A.pop()
      if(shorter){
         datashort.set(datakey+'"'+FSterm,A)
      }else{
         data.set(datakey+'"'+FSterm,A)
      }
      return A
   }
   ,Limit = n=>n>0?[[],[[1,Limit(n-1)]]]:[[]]

   let core
   register.push(core = {
      id:'t-omega-mn'
      ,name:'Transfinite ω mountain notation'
      ,display:expr=>''+expr==='Infinity'?'Limit':mountain_display(expr)
      ,display_alter:expr=>''+expr==='Infinity'?'Limit':mountain_display_simple(expr)
      ,fromDisplay:str=>str==='Limit'?Infinity:mountain_fromDisplay(str)
      ,fromDisplay_alter:str=>str==='Limit'?Infinity:mountain_fromDisplay_simple(str)
      ,able:mountain_is_limit
      ,compare:mountain_compare
      ,FS:(m,FSterm)=>{
         if(''+m==='Infinity') return Limit(FSterm)
         if(m.length===0) return []
         return expand(m,FSterm,true)
      }
      ,FSalter:(m,FSterm)=>{
         if(''+m==='Infinity') return Limit(FSterm)
         if(m.length===0) return []
         return expand(m,FSterm)
      }
      ,FSShort:(m,FSterm)=> {
         if(''+m==='Infinity') return Limit(FSterm)
         if(m.length === 0) return []
         if (FSterm === 0) return expand(m,0,true)
         if (FSterm === 1) {
            if(mountain_compare(expand(m,0,true), expand(m,0,false)) === 0)
               return expand(m,1,true)
            else return expand(m,0,false)
         }
         if(
            mountain_compare(expand(m,0,true), expand(m,0,false)) === 0 ||
            mountain_compare(expand(m,1,true), expand(m,0,false)) === 0
         ) return expand(m,FSterm,true)
         return expand(m,FSterm-1,true)
      }
      ,init:()=>([
         {expr:[[Infinity]],low:[[]],subitems:[]}
         ,{expr:[],low:[[]],subitems:[]}
      ])
      ,column_verticals
      ,find_index_below_row
      ,parent
      ,mountain_display
      ,expand
      ,column_compare
   })
   analysis_register.push({
      id:'t-omega-mn',
      name:'TωMN',
      FS:core.FS,
      display:core.display,
      fromDisplay:core.fromDisplay,
      fs_default:1,
   }, {
      id:'t-omega-mn-simple',
      name:'TωMN (Simple)',
      FS:core.FS,
      display:core.display_alter,
      fromDisplay:core.fromDisplay_alter,
      fs_default:1,
   }, )
})()