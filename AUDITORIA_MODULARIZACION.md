# Auditoria de modularizacion

## Atributos modularizados en `public/script.js`

La paleta ahora sale de `COLOR_OPTIONS`, con estos atributos por color:

- `hex`: valor hexadecimal usado como `data-color` y color visual.
- `name`: nombre visible y texto del `aria-label`.

Cada item renderiza una tarjeta con:

- `class="color-card"`
- `data-color`
- `role="button"`
- `tabindex="0"`
- `aria-label="Seleccionar color ..."`
- `.color-muestra`
- `.color-nombre`
- `.color-porcentaje`

## CSS suelto encontrado

- `public/perfil.html`: bloque `<style>` completo movido a `public/style.css`.
- `public/stats.html`: bloque `<style>` completo movido a `public/style.css`.
- `public/terms.html`: estilos inline reemplazados por `.terms-modal` y `.terms-content`.
- `public/timeline.html`: `style="display:none"` reemplazado por `.is-hidden`.
- `public/index.html`: grilla hardcodeada y estilos inline de visibilidad reemplazados por render desde JS y `.is-hidden`.

Quedan estilos dinamicos en `public/perfil.js` porque dependen de datos calculados:

- `background-color: ${data.color}`
- `color: ${data.color}`
- `width: ${Math.min(scrollPorcentaje, 100)}%`
- `background-color: ${color}`

## Codigo duplicado que conviene modularizar

- `public/timeline copy.js` duplica gran parte de `public/timeline.js`. Conviene eliminarlo si no se usa, o convertirlo en una variante importable.
- `public/perfil.js` y `public/timeline.js` repiten la logica para obtener `sessionId`, pedir `/api/perfil/:sessionId` y hacer fallback. Conviene extraer un helper `fetchCurrentProfile()`.
- `public/perfil.js` y `public/stats.js` repiten render de estados de error/loading con HTML similar. Conviene crear helpers `renderError()` y `renderLoading()`.
- `public/stats.js` repite estructura de tarjetas resumen (`stat-box`). Conviene renderizarlas desde un array de metricas.
- `public/timeline.js` repite creacion imperativa de elementos (`document.createElement`, clases, append). Conviene usar helpers `createElement(tag, className, text)` y `appendChildren()`.
- `public/style.css` contiene reglas duplicadas marcadas con comentarios `DUPLICADA en linea ...`; las mas relevantes son `.timeline-card`, `.timeline-container`, `.timeline-line`, `.timeline-item`, `.timeline-dot`, `.stats-page`, `.stats-card`, `.stats-summary`, `.summary-card`, `.stat-value` y `.error`.
