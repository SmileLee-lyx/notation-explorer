// code by hypcos
(()=>{
   var entry_compare = (a,b)=>{
      if(a[0]<b[0]) return -1
      if(a[0]>b[0]) return 1
      return mountain_compare(a[1],b[1])
   }
   ,column_compare = (a,b)=>{
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
   ,mountain_compare = (a,b)=>{
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
   ,mountain_display = m=>{
      if ('' + m === 'Infinity') return "Limit";
      return m.map(column=>'('+column.map(entry=>{
         var v=entry[0],sep=entry[1],star=entry[2]?'*':''
         if(sep.every(column=>!column.length)) return ','.repeat(sep.length)+star+v
         if(
            mountain_display(sep.slice(0,2))===mountain_display([[],[[1,[[]]]]])
            &&sep.slice(2).every(column=>!column.length)
         )
            return ';'+','.repeat(sep.length-2)+star+v
         return mountain_display(sep)+star+v
      }).join('')+')').join('')
   }
   ,omega_pow_to_mountain = (arr, is_layer = false) => {
      let result = []
      for (let i = arr.length - 1; i >= 0; i--) {
         for (let j = 0; j < arr[i]; j++) {
            result.push([]);
            let target_v = is_layer ? 1 : result.length;
            for (let k = 0; k < i; k++) {
               result.push([[target_v, [[]]]]);
            }
         }
      }
      return result;
   }
   ,mountain_fromDisplay = (str, is_layer = false) => {
      if (typeof str !== 'string') {
         throw new Error(`illegal input string: ${str}`);
      }

      str = str.trim();
      if (str === '') return [];

      function parseSimpleSep(start) {
         let c0 = 0, c1 = 0, c2 = 0;
         while (start + c2 < str.length && str[start + c2] === '\'') {
            c2++;
         }
         while (start + c2 + c1 < str.length && str[start + c2 + c1] === ';') {
            c1++;
         }
         while (start + c2 + c1 + c0 < str.length && str[start + c2 + c1 + c0] === ',') {
            c0++;
         }
         return [omega_pow_to_mountain([c0, c1, c2], is_layer), start + c2 + c1 + c0];
      }

      function parseExpr(start) {
         const cols = [];
         let i = start;
         const len = str.length;

         while (i < len) {
            if (str[i] !== '(') throw new Error(`illegal input string: ${str}`);
            i++;

            const terms = [];
            while (i < len && str[i] !== ')') {
               let [sep, nextI] = parseSimpleSep(i);
               i = nextI;

               let valueStr = '';
               let currentI = i;
               while (i < len && str[i] >= '0' && str[i] <= '9') i++;
               valueStr = str.substring(currentI, i);

               terms.push([parseInt(valueStr, 10), sep]);
            }

            if (i === len || str[i] !== ')') throw new Error(`illegal input string: ${str}`);
            i++;
            cols.push(terms);
         }

         return [cols, i];
      }

      const [result, end] = parseExpr(0);
      if (end !== str.length) {
         throw new Error(`illegal input string: ${str}`);
      }
      return result;
   }
   ,vertical_compare = (a,b)=>{
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
   ,Parent = (A,verticalss,[i,j])=>{
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
   ,S = (A,i,j)=> A[i]?.[j]?.[2] ? S(A,i,j-1) : A[i]?.[j]?.[1]??[]
   ,subtract1 = (A0,V)=>{
      var rightmost = A0.length-1
      var topmost = A0[rightmost].length-1
      var A = JSON.parse(JSON.stringify(A0))
      var topright_separator = A[rightmost][topmost][1]
      var BRij = Parent(A,V,[rightmost,topmost])
      if(mountain_is_one(topright_separator)) A[rightmost].pop()
      else if(mountain_is_limit(topright_separator)){
         var BRseparator = S(A,BRij[0],BRij[1]-1)
            ,J = mountain_compare(BRseparator,topright_separator)>=0 ? [[]] : BRseparator.concat([[]])
         if(vertical_compare(vertical_increase(V[BRij[0]][BRij[1]-1]??[],J),V[rightmost][topmost-1]??[])<=0)
            A[rightmost].pop()
         else
            A[rightmost][topmost][1] = J
      }else{
         topright_separator = topright_separator.slice(0,-1)
         if(vertical_compare(vertical_increase(V[BRij[0]][BRij[1]-1]??[],topright_separator),V[rightmost][topmost-1]??[])<=0)
            A[rightmost].pop()
         else
            A[rightmost][topmost][1] = topright_separator
      }
      A[rightmost] = A[rightmost].concat(A[BRij[0]].slice(BRij[1]))
      return A
   }
   ,extend = (A0)=>{
      var rightmost = A0.length-1
      var topmost = A0[rightmost].length-1
      var V0 = A0.map(column_verticals)
      var top_vertical = V0[rightmost][topmost]
      var BRij = Parent(A0,V0,[rightmost,topmost])
      var top_separators = A0[BRij[0]].slice(0,BRij[1]).map(entry=>entry[1])
      top_separators.push(A0[rightmost][topmost][1])
      var topverticals = V0[BRij[0]].slice(0,BRij[1])
      topverticals.push(V0[rightmost][topmost])
      var width = rightmost - BRij[0]
      var magma_checkss = []
      for(var i=BRij[0]+1;i<=rightmost;++i){
         magma_checkss[i] = []
         for(var j=0;j<A0[i].length;++j){
            var working = [i,j]
            while(working[0]>BRij[0]){
               if(A0[working[0]].length<=working[1]) --working[1]
               working = Parent(A0,V0,working)
            }
            magma_checkss[i][j] = (
               working[0]===BRij[0] && working[1]<=BRij[1] && !vertical_compare(V0[working[0]][working[1]-1]??[],V0[i][j-1]??[])
            ) ? working[1] : -1
         }
      }
      var A = subtract1(A0,V0)
      var refs = get_references(A,topverticals)
      refs[-1] = -1
      var stretch_threshold=[],stretch_value=[]
      for(i=0;i<top_separators.length;++i){
         if(!mountain_is_limit(top_separators[i])){
            stretch_value[i]=0
            continue
         }
         if(mountain_compare(S(A0,BRij[0],i-1),top_separators[i])>=0){
            stretch_threshold[i]=[[]]
         }else{
            stretch_threshold[i]=S(A0,BRij[0],i-1).concat([[]])
         }
         for(j=refs[i],stretch_value[i]=0;j-1>refs[i-1];--j){
            var M = A[rightmost][j-1]?.[1]??[]
            if(mountain_compare(M,stretch_threshold[i])<0) A[rightmost][j-1]&&(A[rightmost][j-1][2] = true)
            else if(mountain_compare(M,top_separators[i])<0){
               stretch_value[i]=M.length-stretch_threshold[i].length+1
               break
            }
         }
      }
      for(var dx=1;dx<=width;++dx){
         var x = BRij[0]+dx
         var source_magmas = magma_checkss[x]
         var target_column = A[x+width] = []
         var BRindex = -1
         A0[x].forEach((entry,y)=>{
            var value = entry[0]
            var current_vertical = V0[x][y]
            var noStretch = vertical_compare(current_vertical, top_vertical) >= 0
            if(~source_magmas[y]){
               BRindex = source_magmas[y]
               for(var j=refs[BRindex-1]+1;j<=refs[BRindex];++j){
                  if(j===refs[BRindex])
                     target_column.push([
                        value+width,
                        !stretch_value[BRindex]||
                        mountain_compare(entry[1],top_separators[BRindex])>=0||
                        mountain_compare(entry[1],stretch_threshold[BRindex])<0||
                        noStretch ?
                           entry[1] :
                           entry[1].concat(Array(stretch_value[BRindex]).fill([]))
                        ,entry[2]
                     ])
                  else target_column.push([value+width,A[BRij[0]+width][j][1],A[BRij[0]+width][j][2]])
               }
            }else{
               target_column.push([
                  value + (value>BRij[0] ? width :0),
                  !stretch_value[BRindex]||
                  mountain_compare(entry[1],top_separators[BRindex])>=0||
                  mountain_compare(entry[1],stretch_threshold[BRindex])<0||
                  noStretch ?
                     entry[1] :
                     entry[1].concat(Array(stretch_value[BRindex]).fill([]))
                  ,entry[2]
               ])
            }
         })
      }
      return A
   }
   ,expand = (A0,FSterm,shorter=false)=>{
      for(var A=A0,n=1;n<=FSterm;++n) A = extend(A)
      return shorter ? A.slice(0,-1) : subtract1(A,A.map(column_verticals))
   }
   ,Limit = n=>[[],[[1,[[],[[1,[[]]]]].concat(Array(n).fill(0).map(()=>[]))]]]
   register.push({
      id:'wa-omega2-mn'
      ,name:'Weak Astral ω·2 MN'
      ,display:mountain_display
      ,fromDisplay:mountain_fromDisplay
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
      ,Parent
      ,mountain_display
      ,expand
      ,column_compare
   })
})()