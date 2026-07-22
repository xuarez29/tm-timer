# Cronómetro Toastmasters

Temporizador visual para sesiones de Toastmasters. Muestra el semáforo de
tiempos a pantalla completa —verde, amarillo y rojo— para que el orador lo lea
desde cualquier punto del salón, e incluye una campanilla para el Ah-Counter.

Funciona sin conexión: una vez abierto, se puede instalar en el teléfono y usar
en la sesión aunque no haya internet en el lugar.

## Modos

| Modo | Verde | Amarillo | Rojo | Parpadeo |
|---|---|---|---|---|
| Rompehielos | 4:00 | 5:00 | 6:00 | 6:30 |
| Discurso Preparado | 5:00 | 6:00 | 7:00 | 7:30 |
| Tópicos de mesa | 1:00 | 1:30 | 2:00 | 2:30 |
| Tiempo Variable | máx − 2 min | máx − 1 min | máx | máx + 30 s |

**Tiempo Variable** permite fijar cualquier duración de 1 a 60 minutos, útil
para evaluaciones, informes del Toastmaster del día o roles fuera del estándar.

## Cómo se usa

1. Elige el formato en la pantalla de inicio.
2. **Iniciar** arranca el cronómetro. La pantalla completa cambia de color al
   alcanzar cada umbral, con una etiqueta que nombra el estado.
3. **Ocultar** esconde los números pero mantiene los colores — así el orador ve
   la señal sin distraerse con el conteo exacto.
4. **Reiniciar** vuelve a cero sin salir del modo. **Terminar** regresa al menú.

La pantalla no se apaga sola mientras el cronómetro está visible.

### Campanilla (Ah-Counter)

Pantalla aparte para contar muletillas. Toca la campana para marcar una; el
contador lleva el total. Hay cuatro sonidos —Suave, Clásica, Brillante y
**Silencio**, para contar sin interrumpir al orador— y el que elijas se
recuerda para la próxima vez.

En iPhone suena por la bocina aunque el interruptor de silencio esté activado.

## Instalarlo en la pantalla de inicio

No hace falta tienda de aplicaciones. Se instala desde el navegador.

**Android (Chrome)**
Abre la app, toca el menú **⋮** y elige *Instalar aplicación* o *Agregar a
pantalla principal*. Confirma. Si aparece una barra sugiriendo instalarla,
también sirve.

**iPhone / iPad (Safari)**
Debe ser **Safari** — desde Chrome en iOS no se puede. Abre la app, toca el
botón de compartir (el cuadrito con la flecha hacia arriba), desliza y elige
*Agregar a inicio*, luego *Agregar*.

**Escritorio (Chrome o Edge)**
Busca el icono de instalar (una pantalla con una flecha) al final de la barra
de direcciones y haz clic. También desde el menú **⋮ → Instalar**. En
escritorio aparece además un botón de pantalla completa dentro del cronómetro.

Una vez instalada abre como una app normal, sin barras del navegador.

## Desarrollo

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

Stack: React 19 + Vite, CSS Modules, sin dependencias de UI. Los iconos son SVG
en línea y los sonidos de la campanilla se sintetizan con la Web Audio API, así
que no hay archivos de audio ni librerías externas que descargar.

### Tipografías

Zilla Slab, Archivo y Manrope viven auto-hospedadas en `public/fonts/` para que
la app siga funcionando sin conexión. Están bajo SIL Open Font License 1.1; los
avisos de copyright y el texto de la licencia están en
[`public/fonts/OFL.txt`](public/fonts/OFL.txt), que debe permanecer junto a los
archivos `.woff2`.

---

Creado por **Carlos Juárez**
Club Excelencia de Toastmasters — Querétaro, México
