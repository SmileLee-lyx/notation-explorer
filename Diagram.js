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

function clamp255(x) {
   if (!Number.isFinite(x)) return 0
   return Math.max(0, Math.min(255, x));
}

function rgbToCss(c) {
   const r = clamp255(Math.round(c.r));
   const g = clamp255(Math.round(c.g));
   const b = clamp255(Math.round(c.b));
   return `rgb(${r}, ${g}, ${b})`;
}

function lerp(a, b, t) {
   return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
   return {
      r: lerp(c1.r, c2.r, t),
      g: lerp(c1.g, c2.g, t),
      b: lerp(c1.b, c2.b, t),
   };
}

const white = { r: 255, g: 255, b: 255 };
const black = { r: 0, g: 0, b: 0 };

function setStyle(style, scale) {
   if (style.fillColor) ctx.fillStyle = rgbToCss(style.fillColor)
   if (style.lineColor) ctx.strokeStyle = rgbToCss(style.lineColor)
   if (style.lineWidth) ctx.lineWidth = style.lineWidth * scale
   if (style.text) {
      ctx.font = Math.floor(style.text.size * scale) + "px " + style.text.font
   }
}

function renderDiagram(diagram, taskId) {
   if (!ctx) return

   if (currentTaskId === taskId) return;
   currentTaskId = taskId

   let size = diagram.width * diagram.height
   let scale = 1
   while (size > 4000000) { size /= 4; scale /= 2; }

   if (canvas.width !== diagram.width * scale) canvas.width = diagram.width * scale;
   if (canvas.height !== diagram.height * scale) canvas.height = diagram.height * scale;

   self.postMessage({
      type: 'resize',
      width: canvas.width,
      height: canvas.height,
      scale: scale,
   })

   let style = diagram

   ctx.clearRect(0, 0, canvas.width, canvas.height)

   const elements = diagram.elements

   function step() {
      if (taskId !== currentTaskId) return

      for (let element of elements) {
         drawElement(element, style, scale)
      }

      requestAnimationFrame(step)
   }

   step()
}

function drawElement(element, style, scale) {
   switch (element.type) {
      case "circle":
         drawCircle(element, style, scale)
         break;
      case "line":
         drawLine(element, style, scale)
         break;
      case "rect":
         drawRect(element, style, scale);
         break;
      case "text":
         drawText(element, style, scale);
         break;
   }
}

function setBlinkStyle(element, style, scale) {
   setStyle(style, scale);
   setStyle(element, scale);
   if (element.blink) {
      let phase = Math.sin((Date.now() % 2000) / 1000 * Math.PI) * 0.25 + 0.5

      let result = {
         lineColor: lerpColor(element.lineColor || style.lineColor || black, white, phase),
         fillColor: lerpColor(element.fillColor || style.fillColor || black, white, phase),
      }
      setStyle(result, scale)
   }
}

function drawCircle(element, style, scale) {
   setBlinkStyle(element, style, scale);

   ctx.beginPath()
   ctx.arc(element.value.x * scale, element.value.y * scale, element.value.r * scale, 0, Math.PI * 2)
   if (element.fill)
      ctx.fill()
   if (element.border)
      ctx.stroke()
}

function drawLine(element, style, scale) {
   setBlinkStyle(element, style, scale);

   ctx.beginPath()
   ctx.moveTo(element.start.x * scale, element.start.y * scale)
   ctx.lineTo(element.end.x * scale, element.end.y * scale)
   ctx.stroke()
}

function drawRect(element, style, scale) {
   setBlinkStyle(element, style, scale);

   let scaledValue = { x: element.value.x * scale, y: element.value.y * scale, w: element.value.w * scale, h: element.value.h * scale };
   if (element.fill) ctx.fillRect(scaledValue.x, scaledValue.y, scaledValue.w, scaledValue.h);
   if (element.border) ctx.strokeRect(scaledValue.x, scaledValue.y, scaledValue.w, scaledValue.h);
}

function drawText(element, style, scale) {
   setBlinkStyle(element, style, scale);

   let offset = 0
   if (element.h_center) {
      offset = -ctx.measureText(element.value).width / 2
   }
   ctx.fillText(element.value, element.pos.x * scale + offset, element.pos.y * scale)
}