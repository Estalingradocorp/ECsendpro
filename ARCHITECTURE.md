# Arquitectura técnica — ECSend Pro

Documentación técnica del funcionamiento interno de ECSend Pro. Es una **SPA de un solo archivo** (`index.html` + `js/app.js`) sin framework ni build, desplegada como sitio estático en GitHub Pages.

---

## 1. Visión general

```
[Dispositivo A]  <─── WebRTC DataChannel (P2P directo, cifrado E2E) ───>  [Dispositivo B]
     │                                                                            │
     │  señalización PeerJS Cloud (peer ID ecsend-XXXXXX)                        │
     └────────────────────────── + ──────────────────────────────────────────────┘
     │  descubrimiento Trystero (relays nostr) → sala por IP pública             │
     └───────────────────────────────────────────────────────────────────────────┘
```

- **Datos** (archivos/chat): WebRTC DataChannel, punto a punto, cifrado DTLS/SRTP.
- **Señalización** (cómo se encuentran dos navegadores): PeerJS Cloud mediante peer IDs derivados de un código de 6 dígitos.
- **Descubrimiento** (cómo aparecen los dispositivos cercanos): Trystero sobre relays públicos nostr, agrupados en una sala derivada de la IP pública.

---

## 2. Identidad y códigos

- Cada sesión genera un **código de 6 dígitos** `myRawCode` (aleatorio) y un **peer ID PeerJS** `ecsend-XXXXXX`.
- El código **rota cada 180 s** (`CODE_VALID_TIME`): al vencer, se regenera, se destruye el peer antiguo y se crea uno nuevo (`refreshMyCode`).
- El código se muestra formateado `XXX-XXX` y se publica en un **QR** (`QRious`) con el enlace `?connect=XXXXXX`.
- Al abrir la app con `?connect=XXXXXX`, el enlace llena automáticamente el campo destino y conecta (`checkURLParams`).

---

## 3. Señalización (PeerJS)

PeerJS abstrae el intercambio SDP/ICE. Cada dispositivo es un peer registrado en el **PeerJS Cloud broker** con su peer ID `ecsend-XXXXXX`.

- **Conectar** (`connectToPeer` / `connectToPeerId`): el emisor llama `peer.connect(targetId, { reliable: true })`. Usa `reliable: true` para DataChannel ordenado y sin pérdida (necesario para transferencias).
- **Recibir**: `peer.on('connection')` acepta la conexión entrante.
- **Reconexión**: `peer.on('disconnected')` y un listener de `visibilitychange` reintentan (`peer.reconnect()`) cuando la pestaña vuelve al frente (p. ej. al volver de WhatsApp).
- **ICE STUN**: en modo `global` se usan `stun.l.google.com:19302` y `global.stun.twilio.com:3478`. En modo `local` (`network: 'local'`) **no** hay STUN → la conexión se fuerza por la LAN.

### Manejo de errores / caídas
- `peer.on('error')`: `peer-unavailable` muestra aviso de dispositivo no encontrado.
- `iceconnectionstatechange` en `setupConnection`: da 30 s de gracia en `disconnected` (por si el navegador pasó a segundo plano) y cierra en `failed/closed`.
- `keepAliveInterval` envía `{type:'ping'}` cada 3 s; se ignora al recibirlo.

---

## 4. Descubrimiento en la misma red (Trystero)

`initDiscovery()` (async, no bloqueante) intenta:

1. Obtener la **IP pública** vía `fetch('https://api.ipify.org?format=json', { cache: 'no-store' })`.
2. Derivar la **sala** = `ecsend-net-` + primeros 3 octetos de la IP (`a.b.c`). Dos equipos detrás del mismo router → misma sala.
3. `import('https://cdn.jsdelivr.net/npm/trystero@0.25.3/+esm')` (carga diferida).
4. `joinRoom({ appId: 'ecsend-estalingrado', relayConfig: { redundancy: 3 } }, sala)` — 3 relays nostr simultáneos para mayor fiabilidad del descubrimiento en ambas direcciones.
5. `makeAction('presence')`.

**Reanuncios de presencia**: además del broadcast periódico (cada `PRESENCE_INTERVAL` 30 s), la presencia se re-publica en dos momentos críticos:
- En `peer.on('open')` (PeerJS): tras rotar el código de 6 dígitos (`refreshMyCode`) o reconectar, se publica con el `peerId` fresco, evitando que los vecinos guarden un ID obsoleto y las conexiones PC→móvil fallen.
- En `visibilitychange` a `visible`: el navegador pausa los timers en segundo plano (típico en PC); al volver al frente se re-anuncia y se podan dispositivos vencidos (`pruneNearby()`).

