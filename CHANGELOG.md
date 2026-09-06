# Changelog

Todos los cambios notables de ECSend Pro se documentan aquí.

---

## v8.9 — 2026-09-01

### Migración del repositorio
- **Nuevo repo destino**: `https://github.com/Estalingradocorp/ECsendpro.git` (público, vacío).
- **Remote `origin` actualizado**: apunta al repo nuevo. El repo anterior era `nicotips27/ECwebSend`.
- **Estado**: el código está listo y commiteado en `main` (`e73c72a` o posterior). Falta el `git push` al repo nuevo una vez que las credenciales de git apunten a una cuenta con acceso a la organización `Estalingradocorp` (el push con `nicotips27` devuelve 403 sin permisos).
- **Deploy**: la página se activa en GitHub Pages desde el repo nuevo (Settings → Pages → deploy desde `main`). El archivo `.nojekyll` y `404.html` ya están en la raíz para el correcto funcionamiento de GitHub Pages.
- **El repo viejo** (`nicotips27/ECwebSend`) puede borrarse después de confirmar que el nuevo queda desplegado.
- **`404.html` actualizado**: el redirect de errores 404 ahora apunta a `https://estalingradocorp.github.io/ECsendpro/` (antes apuntaba al dominio del repo viejo).

---

## v8.8 — 2026-09-01

### Fix: conexión por QR en PC (Brave) y cierre del escáner
- **Espera a que el peer esté listo**: `connectToPeerId` ahora verifica que `peer.open` sea `true` antes de intentar `peer.connect()`. Si no, espera (hasta 6 s) reintentando, evitando el fallo de conectar antes de que el peer esté registrado en PeerJS Cloud (causa común del "la red tarda demasiado").
- **Reconexión automática**: si el peer quedó `disconnected` del broker, se llama `peer.reconnect()` antes de conectar.
- **Timeout más largo**: el aviso "la red está demorando" pasa de 6 s a 10 s.
- **Cámara correcta en desktop**: el escáner QR usa `facingMode: "user"` (delantera) en PC y `"environment"` (trasera) en móvil, evitando que en Brave/PC no encuentre cámara.
- **Cierre robusto del escáner**: `stopQRScanner()` ahora siempre oculta el modal (añade `hidden` y quita `flex`) además de detener la cámara.
- Versionado: `app.js` → `?v=16`, caché del service worker → `ecsend-v11`.

---

## v8.7 — 2026-09-01

### Fix: conexión por QR
- **Corregido**: el escaneo de QR ahora conecta **directamente por `peerId`** (`connectToPeerId`) en lugar de pasar por el input/`connectToPeer`, que quedó frágil al introducir el campo manual y el `<form>`. Esto asegura que escanear un QR siempre dispare la conexión.
- **Fix re-escaneo**: `startQRScanner()` ahora detiene el escáner activo antes de reiniciarlo, evitando el error "already running" de `html5-qrcode` al abrir el escáner más de una vez.
- Versionado: `app.js` → `?v=15`, caché del service worker → `ecsend-v10`.

---

## v8.6 — 2026-09-01

### Chat: copiar mensaje
- Cada burbuja del chat es ahora clicable (tap/click) y **copia el mensaje al portapapeles** con confirmación visual (`toast` "Mensaje copiado").
- Uso del `navigator.clipboard` con fallback a `execCommand('copy')` para navegadores sin contexto seguro.
- Se habilitó la selección de texto en las burbujas (`select-text`) pese al `select-none` global del cuerpo.
- Versionado: `app.js` → `?v=14`, caché del service worker → `ecsend-v9`.

---

## v8.5 — 2026-09-01

### Fix crítico: modales y botones que bloqueaban los clicks
- **Causa raíz encontrada**: el Play CDN de Tailwind genera `.hidden` y `.flex` con la misma especificidad. En varios elementos (`#modal-help`, `#modal-qr`, `#modal-privacy`, `#modal-scanner`, `#modal-transfer`, `#btn-floating-chat`) ambas clases coexisten en el HTML estático, y **según el orden del CSS podía ganar `display: flex`**, dejando modales "ocultos" **visibles**: tapaban toda la pantalla e interceptaban los clicks.
- **Síntomas que explica**: chat que no cierra, necesidad de múltiples clicks para abrir, e imposibilidad de tocar los dispositivos de la red.
- **Solución**: regla global `.hidden { display: none !important; }` en el `<style>` de `index.html`, que garantiza que `hidden` siempre gane sobre `flex` sin importar el orden del CSS.
- **Robustez adicional**:
  - Al desconectar, el chat se cierra y su estado se resetea (`isChatOpen = false`) para evitar desincronización.
  - El splash de carga tiene un tope de seguridad (2.5 s) para no quedar nunca tapando la pantalla.
