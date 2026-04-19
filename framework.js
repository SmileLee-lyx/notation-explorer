;

function define_parent(child, parent) {
   Object.defineProperty(child, 'parent', {
      get() { return parent; },
      enumerable: false,
   })
}

const init_dataset = (notation) => {
   let root_item = {
      is_root: true, mark: 0
   }
   root_item.subitems = notation.init().map(
      (item, index) => {
         let node = {
            expr: item.expr,
            bound: item.low[0],
            subitems: [],
            node: undefined,
            mark: null,
            index,
            analysis: undefined
         };
         define_parent(node, root_item)
         return node
      }
   );
   return root_item
}

const app = Vue.createApp({
   data:()=>({
      current_tab:0,
      FS_shown:register.map(()=>3),
      tier:register.map(()=>0),
      length_limit:20,
      datasets:register.map(init_dataset),
      xCanvas:0,
      yCanvas:0,
      showCanvas:false,
      diagram_follow:false,
      use_alternative:true,
   }),
   computed:{
      current_notation() { return register[this.current_tab].id },
      tab_names:()=> register.map(notation=>notation.name),
      tiername(){
         var n = this.tier[this.current_tab]
         if(0<=n&&n<=8) return ['small','single','double','triple','quadruple','quintuple','sextuple','septuple','octuple'][n]+' expansion'
         return n+'-fold expansion'
      },
   },
   methods:{
      incrFS(){
         this.FS_shown.splice(this.current_tab,1,this.FS_shown[this.current_tab]+1)
      },
      decrFS(){
         this.FS_shown.splice(this.current_tab,1,Math.max(this.FS_shown[this.current_tab]-1,0))
      },
      incr_extra(){
         this.extra_FS.splice(this.current_tab,1,this.extra_FS[this.current_tab]+1)
      },
      decr_extra(){
         this.extra_FS.splice(this.current_tab,1,Math.max(this.extra_FS[this.current_tab]-1,0))
      },
      incr_tier(){
         this.tier.splice(this.current_tab,1,this.tier[this.current_tab]+1)
      },
      decr_tier(){
         this.tier.splice(this.current_tab,1,Math.max(this.tier[this.current_tab]-1,0))
      },
      reset_list(){
         this.datasets.splice(this.current_tab,1, init_dataset(register[this.current_tab]))
      },
      export_xlsx() {
         let result = [];

         let find_result = (node) => {
            for (let i = node.subitems.length - 1; i >= 0; i--) {
               let child = node.subitems[i];
               find_result(child)
            }

            let text = node.analysis
            if (text !== undefined) {
               result.push([register[root.current_tab].display(node.expr), text])
            }
         }

         find_result(root.datasets[root.current_tab])

         const worksheet = XLSX.utils.aoa_to_sheet(result);

         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, worksheet, "1");

         XLSX.writeFile(workbook, "output.xlsx");
      },
      import_xlsx() {
         let file_input = this.$refs.file_input;
         file_input.click()
      },
      handle_import_file(event) {
         const notation = register[this.current_tab]
         let fromDisplay = notation.fromDisplay
         if (!fromDisplay) return;

         let file = event.target.files[0];
         if (!file) return;

         const reader = new FileReader();

         reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            if (!rows) {
               return;
            }

            const objects = [];
            for (let i = 0; i < rows.length; i++) {
               const row = rows[i];
               if (row && row.length >= 2) {
                  let expr_str = row[0] || '';
                  let analysis = row[1] || '';
                  if (!analysis.length) continue
                  let expr
                  try {
                     expr = fromDisplay(expr_str);
                  } catch (e) {
                     continue
                  }
                  objects.push([expr, analysis]);
               }
            }

            import_analysis(root.datasets[root.current_tab], objects, notation, root.use_alternative)
         };

         reader.onerror = function() {
         };

         reader.readAsArrayBuffer(file);

         event.target.value = '';
      },
      find_notation() {
         let notation = register[this.current_tab]
         if (!notation.fromDisplay) return
         let displayed_expr = this.$refs.navigate_input.value
         let expr = notation.fromDisplay(displayed_expr)
         import_analysis(this.datasets[this.current_tab], [[expr]], notation, this.use_alternative, true)
      }
   },
   mounted() {
      canvas = document.getElementById('hoverCanvas');
      const offscreen = canvas.transferControlToOffscreen()

      worker.postMessage({
         type: "init",
         canvas: offscreen
      }, [offscreen])
   }
})