### API Trystero (v0.25.x)
> La firma cambió respecto a versiones anteriores: `makeAction` devuelve un **objeto** (`{ send, onMessage }`) y `onPeerJoin`/`onPeerLeave` son **propiedades asignables**, no métodos.

```js
const presence = room.makeAction('presence');
presence.send(data, { target: peerId });   // dirigido
presence.send(data);                        // broadcast
presence.onMessage = (data, { peerId }) => {};
room.onPeerJoin = (peerId) => {};
room.onPeerLeave = (peerId) => {};
room.leave();
```

### Protocolo de presencia
- **Payload** publicado: `{ pid: <PeerJS id>, name, emoji }`.
- Broadcast cada `PRESENCE_INTERVAL` (30 s) y al recibir un peer nuevo (respuesta dirigida).
- TTL de `NEARBY_TTL` (90 s): `pruneNearby()` elimina dispositivos que no se anunciaron.
- Al tocar un dispositivo → `connectToPeerId(payload.pid)` conecta por el canal PeerJS habitual.
- Toggle "Descubrimiento en la red" (`appSettings.discovery`, por defecto `true`): al apagar se llama `stopDiscovery()` (leave de la sala).
- **Fallos tolerados**: si ipify o el import fallan, `discoveryRoom` queda `null` y el panel muestra "no disponible" sin romper el resto.

---

## 5. Protocolo de transferencia de archivos

### Secuencia

1. **Cabecera** `{ type:'header', name, size, mime, batchTotalSize, batchTotalFiles, batchCurrentIndex }`.
2. **Datos binarios**: se envían chunks del archivo (ArrayBuffer) como mensajes binarios.
3. **Fin** `{ type:'eof' }` → el receptor ensambla `Blob` y fuerza descarga.
4. **Confirmación** `{ type:'eof-ack' }` → el emisor pasa al siguiente archivo.

### Confirmación / seguridad del lote
- En el primer archivo (`batchCurrentIndex === 1`), el receptor muestra un `confirm()` con cantidad y peso total. Si rechaza, envía `{type:'transfer-rejected'}`.
- El emisor, al recibir `transfer-rejected`, detiene el envío (`transferCancelled = true`) y vacía la cola.

### Cancelación
- Botón **Cancelar** en el modal → `cancelTransfer()` envía `{type:'transfer-cancel'}`, detiene el pump y limpia la cola.
- El receptor al recibirlo aborta la recepción (limpia buffers y cierra el modal).

### Control de flujo y chunks adaptativos (`sendNextFile`)
- Chunk mínimo 64 KB, máximo 256 KB (`CHUNK_MIN`/`CHUNK_MAX`).
- **High water** 8 MB / **low water** 1 MB (`BUFFER_HIGH_WATER`/`BUFFER_LOW_WATER`).
- `pump()` lee un chunk con `file.slice(...).arrayBuffer()`, lo envía y, si `dc.bufferedAmount < low water` y el chunk no llegó al máximo, **duplica el chunk** (64→128→256 KB). Esto acelera en canales rápidos (LAN).
- Si `dc.bufferedAmount > high water`, espera el evento `bufferedamountlow` (con fallback de 250 ms) antes de seguir.

### Reconstrucción en el receptor (`processIncomingFile`)
- MIME validado con regex (`/^[\w.+-]+\/[\w.+-]+$/`), con fallback a `application/octet-stream`.
- Nombre saneado con `sanitizeFilename()` (quita caracteres de ruta, máx. 180 chars).
- Genera `Blob` → `URL.createObjectURL` → fuerza descarga y agrega ítem a la bandeja + historial.

---

## 6. Seguridad

- **XSS**: todos los nombres/mensajes de origen remoto se escapan con `escapeHTML()` o se insertan con `textContent` (chat). MIME y nombres se validan/sanean.
- **Chat**: burbujas construidas por DOM con `textContent`, nunca con `innerHTML` interpolado.
- **Cifrado**: transporte WebRTC cifrado (DTLS/SRTP); no se almacenan datos en servidores propios.
- **CSP/atributos**: enlaces publicitarios usan `rel="noopener nofollow"`.

---

## 7. Almacenamiento local

| Clave | Contenido |
|---|---|
| `ecsend_settings` | `username`, `network`, `sounds`, `dynamicBg`, `ecEncripP2P`, `discovery` |
| `ecsend_history` | Historial de transferencias (últimos 20) |

**IndexedDB** (`ecsend-download-db`):

| Store | Contenido |
|---|---|
| `handles` (`downloadDir`) | `FileSystemDirectoryHandle` de la carpeta de descarga personalizada (solo Chromium). Se persiste para reutilizar entre sesiones. |

