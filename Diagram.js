// worker.js

let canvas = null
let ctx = null

let currentTaskId = 0

self.onmessage = (e) => {
   const msg = e.data

   switch (msg.type) {
      case "ping":
         self.postMessage({ type: 'alert', value: msg.value } )
         break

      case "init":
         initCanvas(msg.canvas)
         break

      case "render":
         renderDiagram(msg.diagram, msg.taskId)
         break
   }
}

function initCanvas(offscreenCanvas) {
   canvas = offscreenCanvas
   ctx = canvas.getContext("2d")
}

function renderDiagram(diagram, taskId) {
   if (!ctx) return

   if (currentTaskId === taskId) return;
   currentTaskId = taskId

   let size = Math.max(diagram.width, diagram.height)
   let scale = 1
   while (size > 2000) { size /= 2; scale /= 2; }

   canvas.width = diagram.width * scale
   canvas.height = diagram.height * scale

   self.postMessage({
      type: 'resize',
      width: canvas.width,
      height: canvas.height,
      scale: scale,
   })

   ctx.clearRect(0, 0, canvas.width, canvas.height)

   const actions = diagram.actions
   let i = 0

   function step() {
      if (taskId !== currentTaskId) return

      const batchSize = 40
      let count = 0

      while (i < actions.length && count < batchSize) {
         drawAction(actions[i], scale)
         i++
         count++
      }

      if (i < actions.length) {
         requestAnimationFrame(step)
      } else {
         self.postMessage({
            type: 'done',
         })
      }
   }

   requestAnimationFrame(step)

}

function drawAction(action, scale) {
   switch (action.type) {
      case "circle":
         drawCircle(action, scale)
         break;
      case "line":
         drawLine(action, scale)
         break;
      case "font":
         ctx.font = (action.size * scale) + 'px ' + action.font;
         break
      case "lineWidth":
         ctx.lineWidth = action.value * scale
         break
      case "fillStyle":
         ctx.fillStyle = action.value
         break
      case "strokeStyle":
         ctx.strokeStyle = action.value
         break
      case "fillRect":
         ctx.fillRect(action.value.x * scale, action.value.y * scale, action.value.w * scale, action.value.h * scale)
         break
      case "strokeRect":
         ctx.strokeRect(action.value.x * scale, action.value.y * scale, action.value.w * scale, action.value.h * scale)
         break
      case "clearRect":
         ctx.clearRect(action.value.x * scale, action.value.y * scale, action.value.w * scale, action.value.h * scale)
         break
      case "text":
         drawText(action, scale);
   }
}

function drawCircle(a, scale) {
   ctx.beginPath()
   ctx.arc(a.center.x * scale, a.center.y * scale, a.radius * scale, 0, Math.PI * 2)
   if (a.fill)
      ctx.fill()
   ctx.stroke()
}

function drawLine(a, scale) {
   ctx.beginPath()
   ctx.moveTo(a.start.x * scale, a.start.y * scale)
   ctx.lineTo(a.end.x * scale, a.end.y * scale)
   ctx.stroke()
}

function drawText(action, scale) {
   let offset = 0
   if (action.h_center) {
      offset = -ctx.measureText(action.value).width / 2
   }
   ctx.fillText(action.value, action.pos.x * scale + offset, action.pos.y * scale)
}