function import_analysis(root_item, analysis_list, notation, use_short, auto_focus = false) {
   let item = last_child(root_item)
   let index = 0
   let cmp

   while (index < analysis_list.length) {
      let flag = false
      while ((cmp = notation.compare(item.expr, analysis_list[index][0])) !== 0) {
         if (cmp > 0) {
            if (item.mark > root.length_limit) return
            expand_item(item, notation, use_short, 0)
            item = find_next(item)
         } else {
            item = find_prev(item)
         }
      }

      if (analysis_list[index][1] !== undefined) item.analysis = analysis_list[index][1]

      if (index === 0 && auto_focus) {
         if (item.node) item.node.$refs.input.focus(); else item.auto_focus = true;
      }

      ++index
   }
}

function expand_item(item, notation, use_short, max_tier, auto_focus) {
   const FS = get_FS(notation, use_short)

   const generateFS = (item) => {
      if (item.fs_index !== undefined) {
         item.fs_index++
         return FS(item.expr, item.fs_index)
      }
      let fs_index = 0, res
      while(true){
         res = FS(item.expr, fs_index)
         if (notation.compare(res, item.bound) > 0) {
            item.fs_index = fs_index
            return res
         }
         fs_index++
      }
   }

   const expand_tier = (tier, item, to_parent, af = false)=> {
      let result_expr
      if (notation.able(item.expr)) {
         result_expr = generateFS(item)
      } else {
         result_expr = FS(item.expr, 0)
         if (notation.compare(result_expr, item.bound) <= 0) return;
      }

      let new_bound
      if (item.subitems.length > 0) {
         new_bound = item.subitems[0].expr
      } else if (to_parent) {
         new_bound = item.bound
      } else {
         if (item.parent) {
            new_bound = item.parent.subitems[item.parent.mark + item.index + 1].expr
         } else {
            new_bound = root.datasets[root.current_tab][item.index + 1].expr
         }
      }

      let new_index
      if (to_parent) {
         new_index = item.index + 1
      } else {
         if (item.subitems.length > 0) {
            new_index = item.subitems[0].index - 1
         } else {
            new_index = 0
         }
      }

      const new_item={
         expr: result_expr,
         bound: new_bound,
         subitems: [],
         mark: null,
         index: new_index,
         auto_focus: af
      }
      define_parent(new_item, to_parent ? item.parent : item)
      if (to_parent)
         item.parent.subitems.splice(item.parent.subitems.length, 0, new_item)
      else {
         item.subitems.splice(0, 0, new_item)
         item.mark = item.mark != null ? item.mark + 1 : 0
      }
      if (tier > 0) {
         let new_to_parent = to_parent || item.subitems.length === 1
         expand_tier(tier, new_item, new_to_parent)
         if (tier > 1) {
            if (new_item.subitems.length > 0) {
               expand_tier(tier - 1, new_item.subitems[new_item.subitems.length - 1], true)
            } else {
               expand_tier(tier - 1, new_item, false)
            }
         }
      }
   }

   expand_tier(max_tier, item, !item.parent.is_root && item.index + item.parent.mark === item.parent.subitems.length - 1, auto_focus)
}

const get_FS = (notation, use_short) => {
   if (use_short) return notation.FSShort || notation.FSalter || notation.FS
   return notation.FS
}