- Versionado: `app.js` → `?v=13`, caché del service worker → `ecsend-v8`.

---

## v8.4 — 2026-09-01

### Fix: chat P2P no abría / no cerraba
- **Corregido** el bug documentado en v8.3: `#modal-chat` declara ahora solo `hidden` + `flex-col` (sin `flex` estático). `toggleChat()` agrega/remueve `flex` junto con `hidden`, eliminando el conflicto de `display` según el orden del CSS de Tailwind.

### Fix: sincronización/discovery PC → móvil en la misma red
- **Más redundancia de relays** en Trystero (`relayConfig.redundancy: 3`): el descubrimiento se anuncia/escucha sobre más relays nostr simultáneos, reduciendo el fallo asimétrico cuando un dispositivo (PC) no ve al otro (móvil) por un relay caído o lento.
- **Reanuncio de presencia al reconectar PeerJS** (`peer.on('open')`): si el código de 6 dígitos rotó (180 s) o el peer se reconectó, la presencia se vuelve a publicar con el `peerId` fresco, evitando que los vecinos conserven un ID viejo y la conexión PC→móvil falle.
- **Reanuncio + poda al volver a la pestaña** (`visibilitychange`): en el PC, el navegador pausa los timers en segundo plano; al volver al frente se re-publica presencia y se limpian dispositivos vencidos.
- Versionado: `app.js` → `?v=12`, caché del service worker → `ecsend-v7`.

---

## v8.3 — 2026-09-01

### Bug detectado: chat P2P (abrir/cerrar)
- **Síntoma reportado**: al tocar el botón flotante de chat, a veces no se abre; si se abre, en ocasiones no se puede cerrar.
- **Causa probable (investigada)**: el contenedor `#modal-chat` (en `index.html`) declara a la vez las clases `hidden` y `flex flex-col` en su clase estática. Como ambas utilidades tienen la misma especificidad, gana la que aparezca después en el CSS generado por Tailwind, lo que depende del navegador/orden:
  - si prevalece `hidden` → el chat no abre;
  - si prevalece `flex` → el chat queda visible y no se cierra.
- **Estado**: corregido en v8.4 — se eliminó el `flex` estático del contenedor y `toggleChat()` gestiona `hidden`/`flex` de forma consistente.

---

## v8.2 — 2026-09-01

### Vista de inicio: Mi Código + Conectarse en una sola franja
- Unificados "Mi Código" y "Conectarse a dispositivo" en un único panel, separados por una línea divisoria.
- Nuevo botón **"Ingresar Código"**: muestra el campo de ingreso manual del código (el campo queda oculto hasta que se toca). Durante el escaneo de QR, el campo se despliega automáticamente para reflejar el código detectado.
- Botón **"Conectar" visible** y **Enter funcional en móvil**: el campo de código está dentro de un `<form>`, presionar Enter en el teclado virtual ejecuta la conexión.
- Versionado: `app.js` → `?v=11`, caché del service worker → `ecsend-v6`.

---

## v8.1 — 2026-09-01

### Publicidad
- **Retirada la publicidad de la vista de inicio**. Solo queda el banner visible durante la pantalla de transferencia (modal).
- Versionado: `app.js` → `?v=9`, caché del service worker → `ecsend-v4`.

---

## v8.0 — 2026-09-01

### Ruta de descarga predeterminada
- Nueva opción en Ajustes → "Ruta de Descarga": el usuario selecciona una carpeta (File System Access API, solo Chromium) donde se guardan automáticamente los archivos recibidos.
- El handle de la carpeta se persiste en IndexedDB (`ecsend-download-db`) y se restaura al volver a abrir la app.
- En Safari/Firefox se muestra un aviso de compatibilidad y se continúa con la descarga predeterminada del navegador.

### UI y efectos
- **Historial Reciente** movido de la pestaña INICIAR a la pestaña RECIBIR (debajo de "Archivos Recibidos").
- **Fix clicks en navegación**: las partículas ya no bloquean los botones INICIAR/RECIBIR/ENVIAR ni Ajustes (`detectsOn: "canvas"` en tsParticles).
- **Animaciones de menú refinadas**: apertura/cierre suaves del menú principal y del panel de Ajustes (escala + deslizamiento con easings suaves), sin cortes bruscos.

