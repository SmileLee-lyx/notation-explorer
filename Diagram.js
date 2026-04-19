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

   canvas.width = diagram.width
   canvas.height = diagram.height

   self.postMessage({
      type: 'resize',
      width: diagram.width,
      height: diagram.height,
   })

   ctx.clearRect(0, 0, canvas.width, canvas.height)

   const actions = diagram.actions
   let i = 0

   function step() {
      if (taskId !== currentTaskId) return

      const batchSize = 20
      let count = 0

      while (i < actions.length && count < batchSize) {
         drawAction(actions[i])
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

function drawAction(action) {
   switch (action.type) {
      case "circle":
         drawCircle(action)
         break;
      case "line":
         drawLine(action)
         break;
      case "font":
         ctx.font = action.value
         break
      case "lineWidth":
         ctx.lineWidth = action.value
         break
      case "fillStyle":
         ctx.fillStyle = action.value
         break
      case "strokeStyle":
         ctx.strokeStyle = action.value
         break
      case "fillRect":
         ctx.fillRect(action.value.x, action.value.y, action.value.w, action.value.h)
         break
      case "strokeRect":
         ctx.strokeRect(action.value.x, action.value.y, action.value.w, action.value.h)
         break
      case "clearRect":
         ctx.clearRect(action.value.x, action.value.y, action.value.w, action.value.h)
         break
      case "text":
         drawText(action);
   }
}

function drawCircle(a) {
   ctx.beginPath()
   ctx.arc(a.center.x, a.center.y, a.radius, 0, Math.PI * 2)
   if (a.fill)
      ctx.fill()
   ctx.stroke()
}

function drawLine(a) {
   ctx.beginPath()
   ctx.moveTo(a.start.x, a.start.y)
   ctx.lineTo(a.end.x, a.end.y)
   ctx.stroke()
}

function drawText(action) {
   let offset = 0
   if (action.h_center) {
      offset = -ctx.measureText(action.value).width / 2
   }
   ctx.fillText(action.value, action.pos.x + offset, action.pos.y)
}