let last_child = (node) => {
   if (node.hide_child || node.subitems.length === 0) return node
   let ref = node.subitems[node.subitems.length - 1];
   return last_child(ref)
}
let next_sibling = (node) => {
   if (node.is_root) return undefined
   let parent = node.parent
   if (node.index + node.parent.mark !== parent.subitems.length - 1) {
      return parent.subitems[node.index + node.parent.mark + 1]
   }
   return next_sibling(parent)
}
let find_next = (node, quick_level=0) => {
   if (quick_level >= 4) {
      let next = find_next(node, quick_level - 4)
      while (next && next.analysis === undefined) next = find_next(next, quick_level - 4)
      return next
   }

   if (node.is_root) return last_child(node)
   if (quick_level >= 2) {
      let parent = node.parent
      if (!parent.is_root) {
         let uncle = next_sibling(parent)
         if (uncle) return uncle
      }
      return last_child(parent)
   }
   if (quick_level < 1 && node.subitems.length > 0 && !node.hide_child) {
      return node.subitems[0];
   }
   return next_sibling(node)
}
let find_prev = (node, quick_level=0) => {
   if (quick_level >= 4) {
      let prev = find_prev(node, quick_level - 4)
      while (prev && prev.analysis === undefined) prev = find_prev(prev, quick_level - 4)
      return prev
   }
   let parent = node.parent;
   if (quick_level >= 2 && !parent.is_root) return parent;
   if (!parent.is_root && node.index + node.parent.mark === 0) return parent;
   if (parent.is_root && node.index === 0) return undefined;
   let prev = parent.subitems[node.index + node.parent.mark - 1]
   return quick_level >= 1 ? prev : last_child(prev)
}

const worker = new Worker("/Diagram.js")

worker.onmessage = (e) => {
   let data = e.data
   if (data.type === 'alert') {
      console.log(data.value)
   }
   if (data.type === 'resize') {
      canvas.style.width = (data.width / 10) + 'px'
      canvas.style.height = (data.height / 10) + 'px'
   }
}

let canvas