### Versionado
- `app.js` → `?v=8`, caché del service worker → `ecsend-v3`.

---

## v7.2 — 2026-09-01

### Fix: menú roto en GitHub Pages por caché del service worker
- `3723ec8` **Solución de caché**: el service worker viejo (`ecsend-v1`) servía `app.js` con **cache-first**, mientras el `index.html` nuevo cargaba de la red → el menú (que llama a `toggleSettingsPanel()`) se rompía porque el JS cacheado era viejo.
  - Caché subida a **`ecsend-v2`** (purga automática de la vieja).
  - **Network-first** para `app.js` y `manifest.webmanifest` (siempre baja la última versión online, con fallback a caché offline).
  - **Cache-buster** `?v=7` en el `<script>` de `app.js`: incluso con el SW viejo instalado, la query distinta falla la búsqueda en caché y fuerza descarga de red.
  - Nota de migración: la primera carga tras el fix puede requerir un reload extra para que el SW v2 tome control y purgue la caché.

---

## v7.1 — 2026-09-01

### Menú desplegable y configuración
- `9ff3045` **Convertir Ajustes en submenú desplegable**: eliminada la página de configuración (que abría vacía); todos los ajustes ahora viven en un panel expandible dentro del menú del logo (con scroll y flecha giratoria).
- `93d5aa5` **Mover Ajustes al menú desplegable**: agregada la opción Ajustes en el menú del logo y eliminado el botón AJUSTES de la barra de navegación inferior (queda INICIAR / RECIBIR / ENVIAR).
- `c6cc5f1` **Actualizar menú desplegable**: quitadas las opciones Buscador, ECDownload y EC News. "Tráfico en tiempo real" y "Saber más" abren en pestaña nueva; "Saber más" enlaza a EstalingradoCorp.

---

## v7.0 — 2026-09-01

### Publicidad (últimos cambios)
- `5d5eb61` **Publicidad en modal de transferencia**: banner GIF dentro del modal de transferencia (mientras se pasan archivos) que enlaza a Estalingrado Market.
- `890d7af` **Publicidad en vista de inicio**: banner GIF entre "Mi Código" y "Conectarse a dispositivo" que enlaza a Estalingrado Market.
- Ambos banners usan `target="_blank" rel="noopener nofollow"`.

### Modo LocalSend
- `45fbdd1` **Modo LocalSend: nombres aleatorios y descubrimiento en la misma red**:
  - Nombres aleatorios estilo LocalSend ("Zorro Cobalto") con emoji de avatar y botón dado para regenerar.
  - Panel "En tu misma red" que lista los dispositivos del mismo Wi-Fi y conecta con un toque.
  - Descubrimiento vía Trystero (relays nostr públicos) con sala derivada de la IP pública.
  - Toggle de privacidad "Descubrimiento en la red" en Configuración.
  - Chunks adaptativos 64–256 KB y high-water 8 MB para velocidad LAN.
  - `FileReader` reemplazado por `arrayBuffer()`.

---

## v6.5 — 2026-08-26

- `d888402` **Mejoras de seguridad, rendimiento y PWA instalable**:
  - Fix XSS: escape de nombres de archivo y mensajes de chat entrantes.
  - Transferencias más rápidas: chunks de 64 KB con control de flujo `bufferedamountlow`.
  - Botón cancelar transferencia en ambos dispositivos.
  - CDNs con versión fija (lucide, html5-qrcode) y carga diferida.
  - Logo e íconos locales (`assets/`) en lugar del hotlink externo.
  - PWA: manifest + service worker con caché offline.
  - Fixes: timer de código, botón eliminar datos, input bloqueado tras fallo.
  - `404.html` y `.nojekyll` para GitHub Pages.
  - README actualizado con arquitectura real (PeerJS, no Firebase).

---

## Historial anterior (antes de la reestructuración)

- `adce8ab` Update index.html
- `5f6b592` unos ajustes
- `2a22c0c` repare el enlace directo
- `df1f93e` / `1962fe6` Delete / Create CNAME
- `0ec3d25` / `4482dcc` Delete / Create CNAME
- `dc50f44` / `248279d` Delete / Create CNAME
- `edcae1a` Add link to EC News in index.html
- `8491a90` Fix HTML formatting and add doctype declaration