**Ruta de descarga predeterminada** (`selectDownloadFolder` / `clearDownloadPath`):
- Usa la **File System Access API** (`showDirectoryPicker`, `mode: 'readwrite'`), **solo Chromium**.
- El handle se guarda en IndexedDB y se restaura al abrir la app (si el permiso sigue otorgado).
- En `processIncomingFile`, si hay `downloadDirHandle`, el archivo se escribe directo en la carpeta; si falla o no hay carpeta, cae a la descarga normal del navegador.
- En Safari/Firefox el botón se oculta y se muestra un aviso de compatibilidad.

---

## 8. Sistema de visibilidad (modales/paneles)

- **Dependencia de Tailwind Play CDN**: las utilidades `.hidden` (`display: none`) y `.flex` (`display: flex`) tienen **la misma especificidad**. Si ambos están presentes en un elemento, el resultado depende del orden del CSS generado (frágil).
- **Mitigación global**: `index.html` define `.hidden { display: none !important; }`, de modo que `hidden` siempre gana sobre `flex` sin importar el orden del CSS. Esto es crítico para que los modales "ocultos" no queden visibles tapando la pantalla (v8.5).
- **Patrón de toggle**: los elementos que muestran/ocultan contenido usan las clases `hidden` (oculto) y `flex` (visible) gestionadas desde JS, nunca ambas a la vez en estado estable:
  - Abrir: `classList.remove('hidden'); classList.add('flex')`.
  - Cerrar: `classList.add('hidden'); classList.remove('flex')`.
- **Chat**: `toggleChat()` gestiona `hidden`/`flex` sobre `#modal-chat`. Al desconectar (`resetConnectionUI`) el chat se cierra y resetea `isChatOpen = false` para evitar estado desincronizado.
- **Splash**: tiene tope de seguridad (2.5 s) que fuerza `hidden` para no quedar nunca tapando la interfaz.

---

## 9. Dependencias (CDN, versiones fijas)

| Librería | Uso | Versión |
|---|---|---|
| Tailwind CSS | Estilos (Play CDN) | CDN latest (advertencia de producción) |
| Lucide Icons | Iconografía | 0.462.0 |
| QRious | Generar QR | 4.0.2 |
| html5-qrcode | Escanear QR con cámara | 2.3.8 |
| tsParticles | Fondo animado | 2.0.6 |
| PeerJS | WebRTC + señalización | 1.5.2 |
| Trystero | Descubrimiento en red | 0.25.3 |

---

## 10. PWA / Service worker (`sw.js`)

- **Caché**: `ecsend-v11` (se sube la versión para purgar caches viejas al activarse).
- **Estrategias**:
  - `index.html` (navegación): **network-first**, con fallback a `index.html` cacheado (offline).
  - `js/app.js` y `manifest.webmanifest`: **network-first** — siempre baja la última versión online, con fallback a caché offline. Detectados por `pathname` (toleran query strings de cache-busting).
  - Resto (assets, CDNs, fuentes): **cache-first** con caché en runtime de respuestas exitosas.
- **Cache-busting**: el `<script>` de `app.js` lleva `?v=N`; aún con una versión vieja del SW instalada, la query distinta falla la coincidencia de caché y fuerza la descarga de red.
- **Excepción**: `api.ipify.org` se consulta siempre en red (no se cachea la IP).
- Registro en `js/app.js` (solo en `https` o `localhost`).
- **Nota de versionado**: al desplegar cambios que rompen compatibilidad con el SW anterior, hay que **subir `CACHE_NAME`** y, si el HTML cambió, **subir `?v=`** del script de `app.js`. La primera carga tras el fix puede requerir un reload extra para que el SW nuevo (`skipWaiting` + `clients.claim`) purgue la caché vieja.

---

## 11. Publicidad

Banner estático que enlaza a `https://estalingradocorp.github.io/EstalingradoCorp/market.html` (`target="_blank"`):

1. **Modal de transferencia**: visible mientras se transfieren archivos (único banner activo; el de la vista de inicio fue retirado en v8.1).

---

## 12. Límites conocidos

- Los **navegadores no soportan mDNS/multicast** (como LocalSend): el descubrimiento necesita conexión a internet. Los **datos** de archivos sí viajan por LAN cuando es posible.
- El "Modo Local" sin STUN solo funciona si ambos están en la misma red LAN.
- En iOS, múltiples descargas simultáneas pueden fallar por restricciones del sistema (la app avisa y recomienda enviar de a uno).
- **Descubrimiento PC→móvil**: si persiste el fallo en una red específica, suele deberse a NAT/TURN (no resoluble solo con código). Mejorado con redundancia de relays y reanuncios de presencia (v8.4).