register.forEach((notation,index)=>{
   app.component(notation.id+'-list',{
      props:['item'],
      data:()=>({
         notation
         ,shownFS:[]
         ,tooltip:false
         ,tooltipX:{}
      }),
      methods:{
         onmouseenter(event){
            if (this.notation.drawDiagram !== null && root.diagram_follow) {
               let diagram = this.notation.drawDiagram(this.item.expr)
               if (diagram != null) {
                  worker.postMessage({
                     type: 'render',
                     diagram,
                     taskId: this.notation.display(this.item.expr)
                  })
               }

               root.showCanvas = true
               root.xCanvas = event.clientX + 100
               root.yCanvas = event.clientY + 15

            }

            if(!this.notation.able(this.item.expr)) return;
            var FS = get_FS(this.notation, root.use_alternative)
            var res=[], nmax=root.FS_shown[index]
            for(let n=0; n<=nmax; ++n) res.push(n+':&nbsp;'+this.notation.display(FS(this.item.expr,n)))
            this.shownFS = res
            this.tooltipX = {left:(event.offsetX+15)+'px'}
            this.tooltip = true
         },
         onmousemove(event) {
            if (root.diagram_follow) {
               root.xCanvas = event.clientX + 100
               root.yCanvas = event.clientY + 15
            }
         },
         onmouseleave(event){
            if (root.diagram_follow) {
               root.showCanvas = false
            }

            this.tooltip = false
         },
         onmousedown(event){
            if (event.button === 0) {
               let FS = root.use_alternative ? this.FSalter : this.FS;
               expand_item(this.item, this.notation, root.use_alternative, root.tier[index])
            } else if (event.button === 2) {
               console.log(this.notation, this.item)
            }
         },
         onfocus(event) {
            const target = event.target;
            const rect = target.getBoundingClientRect();
            const currentScroll = window.scrollY;

            const offsetTop = rect.top + currentScroll - 100;

            window.scrollTo({
               top: offsetTop,
               behavior: 'smooth'
            });

            if (this.notation.drawDiagram != null) {
               let diagram = this.notation.drawDiagram(this.item.expr)

               if (diagram != null) {
                  worker.postMessage({
                     type: 'render',
                     diagram,
                     taskId: this.notation.display(this.item.expr)
                  })

                  root.showCanvas = true

                  let rect = this.$refs.input.getBoundingClientRect()
                  root.xCanvas = rect.left + 5
                  root.yCanvas = 105 + rect.bottom - rect.top
               } else {
                  root.showCanvas = false
               }
            }
         },
         onkeydown(event) {
            if (event.key === 'ArrowUp') {
               event.preventDefault()

               let quick_level = (event.altKey ? 4 : 0) + (event.ctrlKey ? 2 : 0) + (event.shiftKey ? 1 : 0)

               let prev = find_prev(this.item, quick_level)
               let input = prev?.node?.$refs?.input
               if (input) input.focus()
            } else if (event.key === 'ArrowDown') {
               event.preventDefault()

               let quick_level = (event.altKey ? 4 : 0) + (event.ctrlKey ? 2 : 0) + (event.shiftKey ? 1 : 0)

               let next = find_next(this.item, quick_level);
               let input = next?.node?.$refs?.input
               if (input) input.focus()
            } else if (event.key === 'Enter') {
               event.preventDefault()
               let tier = event.shiftKey ? 1 : root.tier[index]
               let FS = root.use_alternative ? this.FSalter : this.FS;
               expand_item(this.item, this.notation, root.use_alternative, tier, true)
            } else if (event.key === 'Delete') {
               event.preventDefault()
               delete this.item.analysis
            } else if (event.key.toLowerCase() === 's' && event.ctrlKey) {
               event.preventDefault()

               root.export_xlsx()
            } else if (event.key.toLowerCase() === 'h' && event.ctrlKey) {
               event.preventDefault()

               this.item.hide_child = ! this.item.hide_child
            }
         },
      },
      mounted() {
         this.item.node = this

         if (this.item.auto_focus) {
            this.$refs.input.focus()
            this.item.auto_focus = false
         }
      },
      unmounted() {
         delete this.item.node
      },
      template:`<li><div class="shown-item" :class="{analyzed: item.analysis !== undefined}" @mouseenter="onmouseenter" @mousemove="onmousemove" @mouseleave="onmouseleave" @mousedown="onmousedown">
            <input type="checkbox" v-model="item.hide_child" @mousedown.stop>
            <input type="text" @mousedown.stop @keydown.stop="onkeydown" ref="input" @focus="onfocus" v-model="item.analysis"/>
            <span v-html="notation.display(item.expr)"></span>
            <div class="tooltip" v-if="tooltip" :style="tooltipX" @mousedown.stop>
            <span v-html="notation.display(item.expr)"></span> fundamental sequence:
            <div v-for="term in shownFS" v-html="term"></div>
         </div></div>
         <ul v-if="!item.hide_child">
            <`+notation.id+`-list v-for="subitem in item.subitems" :item="subitem" :key="subitem.index"></`+notation.id+`-list>
         </ul>
      </li>`
   })
   app.component(notation.id,{
      props:['subitems'],
      template:`<ul class="nowrap"><`+notation.id+`-list v-for="subitem in subitems" :item="subitem" :key="subitem.index"></`+notation.id+`-list></ul>`,
      mounted(){
      }
   })
})

const root=app.mount('#app')

window.addEventListener('keydown',e=>{
   if(e.ctrlKey||e.altKey||e.shiftKey||e.metaKey) return;
   var k=e.key
   if(0<=k&&k<=9){
      root.tier.splice(root.current_tab,1,+k)
   }else{
      switch(k){
         case ',':
         case '<':
            root.decrFS()
            break
         case '.':
         case '>':
            root.incrFS()
            break
         case '-':
         case '_':
            root.decr_extra()
            break
         case '=':
         case '+':
            root.incr_extra()
            break
      }
   }
})