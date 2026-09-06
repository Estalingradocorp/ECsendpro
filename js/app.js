        // --- UI BÁSICA Y FUNCIONES EXPORTADAS ---
        const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

        const sanitizeFilename = (name) => (String(name ?? '').replace(/[\\/:*?"<>|\r\n]+/g, '_').trim().slice(0, 180) || 'archivo');

        window.switchView = function(targetView) {
            const views = ['start', 'receive', 'send'];
            views.forEach(view => {
                const section = document.getElementById(`view-${view}`);
                const navBtn = document.getElementById(`nav-${view}`);
                const indicator = document.getElementById(`indicator-${view}`);
                if (!section || !navBtn) return;
                
                if (view === targetView) {
                    section.classList.remove('translate-x-full', '-translate-x-full');
                    navBtn.classList.remove('text-zinc-500');
                    navBtn.classList.add('text-primary');
                    indicator.classList.remove('opacity-0');
                } else {
                    const targetIndex = views.indexOf(targetView);
                    const currIndex = views.indexOf(view);
                    section.classList.remove('translate-x-full', '-translate-x-full');
                    section.classList.add(currIndex < targetIndex ? '-translate-x-full' : 'translate-x-full');
                    navBtn.classList.add('text-zinc-500');
                    navBtn.classList.remove('text-primary');
                    indicator.classList.add('opacity-0');
                }
            });
        };

        window.showToast = function(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            let colorClass = 'border-primary/50 text-primary';
            let icon = 'info';
            if (type === 'success') { colorClass = 'border-green-500/50 text-green-400'; icon = 'check-circle'; }
            if (type === 'error') { colorClass = 'border-red-500/50 text-red-400'; icon = 'alert-circle'; }

            toast.className = `glass-panel px-4 py-3 rounded-xl border-l-4 ${colorClass} flex items-center gap-3 text-sm font-medium animate-slide-up bg-zinc-900/90`;
            toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${message}</span>`;
            
            container.appendChild(toast);
            if (window.lucide) window.lucide.createIcons();

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        window.updateProBadge = function(state) {
            const badge = document.getElementById('pro-badge');
            if (!badge) return;
            badge.className = "text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1 tracking-widest transition-all duration-500 border ";
            
            if (state === 'ready' || state === 'connecting') {
                // AZUL: Listo para conectar o conectando
                badge.className += "text-blue-400 bg-blue-500/20 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]";
            } else if (state === 'connected') {
                // VERDE: Conectado a otro dispositivo
                badge.className += "text-green-400 bg-green-500/20 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
            } else if (state === 'error') {
                // ROJO: Error o desconectado del servidor
                badge.className += "text-red-400 bg-red-500/20 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
            } else {
                // AMARILLO: Iniciando servidor
                badge.className += "text-yellow-400 bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]";
            }
        };

        window.toggleHelpModal = () => document.getElementById('modal-help').classList.toggle('hidden');
        window.toggleQRModal = () => document.getElementById('modal-qr').classList.toggle('hidden');
        window.togglePrivacyModal = () => document.getElementById('modal-privacy').classList.toggle('hidden');
        window.closeTransferModal = () => {
            document.getElementById('modal-transfer').classList.add('hidden');
            document.getElementById('btn-transfer-cancel').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('transfer-icon-container').className = "w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-bounce";
                document.getElementById('transfer-progress-bar').className = "bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]";
            }, 500);
        };

        window.cancelTransfer = () => {
            window.transferCancelled = true;
            try {
                if (activeConnection && activeConnection.open) {
                    activeConnection.send(JSON.stringify({ type: 'transfer-cancel' }));
                }
            } catch (e) {}
            selectedFiles = [];
            renderFileList();
            window.closeTransferModal();
            window.showToast('Transferencia cancelada.', 'error');
        };

        // --- SISTEMA DEL MENÚ PRINCIPAL ---
        window.toggleMainMenu = function(event) {
            if(event) event.stopPropagation();
            const menu = document.getElementById('main-menu-dropdown');
            if (menu.classList.contains('hidden')) {
                menu.classList.remove('hidden');
                menu.classList.add('flex');
                menu.classList.remove('menu-anim-out');
                void menu.offsetWidth;
                menu.classList.add('menu-anim-in');
            } else {
                menu.classList.remove('menu-anim-in');
                menu.classList.add('menu-anim-out');
                setTimeout(() => {
                    if (!menu.classList.contains('menu-anim-in')) {
                        menu.classList.add('hidden');
                        menu.classList.remove('flex', 'menu-anim-out');
                    }
                }, 160);
            }
        };

        window.toggleSettingsPanel = function(event) {
            if (event) event.stopPropagation();
            const panel = document.getElementById('settings-panel');
            const chevron = document.getElementById('settings-chevron');
            if (!panel) return;
            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                panel.classList.add('flex');
                panel.classList.remove('panel-anim-out');
                void panel.offsetWidth;
                panel.classList.add('panel-anim-in');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                panel.classList.remove('panel-anim-in');
                panel.classList.add('panel-anim-out');
                if (chevron) chevron.style.transform = '';
                setTimeout(() => {
                    if (!panel.classList.contains('panel-anim-in')) {
                        panel.classList.add('hidden');
                        panel.classList.remove('flex', 'panel-anim-out');
                    }
                }, 140);
            }
        };

        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', function(event) {
            const menu = document.getElementById('main-menu-dropdown');
            if (menu && !menu.classList.contains('hidden') && !menu.contains(event.target)) {
                window.toggleMainMenu();
            }
        });

        // --- LECTOR DE CÓDIGOS QR MEDIANTE LA CÁMARA ---
        let html5QrCode = null;

        window.startQRScanner = () => {
            document.getElementById('modal-scanner').classList.remove('hidden');
            
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("qr-reader");
            }
            
            const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
            
            // En desktop usar la cámara delantera/disponible; en móvil la trasera
            const isDesktop = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            
            const doStart = () => {
                html5QrCode.start({ facingMode: isDesktop ? "user" : "environment" }, config, (decodedText) => {
                let codeToConnect = "";
                try {
                    if (decodedText.includes('?connect=')) {
                        const urlParams = new URLSearchParams(decodedText.split('?')[1]);
                        codeToConnect = urlParams.get('connect');
                    } else if (decodedText.length === 6 && !isNaN(decodedText)) {
                        codeToConnect = decodedText;
                    }
                } catch(e) {}

                if (codeToConnect && codeToConnect.length === 6) {
                    window.stopQRScanner();
                    window.showToast("QR Escaneado", "success");
                    // Mostrar el campo manual para reflejar el código escaneado
                    const wrap = document.getElementById('manual-code-wrap');
                    if (wrap && wrap.classList.contains('hidden')) {
                        wrap.classList.remove('hidden');
                        wrap.classList.add('flex');
                        const btnManual = document.getElementById('btn-manual');
                        if (btnManual) btnManual.classList.add('hidden');
                    }
                    const input = document.getElementById('target-code');
                    if (input) input.value = codeToConnect;
                    
                    const counterEl = document.getElementById('code-counter');
                    if(counterEl) {
                        counterEl.innerText = '6/6';
                        counterEl.classList.replace('text-zinc-400', 'text-primary');
                        counterEl.classList.replace('bg-zinc-800', 'bg-primary/20');
                    }
                    // Conectar directo por peerId, sin depender del botón/form
                    setTimeout(() => {
                        if (peer) {
                            window.connectToPeerId(PREFIX + codeToConnect);
                        } else {
                            window.showToast('Servidor no disponible', 'error');
                        }
                    }, 500);
                }
            }, (errorMessage) => {
                // Ignore silent errors during scanning
            }).catch((err) => {
                window.showToast("No se pudo acceder a la cámara", "error");
                window.stopQRScanner();
            });
            };

            // Si ya estaba escaneando, detener antes de reiniciar para evitar "already running"
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(() => {}).finally(() => doStart());
            } else {
                doStart();
            }
        };

        window.stopQRScanner = () => {
            const modal = document.getElementById('modal-scanner');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error(err));
            }
        };

        // --- SISTEMA DE CONFIGURACIONES ---
        const NAME_ADJECTIVES = ['Rápido', 'Valiente', 'Sereno', 'Cobalto', 'Turquesa', 'Carmesí', 'Ágil', 'Audaz', 'Brillante', 'Dorado', 'Fugaz', 'Gigante', 'Luminoso', 'Místico', 'Nómade', 'Orbital', 'Platino', 'Radiante', 'Sigiloso', 'Tenaz', 'Vibrante', 'Zen', 'Eléctrico', 'Cósmico', 'Solar', 'Lunar', 'Veloz', 'Noble'];
        const NAME_ANIMALS = ['Tigre', 'Zorro', 'Halcón', 'Lobo', 'Panda', 'Koala', 'Cóndor', 'Puma', 'Jaguar', 'Lince', 'Nutria', 'Búho', 'Colibrí', 'Tucán', 'Flamenco', 'Delfín', 'Orca', 'Pulpo', 'Tortuga', 'Iguana', 'Vicuña', 'Guanaco', 'Tapir', 'Fénix', 'Dragón', 'León', 'Águila', 'Carpincho'];
        const AVATAR_EMOJIS = ['🦊', '🐯', '🐼', '🐨', '🦉', '🐬', '🦄', '🐙', '🦖', '🦋', '🐺', '🦁', '🐸', '🦅', '🐢', '🦜'];

        const hashCode = (str) => {
            let h = 0;
            for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) | 0;
            return Math.abs(h);
        };

        const emojiForName = (name) => AVATAR_EMOJIS[hashCode(name || '') % AVATAR_EMOJIS.length];

        const generateDeviceName = () => NAME_ADJECTIVES[Math.floor(Math.random() * NAME_ADJECTIVES.length)] + ' ' + NAME_ANIMALS[Math.floor(Math.random() * NAME_ANIMALS.length)];

        let appSettings = JSON.parse(localStorage.getItem('ecsend_settings')) || { 
            username: generateDeviceName(), 
            network: 'global', 
            sounds: true,
            dynamicBg: true,
            ecEncripP2P: false,
            discovery: true
        };
        if (typeof appSettings.dynamicBg === 'undefined') appSettings.dynamicBg = true;
        if (typeof appSettings.ecEncripP2P === 'undefined') appSettings.ecEncripP2P = false;
        if (typeof appSettings.discovery === 'undefined') appSettings.discovery = true;
        if (!appSettings.username || /^Dispositivo_\d{0,3}$/.test(appSettings.username)) {
            appSettings.username = generateDeviceName();
            localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
        }

        let transferHistory = JSON.parse(localStorage.getItem('ecsend_history')) || [];

        function renderHistory() {
            const list = document.getElementById('list-history');
            const emptyState = document.getElementById('empty-history');
            if (!list || !emptyState) return;
            
            list.innerHTML = '';
            
            if (transferHistory.length === 0) {
                list.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }
            
            list.classList.remove('hidden');
            emptyState.classList.add('hidden');

            transferHistory.forEach(item => {
                const isReceive = item.type === 'receive';
                const icon = isReceive ? 'download' : 'upload';
                const color = isReceive ? 'text-green-400' : 'text-primary';
                const bg = isReceive ? 'bg-green-500/10' : 'bg-primary/10';
                const date = new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const sizeMB = (item.size / (1024*1024)).toFixed(2);

                list.innerHTML += `
                    <li class="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <div class="p-2 ${bg} rounded-lg shrink-0">
                                <i data-lucide="${icon}" class="w-4 h-4 ${color}"></i>
                            </div>
                            <div class="truncate">
                                <p class="text-[13px] font-medium text-zinc-200 truncate">${escapeHTML(item.name)}</p>
                                <p class="text-[10px] text-zinc-500">${isReceive ? 'Recibido' : 'Enviado'} • ${sizeMB} MB</p>
                            </div>
                        </div>
                        <span class="text-[9px] text-zinc-500 shrink-0 whitespace-nowrap ml-2">${date}</span>
                    </li>
                `;
            });
            if (window.lucide) window.lucide.createIcons();
        }

        window.addHistoryItem = function(type, name, size) {
            transferHistory.unshift({ type, name, size, date: new Date().toISOString() });
            if (transferHistory.length > 20) transferHistory.pop(); // Guarda los últimos 20 elementos
            localStorage.setItem('ecsend_history', JSON.stringify(transferHistory));
            renderHistory();
        };

        let clearConfirmTimeout = null;
        window.clearAllData = function(btn) {
            const btnText = btn.innerText || btn.textContent;
            if (btnText.includes('¿Estás seguro?')) {
                localStorage.removeItem('ecsend_settings');
                localStorage.removeItem('ecsend_history');
                removeDirectoryHandle();
                downloadDirHandle = null;
                window.showToast('Datos eliminados. Reiniciando...', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4"></i> ¿Estás seguro? Toca de nuevo`;
                if (window.lucide) window.lucide.createIcons();
                btn.classList.replace('bg-red-500/10', 'bg-red-500');
                btn.classList.replace('text-red-400', 'text-white');
                
                clearTimeout(clearConfirmTimeout);
                clearConfirmTimeout = setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.replace('bg-red-500', 'bg-red-500/10');
                    btn.classList.replace('text-white', 'text-red-400');
                    if (window.lucide) window.lucide.createIcons();
                }, 3000);
            }
        };

        setTimeout(renderHistory, 500);

        // Generador de Sonidos Bip Mejorado (Envolventes suaves y armónicos)
        let audioCtx = null;

        function playTone(freq, type, startTime, duration, vol) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            
            // Envolvente para evitar "clicks" de audio (Ataque rápido, decaimiento exponencial)
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        }

        function playBeep(type) {
            try {
                if (!appSettings.sounds) return;
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                
                const t = audioCtx.currentTime;

                if (type === 'connect') {
                    // Tono de conexión: Doble campana suave y alegre
                    playTone(600, 'sine', t, 0.15, 0.1);
                    playTone(800, 'sine', t + 0.1, 0.25, 0.1);
                } else if (type === 'receive') {
                    // Tono de archivo recibido: Arpegio ascendente majestuoso (Acorde mayor)
                    playTone(523.25, 'sine', t, 0.2, 0.1);       // Do
                    playTone(659.25, 'sine', t + 0.1, 0.2, 0.1); // Mi
                    playTone(783.99, 'sine', t + 0.2, 0.4, 0.1); // Sol
                } else if (type === 'chat') {
                    // Tono de chat: Burbuja rápida / Pop
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.type = 'sine';
                    
                    // Caída rápida de tono para simular una burbuja
                    osc.frequency.setValueAtTime(800, t);
                    osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
                    
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    
                    osc.start(t);
                    osc.stop(t + 0.1);
                } else if (type === 'disconnect') {
                    // Tono de desconexión: Alerta descendente
                    playTone(400, 'triangle', t, 0.15, 0.1);
                    playTone(300, 'triangle', t + 0.15, 0.3, 0.1);
                }
            } catch(e) {
                console.warn("Sonido silenciado por política del navegador.", e);
            }
        }

        // Llenar UI de Ajustes
        document.getElementById('setting-username').value = appSettings.username;
        document.getElementById('setting-network').value = appSettings.network;
        
        function updateUIStates() {
            const soundUi = document.getElementById('toggle-sound-ui');
            const soundCircle = document.getElementById('toggle-sound-circle');
            if (soundUi && soundCircle) {
                if (appSettings.sounds) {
                    soundUi.classList.replace('bg-zinc-700', 'bg-primary');
                    soundCircle.classList.add('translate-x-5');
                } else {
                    soundUi.classList.replace('bg-primary', 'bg-zinc-700');
                    soundCircle.classList.remove('translate-x-5');
                }
            }
            
            const bgUi = document.getElementById('toggle-bg-ui');
            const bgCircle = document.getElementById('toggle-bg-circle');
            const bgContainer = document.getElementById('dynamic-bg');
            if (bgUi && bgCircle) {
                if (appSettings.dynamicBg) {
                    if (bgContainer) bgContainer.style.opacity = '1';
                    bgUi.classList.replace('bg-zinc-700', 'bg-primary');
                    bgCircle.classList.add('translate-x-5');
                } else {
                    if (bgContainer) bgContainer.style.opacity = '0';
                    bgUi.classList.replace('bg-primary', 'bg-zinc-700');
                    bgCircle.classList.remove('translate-x-5');
                }
            }

            const encripUi = document.getElementById('toggle-encrip-ui');
            const encripCircle = document.getElementById('toggle-encrip-circle');
            if (encripUi && encripCircle) {
                if (appSettings.ecEncripP2P) {
                    encripUi.classList.replace('bg-zinc-700', 'bg-primary');
                    encripCircle.classList.add('translate-x-5');
                } else {
                    encripUi.classList.replace('bg-primary', 'bg-zinc-700');
                    encripCircle.classList.remove('translate-x-5');
                }
            }

            const discUi = document.getElementById('toggle-disc-ui');
            const discCircle = document.getElementById('toggle-disc-circle');
            if (discUi && discCircle) {
                if (appSettings.discovery) {
                    discUi.classList.replace('bg-zinc-700', 'bg-primary');
                    discCircle.classList.add('translate-x-5');
                } else {
                    discUi.classList.replace('bg-primary', 'bg-zinc-700');
                    discCircle.classList.remove('translate-x-5');
                }
            }
        }
        updateUIStates();

        document.getElementById('setting-username').addEventListener('change', (e) => {
            appSettings.username = e.target.value.trim() || generateDeviceName();
            localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
            window.showToast('Nombre actualizado', 'success');
            if (window.__sendPresence) {
                try { window.__sendPresence(presencePayload()); } catch (err) {}
            }
        });

        window.regenerateName = () => {
            appSettings.username = generateDeviceName();
            localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
            document.getElementById('setting-username').value = appSettings.username;
            window.showToast('Nuevo nombre: ' + appSettings.username + ' ' + emojiForName(appSettings.username), 'success');
            if (window.__sendPresence) {
                try { window.__sendPresence(presencePayload()); } catch (err) {}
            }
        };
        document.getElementById('setting-network').addEventListener('change', (e) => {
            appSettings.network = e.target.value;
            localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
            window.showToast('Red cambiada. Reiniciando...', 'info');
            setTimeout(() => window.location.reload(), 1000);
        });
        document.getElementById('toggle-sound-btn').addEventListener('click', () => {
            appSettings.sounds = !appSettings.sounds;
            localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
            updateUIStates();
            if (appSettings.sounds) playBeep('connect');
        });
        
        const toggleBgBtn = document.getElementById('toggle-bg-btn');
        if (toggleBgBtn) {
            toggleBgBtn.addEventListener('click', () => {
                appSettings.dynamicBg = !appSettings.dynamicBg;
                localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
                updateUIStates();
            });
        }

        const toggleEncripBtn = document.getElementById('toggle-encrip-btn');
        if (toggleEncripBtn) {
            toggleEncripBtn.addEventListener('click', () => {
                appSettings.ecEncripP2P = !appSettings.ecEncripP2P;
                localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
                updateUIStates();
                if (appSettings.ecEncripP2P) {
                    window.showToast('ECEncripP2P Activado', 'success');
                } else {
                    window.showToast('ECEncripP2P Desactivado', 'info');
                }
            });
        }

        const toggleDiscBtn = document.getElementById('toggle-disc-btn');
        if (toggleDiscBtn) {
            toggleDiscBtn.addEventListener('click', () => {
                appSettings.discovery = !appSettings.discovery;
                localStorage.setItem('ecsend_settings', JSON.stringify(appSettings));
                updateUIStates();
                if (appSettings.discovery) {
                    window.showToast('Descubrimiento activado', 'success');
                    initDiscovery();
                } else {
                    stopDiscovery();
                    window.showToast('Descubrimiento desactivado', 'info');
                }
            });
        }

        // --- PERSISTENCIA DE CARPETA DE DESCARGA (IndexedDB) ---
        const DB_NAME = 'ecsend-download-db';
        const DB_STORE = 'handles';
        const DB_KEY = 'downloadDir';
        let downloadDirHandle = null;

        function openDownloadDB() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }

        async function saveDirectoryHandle(handle) {
            const db = await openDownloadDB();
            const tx = db.transaction(DB_STORE, 'readwrite');
            tx.objectStore(DB_STORE).put(handle, DB_KEY);
            return new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
        }

        async function loadDirectoryHandle() {
            try {
                const db = await openDownloadDB();
                const tx = db.transaction(DB_STORE, 'readonly');
                const req = tx.objectStore(DB_STORE).get(DB_KEY);
                return new Promise((resolve) => { req.onsuccess = () => resolve(req.result || null); req.onerror = () => resolve(null); });
            } catch { return null; }
        }

        async function removeDirectoryHandle() {
            try {
                const db = await openDownloadDB();
                const tx = db.transaction(DB_STORE, 'readwrite');
                tx.objectStore(DB_STORE).delete(DB_KEY);
            } catch {}
        }

        function updateDownloadPathUI() {
            const display = document.getElementById('download-path-display');
            const clearBtn = document.getElementById('btn-clear-download-path');
            const warnEl = document.getElementById('download-path-warning');
            const selectBtn = document.getElementById('btn-select-folder');
            const isSupported = 'showDirectoryPicker' in window;

            if (!isSupported) {
                if (warnEl) warnEl.classList.remove('hidden');
                if (selectBtn) selectBtn.classList.add('hidden');
                if (display) { display.innerText = 'No compatible con este navegador'; display.classList.replace('text-white', 'text-zinc-400'); }
                return;
            }
            if (warnEl) warnEl.classList.add('hidden');
            if (selectBtn) selectBtn.classList.remove('hidden');

            if (downloadDirHandle) {
                display.innerText = downloadDirHandle.name;
                display.classList.replace('text-zinc-400', 'text-white');
                if (clearBtn) clearBtn.classList.remove('hidden');
            } else {
                display.innerText = 'Descarga predeterminada del navegador';
                display.classList.replace('text-white', 'text-zinc-400');
                if (clearBtn) clearBtn.classList.add('hidden');
            }
        }

        window.selectDownloadFolder = async function() {
            if (!('showDirectoryPicker' in window)) {
                window.showToast('Tu navegador no soporta carpetas personalizadas', 'error');
                return;
            }
            try {
                downloadDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                await saveDirectoryHandle(downloadDirHandle);
                updateDownloadPathUI();
                window.showToast('Carpeta de descarga configurada', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') window.showToast('Error al seleccionar carpeta', 'error');
            }
        };

        window.clearDownloadPath = async function() {
            downloadDirHandle = null;
            await removeDirectoryHandle();
            updateDownloadPathUI();
            window.showToast('Usando descarga predeterminada', 'info');
        };

        (async () => {
            try {
                const savedHandle = await loadDirectoryHandle();
                if (savedHandle) {
                    const perm = await savedHandle.requestPermission({ mode: 'readwrite' });
                    if (perm === 'granted') downloadDirHandle = savedHandle;
                    else await removeDirectoryHandle();
                }
            } catch { await removeDirectoryHandle(); }
            updateDownloadPathUI();
        })();

        // --- VARIABLES GLOBALES DE WEBRTC ---
        if (window.lucide) window.lucide.createIcons();
        const PREFIX = "ecsend-";
        let myRawCode = Math.floor(100000 + Math.random() * 900000).toString();
        let myPeerId = PREFIX + myRawCode;
        
        let peer = null;
        let activeConnection = null;
        let selectedFiles = [];
        let keepAliveInterval = null;

        window.batchTotalSize = 0;
        window.batchTotalFiles = 0;
        window.batchBytesSent = 0;
        window.batchCurrentIndex = 1;
        window.batchBytesReceived = 0;

        document.getElementById('my-code').innerText = myRawCode.match(/.{1,3}/g).join('-');

        // --- CARGA RÁPIDA ESTALINGRADO ---
        const splash = document.getElementById('splash');
        const progressBar = document.getElementById('loading-progress-bar');
        const percentText = document.getElementById('loading-percent');
        let startAnimTime = null; 
        function animateLoader(timestamp) {
            if(!startAnimTime) startAnimTime = timestamp; 
            const elapsed = timestamp - startAnimTime; 
            const progress = Math.min((elapsed / 800) * 100, 100);
            if(progressBar) progressBar.style.width = progress + '%'; 
            if(percentText) percentText.textContent = Math.floor(progress) + '%';
            
            if(progress < 100) requestAnimationFrame(animateLoader);
            else setTimeout(() => { if(splash) { splash.style.opacity = '0'; setTimeout(() => splash.classList.add('hidden'), 500); } }, 150);
        }
requestAnimationFrame(animateLoader);
        // Seguridad: nunca dejar el splash tapando la pantalla (bloquea clicks)
        setTimeout(() => {
            if (splash && !splash.classList.contains('hidden')) {
                splash.style.opacity = '0';
                setTimeout(() => splash.classList.add('hidden'), 750);
            }
        }, 2500);

        if (window.QRious) {
            new window.QRious({
                element: document.getElementById('qr-canvas'),
                value: window.location.href.split('?')[0] + `?connect=${myRawCode}`,
                size: 200, background: '#ffffff', foreground: '#09090b', level: 'M'
            });
        }

        function fallbackCopy(text, successMsg) {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand('copy');
                window.showToast(successMsg, 'success');
            } catch (err) {
                window.showToast('Error al copiar', 'error');
            }
            document.body.removeChild(ta);
        }

        window.copyMyCode = () => {
            const text = myRawCode;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => window.showToast('Código copiado', 'success'))
                .catch(() => fallbackCopy(text, 'Código copiado'));
            } else {
                fallbackCopy(text, 'Código copiado');
            }
        };

        window.shareLink = () => {
            const link = window.location.href.split('?')[0] + '?connect=' + myRawCode;
            
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(link).then(() => window.showToast('Enlace copiado listo para pegar', 'success'))
                .catch(() => fallbackCopy(link, 'Enlace copiado listo para pegar'));
            } else {
                fallbackCopy(link, 'Enlace copiado listo para pegar');
            }
        };

        // --- INICIAR PEERJS ---
        function initPeer() {
            try {
                if (typeof Peer === 'undefined') return console.warn("PeerJS no cargó.");
                
                window.updateProBadge('starting');

                const iceServers = appSettings.network === 'global' 
                    ? [ { urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' } ] 
                    : [];

                peer = new Peer(myPeerId, { debug: 2, config: { 'iceServers': iceServers } });

                peer.on('open', (id) => {
                    document.getElementById('status-dot').classList.remove('bg-yellow-500', 'bg-red-500');
                    document.getElementById('status-dot').classList.add('bg-green-500');
                    document.getElementById('status-text').innerText = appSettings.network === 'global' ? "En Línea (Global)" : "En Línea (Wi-Fi Local)";
                    window.updateProBadge('ready');
                    checkURLParams();
                    // Re-anunciar presencia con el peerId fresco (tras rotación de código o reconexión)
                    if (window.__sendPresence && discoveryRoom) {
                        try { window.__sendPresence(presencePayload()); } catch (err) {}
                    }
                });

                peer.on('connection', (conn) => {
                    window.updateProBadge('connecting');
                    window.showToast('Recibiendo solicitud de conexión...', 'info');
                    const handleConnection = () => {
                        if (activeConnection === conn) return;
                        setupConnection(conn);
                        window.showToast(`Dispositivo vinculado`, 'success');
                        updateUIConnected();
                        try { conn.send(JSON.stringify({ type: 'handshake', username: appSettings.username, isApple: /iPad|iPhone|iPod|Mac/i.test(navigator.userAgent) })); } catch(e){}
                    };
                    conn.on('open', handleConnection);
                    if (conn.open) handleConnection();
                });

                // NUEVO: Reconectar automáticamente si el celular duerme la pestaña por ir a WhatsApp
                peer.on('disconnected', () => {
                    document.getElementById('status-dot').classList.remove('bg-green-500');
                    document.getElementById('status-dot').classList.add('bg-yellow-500');
                    document.getElementById('status-text').innerText = "Reconectando...";
                    window.updateProBadge('error');
                    if (!peer.destroyed) {
                        peer.reconnect();
                    }
                });

                peer.on('error', (err) => {
                    window.updateProBadge('error');
                    if (err.type === 'peer-unavailable') {
                        window.showToast('Dispositivo no encontrado. Pídele a tu amigo que mantenga la pantalla encendida.', 'error');
                    } else {
                        window.showToast('Error de red. Por favor, recarga la página.', 'error');
                    }
                    resetConnectionUI();
                });
            } catch (e) {
                console.warn("Error PeerJS:", e);
            }
        }
        setTimeout(initPeer, 800);
        setTimeout(initDiscovery, 1200);

        // NUEVO: Detección cuando el usuario vuelve de WhatsApp a la pestaña
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (peer && peer.disconnected && !peer.destroyed) {
                    document.getElementById('status-text').innerText = "Despertando...";
                    peer.reconnect();
                }
                // Re-anunciar presencia al volver a la pestaña (el navegador pausa timers en segundo plano)
                if (window.__sendPresence && discoveryRoom) {
                    try {
                        window.__sendPresence(presencePayload());
                        pruneNearby();
                    } catch (err) {}
                }
            }
        });

        function checkURLParams() {
            const urlParams = new URLSearchParams(window.location.search);
            const connectCode = urlParams.get('connect');
            if (connectCode && connectCode !== myRawCode) {
                window.history.replaceState({}, document.title, window.location.pathname);
                window.switchView('start');
                document.getElementById('target-code').value = connectCode;
                setTimeout(() => window.connectToPeer(), 800);
            }
        }

        window.connectToPeer = () => {
            if (!peer) return window.showToast('Servidor no disponible', 'error');
            const input = document.getElementById('target-code');
            const codeVal = input.value.trim().replace(/-/g, '');
            if (codeVal.length !== 6) return window.showToast('El código debe tener 6 dígitos.', 'error');
            if (codeVal === myRawCode) return window.showToast('No puedes conectarte a ti mismo.', 'error');
            connectToPeerId(PREFIX + codeVal);
        };

        window.toggleManualCode = function() {
            const wrap = document.getElementById('manual-code-wrap');
            const btnManual = document.getElementById('btn-manual');
            if (!wrap) return;
            if (wrap.classList.contains('hidden')) {
                wrap.classList.remove('hidden');
                wrap.classList.add('flex');
                if (btnManual) btnManual.classList.add('hidden');
                setTimeout(() => {
                    const input = document.getElementById('target-code');
                    if (input) input.focus();
                }, 100);
            } else {
                wrap.classList.add('hidden');
                wrap.classList.remove('flex');
                if (btnManual) btnManual.classList.remove('hidden');
            }
        };

        window.connectToPeerId = (targetPeerId) => {
            if (!peer) return window.showToast('Servidor no disponible', 'error');
            if (targetPeerId === myPeerId) return;
            if (activeConnection && activeConnection.open) return window.showToast('Ya hay una conexión activa. Desconectá primero.', 'info');

            window.updateProBadge('connecting');
            window.showToast('Estableciendo conexión P2P...', 'info');

            const btn = document.getElementById('btn-connect');
            const input = document.getElementById('target-code');
            btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>`;
            btn.disabled = true;
            input.disabled = true;
            if (window.lucide) window.lucide.createIcons();

            const tryConnect = () => {
                let conn;
                try {
                    conn = peer.connect(targetPeerId, { reliable: true });
                } catch (e) {
                    window.showToast('Fallo al enlazar. Por favor, recarga la página.', 'error');
                    resetConnectionUI();
                    return;
                }
                if (!conn) {
                    window.showToast('Fallo al enlazar. Por favor, recarga la página.', 'error');
                    resetConnectionUI();
                    return;
                }

                // Timeout de aviso si tarda demasiado
                const connectionTimeout = setTimeout(() => {
                    if (btn.disabled) window.showToast('La red está demorando. Espera o recarga la página...', 'info');
                }, 10000);

                conn.on('error', (err) => {
                    clearTimeout(connectionTimeout);
                    window.showToast('Fallo al enlazar. Por favor, recarga la página.', 'error');
                    resetConnectionUI();
                });

                conn.on('close', () => {
                    clearTimeout(connectionTimeout);
                    if (btn.disabled) resetConnectionUI();
                });

                conn.on('open', () => {
                    clearTimeout(connectionTimeout);
                    input.disabled = false;
                    setupConnection(conn);
                    window.showToast('¡Enlazado exitosamente!', 'success');
                    updateUIConnected();
                    try { conn.send(JSON.stringify({ type: 'handshake', username: appSettings.username, isApple: /iPad|iPhone|iPod|Mac/i.test(navigator.userAgent) })); } catch(e){}
                });
            };

            // Esperar a que el peer esté abierto antes de conectar (evita fallos por peer no listo)
            const ensureAndConnect = () => {
                if (peer.disconnected && !peer.destroyed) {
                    // El peer se desconectó del broker PeerJS Cloud; reconectar antes de conectar
                    try { peer.reconnect(); } catch (e) {}
                    setTimeout(tryConnect, 800);
                } else {
                    tryConnect();
                }
            };

            if (peer.open) {
                ensureAndConnect();
            } else {
                let waited = 0;
                const waitForOpen = setInterval(() => {
                    if (peer.open) {
                        clearInterval(waitForOpen);
                        ensureAndConnect();
                    } else if (waited >= 6000) {
                        clearInterval(waitForOpen);
                        window.showToast('Servidor aún no está listo. Recargá la página.', 'error');
                        resetConnectionUI();
                    }
                    waited += 500;
                }, 500);
            }
        };

        // --- DESCUBRIMIENTO EN LA MISMA RED (ESTILO LOCALSEND) ---
        const nearbyDevices = new Map();
        let discoveryRoom = null;
        let discoveryStarted = false;
        const NEARBY_TTL = 90 * 1000;
        const PRESENCE_INTERVAL = 30 * 1000;

        const presencePayload = () => ({ pid: myPeerId, name: appSettings.username, emoji: emojiForName(appSettings.username) });

        function pruneNearby() {
            const now = Date.now();
            let changed = false;
            for (const [key, device] of nearbyDevices) {
                if (now - device.ts > NEARBY_TTL) {
                    nearbyDevices.delete(key);
                    changed = true;
                }
            }
            if (changed) renderNearby();
        }

        function renderNearby() {
            const panel = document.getElementById('nearby-panel');
            if (!panel) return;
            if (!appSettings.discovery) {
                panel.classList.add('hidden');
                return;
            }
            panel.classList.remove('hidden');
            const list = document.getElementById('list-nearby');
            const status = document.getElementById('nearby-status');
            const count = document.getElementById('nearby-count');
            const devices = [...nearbyDevices.values()].filter((d) => d.pid !== myPeerId);

            if (!discoveryRoom) {
                status.innerHTML = `<i data-lucide="wifi-off" class="w-7 h-7 mb-2 mx-auto opacity-40"></i><p class="text-xs">Descubrimiento no disponible en esta red</p>`;
                status.classList.remove('hidden');
                list.innerHTML = '';
                count.classList.add('hidden');
            } else if (devices.length === 0) {
                status.innerHTML = `<i data-lucide="radar" class="w-7 h-7 mb-2 mx-auto opacity-40 animate-pulse"></i><p class="text-xs">Buscando dispositivos en tu Wi-Fi...</p>`;
                status.classList.remove('hidden');
                count.classList.add('hidden');
            } else {
                status.classList.add('hidden');
                count.innerText = devices.length;
                count.classList.remove('hidden');
                list.innerHTML = devices.map((d) => `
                    <li class="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <div class="w-9 h-9 rounded-lg bg-primary/10 border border-white/5 flex items-center justify-center text-lg shrink-0">${d.emoji}</div>
                            <div class="truncate">
                                <p class="text-[13px] font-medium text-zinc-200 truncate">${escapeHTML(d.name || 'Dispositivo')}</p>
                                <p class="text-[10px] text-green-400">● Disponible en tu red</p>
                            </div>
                        </div>
                        <button data-pid="${escapeHTML(d.pid)}" class="btn-nearby-connect p-2 text-primary bg-primary/10 rounded-lg active:scale-95 transition-transform shrink-0" title="Conectar ahora"><i data-lucide="zap" class="w-4 h-4"></i></button>
                    </li>`).join('');
            }
            if (window.lucide) window.lucide.createIcons();
        }

        function stopDiscovery() {
            nearbyDevices.clear();
            renderNearby();
            if (discoveryRoom) {
                try { discoveryRoom.leave(); } catch (err) {}
                discoveryRoom = null;
                discoveryStarted = false;
            }
        }

        async function initDiscovery() {
            if (!appSettings.discovery || discoveryStarted) return;
            discoveryStarted = true;
            try {
                const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
                const data = await res.json();
                const octets = String(data.ip || '').split('.');
                if (octets.length !== 4) throw new Error('IP pública no válida');
                const netKey = octets.slice(0, 3).join('.');

                const trystero = await import('https://cdn.jsdelivr.net/npm/trystero@0.25.3/+esm');
                if (!appSettings.discovery) return;

                discoveryRoom = trystero.joinRoom({ appId: 'ecsend-estalingrado', relayConfig: { redundancy: 3 } }, 'ecsend-net-' + netKey);
                const presence = discoveryRoom.makeAction('presence');
                window.__sendPresence = (payload, target) => {
                    try {
                        const result = target ? presence.send(payload, { target }) : presence.send(payload);
                        if (result && typeof result.catch === 'function') result.catch(() => {});
                    } catch (err) {}
                };

                discoveryRoom.onPeerJoin = (trysteroPeerId) => {
                    window.__sendPresence(presencePayload(), trysteroPeerId);
                    renderNearby();
                };

                discoveryRoom.onPeerLeave = (trysteroPeerId) => {
                    nearbyDevices.delete(trysteroPeerId);
                    renderNearby();
                };

                presence.onMessage = (payload, meta) => {
                    const trysteroPeerId = meta && meta.peerId;
                    if (!payload || !payload.pid || payload.pid === myPeerId || !trysteroPeerId) return;
                    nearbyDevices.set(trysteroPeerId, {
                        pid: String(payload.pid),
                        name: String(payload.name || 'Dispositivo').slice(0, 40),
                        emoji: AVATAR_EMOJIS.includes(payload.emoji) ? payload.emoji : emojiForName(payload.name),
                        ts: Date.now()
                    });
                    window.__sendPresence(presencePayload(), trysteroPeerId);
                    renderNearby();
                };

                setInterval(() => {
                    if (!discoveryRoom) return;
                    window.__sendPresence(presencePayload());
                    pruneNearby();
                }, PRESENCE_INTERVAL);

                window.__sendPresence(presencePayload());
                renderNearby();
            } catch (err) {
                console.warn('Descubrimiento no disponible:', err);
                discoveryRoom = null;
                renderNearby();
            }
        }

        const nearbyList = document.getElementById('list-nearby');
        if (nearbyList) {
            nearbyList.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-nearby-connect');
                if (!btn) return;
                const pid = btn.getAttribute('data-pid');
                if (pid) window.connectToPeerId(pid);
            });
        }

        // --- SISTEMA WEBRTC CORE CORREGIDO ---
        let incomingFileInfo = null, incomingData = [], incomingBytes = 0;

        function setupConnection(conn) {
            activeConnection = conn;
            playBeep('connect');
            stopCodeTimer();

            // Cerrar modales de QR automáticamente al enlazarse exitosamente
            document.getElementById('modal-qr').classList.add('hidden');
            if (html5QrCode && html5QrCode.isScanning) {
                window.stopQRScanner();
            } else {
                document.getElementById('modal-scanner').classList.add('hidden');
            }

            // Detección avanzada de caídas de red (WebRTC ICE State)
            let iceTimeout = null;
            if (conn.peerConnection) {
                conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
                    const state = conn.peerConnection.iceConnectionState;
                    if (state === 'disconnected') {
                        // Dar 30 segundos de gracia cuando el navegador se va a segundo plano (ej. al abrir la galería)
                        iceTimeout = setTimeout(() => {
                            if (activeConnection === conn) conn.close();
                        }, 30000);
                    } else if (state === 'connected' || state === 'completed') {
                        if (iceTimeout) clearTimeout(iceTimeout);
                    } else if (state === 'failed' || state === 'closed') {
                        if (activeConnection === conn) conn.close();
                    }
                });
            }

            clearInterval(keepAliveInterval);
            keepAliveInterval = setInterval(() => {
                if (activeConnection && activeConnection.open) {
                    try { activeConnection.send(JSON.stringify({ type: 'ping' })); } catch(e){}
                }
            }, 3000);

            conn.on('data', (data) => {
                if (typeof data === 'string') {
                    try {
                        const msg = JSON.parse(data);
                        if (msg.type === 'ping') return;
                        
                        if (msg.type === 'handshake') {
                            document.getElementById('connection-status-text').innerText = `Conectado con: ${msg.username}`;
                            
                            // Detección de Dispositivo Apple
                            const appleWarning = document.getElementById('apple-warning');
                            if (msg.isApple) {
                                appleWarning.classList.remove('hidden');
                                appleWarning.classList.add('flex');
                                setTimeout(() => {
                                    window.showToast(`¡Aviso! Dispositivo Apple detectado. Lee la recomendación en la pestaña "ENVIAR".`, 'error');
                                }, 1000);
                            } else {
                                appleWarning.classList.add('hidden');
                                appleWarning.classList.remove('flex');
                            }
                            return;
                        }

                        if (msg.type === 'chat') {
                            window.receiveChatMessage(msg.text);
                            return;
                        }

                        // --- NUEVO: ESCUCHAR SI EL DESTINATARIO RECHAZÓ ---
                        if (msg.type === 'transfer-rejected') {
                            window.showToast('El destinatario rechazó la transferencia.', 'error');
                            window.transferCancelled = true;
                            window.closeTransferModal();
                            window.clearSelection(); // Vacía la cola del emisor
                            return;
                        }

                        if (msg.type === 'transfer-cancel') {
                            window.transferRejected = true;
                            incomingData = [];
                            incomingFileInfo = null;
                            window.closeTransferModal();
                            window.showToast('El remitente canceló la transferencia.', 'error');
                            return;
                        }

                        if (msg.type === 'header') {
                            // --- NUEVO: SISTEMA DE CONFIRMACIÓN DE SEGURIDAD ---
                            if (msg.batchCurrentIndex === 1) {
                                const totalMB = (msg.batchTotalSize / (1024 * 1024)).toFixed(2);
                                const confirmMsg = `⚠️ Petición entrante de seguridad:\n\n¿Deseas recibir ${msg.batchTotalFiles} archivo(s) con un total de ${totalMB} MB?`;
                                
                                if (!window.confirm(confirmMsg)) {
                                    window.transferRejected = true;
                                    activeConnection.send(JSON.stringify({ type: 'transfer-rejected' }));
                                    return;
                                }
                                window.transferRejected = false;
                                
                                window.batchBytesReceived = 0;
                                openTransferModal(
                                    msg.batchTotalFiles > 1 ? `Recibiendo ${msg.batchTotalFiles} archivos...` : msg.name, 
                                    msg.batchTotalSize, 
                                    'receive'
                                );
                            } else {
                                if (window.transferRejected) return; // Ignorar el resto del lote si se rechazó
                                document.getElementById('transfer-filename').innerText = `Recibiendo archivo ${msg.batchCurrentIndex} de ${msg.batchTotalFiles}...`;
                            }

                            incomingFileInfo = msg; incomingData = []; incomingBytes = 0;
                            // --- FIN NUEVO SISTEMA ---
                            
                        } else if (msg.type === 'eof') {
                            if (window.transferRejected) return; // <-- NUEVA LÍNEA: Abortar si fue rechazado
                            
                            try { activeConnection.send(JSON.stringify({ type: 'eof-ack' })); } catch(e){}
                            processIncomingFile();
                            
                            if (incomingFileInfo.batchCurrentIndex >= incomingFileInfo.batchTotalFiles) {
                                finishReceivingBatch();
                            }
                        } else if (msg.type === 'eof-ack') {
                            if (selectedFiles.length > 0) {
                                const sentFile = selectedFiles.shift(); 
                                window.addHistoryItem('send', sentFile.name, sentFile.size);
                                renderFileList();
                            }
                            
                            if (selectedFiles.length > 0) {
                                window.batchCurrentIndex++;
                                document.getElementById('transfer-title').innerText = 'Preparando siguiente...';
                                setTimeout(() => sendNextFile(), 50);
                            } else {
                                finishSendingBatch();
                            }
                        }
                    } catch(e) {
                        console.warn("Mensaje JSON corrupto", e);
                    }
                } else {
                    // --- NUEVO: BLOQUEAR RECEPCIÓN BINARIA SI FUE RECHAZADA ---
                    if (window.transferRejected) return; 

                    // Corrección: Soporte mejorado para calcular los bytes recibidos sin NaN
                    const chunkLength = data.byteLength || data.size || data.length || 0;
                    incomingData.push(data); 
                    incomingBytes += chunkLength;
                    window.batchBytesReceived += chunkLength;
                    
                    if (incomingFileInfo) updateTransferProgress(window.batchBytesReceived, incomingFileInfo.batchTotalSize);
                }
            });
            conn.on('close', () => {
                playBeep('disconnect');
                window.showToast('Se perdió la conexión con el dispositivo.', 'error');
                
                // Si había una transferencia en progreso, la cancelamos visualmente
                const transferModal = document.getElementById('modal-transfer');
                if (!transferModal.classList.contains('hidden')) {
                    window.closeTransferModal();
                    setTimeout(() => window.showToast('Transferencia interrumpida', 'error'), 500);
                }
                
                resetConnectionUI();
            });
        }

        function updateUIConnected() {
            window.updateProBadge('connected');
            const btn = document.getElementById('btn-connect');
            btn.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i>`;
            btn.classList.replace('bg-primary', 'bg-green-600');
            document.getElementById('connection-status').classList.remove('hidden');
            document.getElementById('connection-status').classList.add('flex');
            
            document.getElementById('btn-floating-chat').classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
            updateSendButton();
        }

        function resetConnectionUI() {
            window.updateProBadge('ready');
            clearInterval(keepAliveInterval);
            
            // Ocultar la advertencia de Apple al desconectarse
            const appleWarning = document.getElementById('apple-warning');
            if (appleWarning) {
                appleWarning.classList.add('hidden');
                appleWarning.classList.remove('flex');
            }

            const btn = document.getElementById('btn-connect');
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="link" class="w-5 h-5"></i>`;
            btn.classList.replace('bg-green-600', 'bg-primary');
            
            const input = document.getElementById('target-code');
            if(input) input.disabled = false;
            
            document.getElementById('connection-status').classList.add('hidden');
            document.getElementById('connection-status').classList.remove('flex');
            document.getElementById('connection-status-text').innerText = "Conectado. Listo para enviar.";
            
            document.getElementById('btn-floating-chat').classList.add('hidden');
            
            // Cerrar el chat al desconectar para evitar estado desincronizado
            const chatModal = document.getElementById('modal-chat');
            if (chatModal) {
                isChatOpen = false;
                chatModal.classList.add('hidden');
                chatModal.classList.remove('flex');
            }
            
            document.getElementById('chat-messages').innerHTML = `
                <div id="chat-empty-state" class="flex flex-col items-center justify-center h-full text-center opacity-60 mt-4">
                    <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 shadow-lg border border-white/5">
                        <i data-lucide="shield-check" class="w-8 h-8 text-primary"></i>
                    </div>
                    <p class="text-[11px] font-bold text-zinc-300 uppercase tracking-widest bg-zinc-900/80 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">Conexión Cifrada</p>
                    <p class="text-[11px] text-zinc-500 max-w-[220px] mt-3 leading-relaxed">Nadie fuera de este chat puede leer los mensajes. Se autodestruyen al desconectar.</p>
                </div>`;
            unreadChatMessages = 0;
            if (window.updateChatBadge) window.updateChatBadge();

            if (window.lucide) window.lucide.createIcons();
            activeConnection = null;
            updateSendButton();
            startCodeTimer();
        }

        // --- SISTEMA DE ARCHIVOS ---
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('opacity-50'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('opacity-50'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('opacity-50');
            if(e.dataTransfer.files.length) {
                showFileLoading();
                setTimeout(() => addFiles(Array.from(e.dataTransfer.files)), 100);
            }
        });

        const handleFileSelect = (e) => {
            if(e.target.files.length) {
                showFileLoading();
                // Usamos setTimeout para permitir que el modal se renderice antes de procesar archivos pesados
                setTimeout(() => {
                    addFiles(Array.from(e.target.files));
                    e.target.value = '';
                }, 100);
            } else {
                e.target.value = '';
            }
        };

        function showFileLoading() {
            const modal = document.getElementById('modal-file-loading');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        function hideFileLoading() {
            const modal = document.getElementById('modal-file-loading');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }
        
        document.getElementById('file-input-gallery').addEventListener('change', handleFileSelect);
        document.getElementById('file-input-docs').addEventListener('change', handleFileSelect);

        function addFiles(files) { 
            selectedFiles = [...selectedFiles, ...files]; 
            renderFileList(); 
            hideFileLoading();
        }
        
        window.removeFile = (index) => { selectedFiles.splice(index, 1); renderFileList(); };
        window.clearSelection = () => { selectedFiles = []; renderFileList(); };

        function renderFileList() {
            const list = document.getElementById('list-selected');
            const clearBtn = document.getElementById('btn-clear-files');
            clearBtn.classList.toggle('hidden', selectedFiles.length === 0);

            let htmlString = '';
            selectedFiles.forEach((file, idx) => {
                const size = (file.size / (1024*1024)).toFixed(2);
                const isContact = file.name.toLowerCase().endsWith('.vcf') || file.type.includes('vcard');
                const icon = isContact ? 'users' : 'file-text';
                const iconColor = isContact ? 'text-yellow-400' : 'text-primary';

                htmlString += `
                    <li class="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/5">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <i data-lucide="${icon}" class="w-5 h-5 ${iconColor} shrink-0"></i>
                            <div class="truncate">
                                <p class="text-sm font-medium text-zinc-200 truncate">${escapeHTML(file.name)}</p>
                                <p class="text-[10px] text-zinc-500">${size} MB</p>
                            </div>
                        </div>
                        <button onclick="window.removeFile(${idx})" class="p-2 text-zinc-500 hover:text-red-400 shrink-0"><i data-lucide="x" class="w-4 h-4"></i></button>
                    </li>`;
            });
            
            list.innerHTML = htmlString;
            if (window.lucide) window.lucide.createIcons();
            updateSendButton();
        }

        function updateSendButton() {
            const btn = document.getElementById('btn-send');
            if (!btn) return;

            if (selectedFiles.length > 0 && activeConnection && activeConnection.open) {
                btn.disabled = false;
                btn.className = "w-full py-4 mb-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-2xl font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.3)] active:scale-95";
            } else {
                btn.disabled = true;
                btn.className = "w-full py-4 mb-6 bg-zinc-800 text-zinc-500 rounded-2xl font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-not-allowed";
            }
            
            // Forzamos el contenido interno para evitar que se dupliquen elementos visuales
            btn.innerHTML = `<i data-lucide="send" class="w-5 h-5"></i> Enviar Archivos`;
            if (window.lucide) window.lucide.createIcons();
        }

        window.sendSelectedFiles = () => {
            if (!activeConnection || !activeConnection.open || selectedFiles.length === 0) return;
            
            window.transferCancelled = false;
            window.batchTotalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
            window.batchTotalFiles = selectedFiles.length;
            window.batchBytesSent = 0;
            window.batchCurrentIndex = 1;
            
            sendNextFile();
        };

        function sendNextFile() {
            if (!activeConnection || !activeConnection.open || selectedFiles.length === 0) return;
            const file = selectedFiles[0]; 
            
            if (window.batchCurrentIndex === 1) {
                openTransferModal(
                    window.batchTotalFiles > 1 ? `Enviando ${window.batchTotalFiles} archivos...` : file.name, 
                    window.batchTotalSize, 
                    'send'
                );
            } else {
                document.getElementById('transfer-filename').innerText = `Enviando archivo ${window.batchCurrentIndex} de ${window.batchTotalFiles}...`;
                document.getElementById('transfer-title').innerText = 'Enviando...';
            }

            activeConnection.send(JSON.stringify({ 
                type: 'header', 
                name: file.name, 
                size: file.size, 
                mime: file.type,
                batchTotalSize: window.batchTotalSize,
                batchTotalFiles: window.batchTotalFiles,
                batchCurrentIndex: window.batchCurrentIndex
            }));

            const CHUNK_MIN = 64 * 1024;
            const CHUNK_MAX = 256 * 1024;
            const BUFFER_HIGH_WATER = 8 * 1024 * 1024;
            const BUFFER_LOW_WATER = 1 * 1024 * 1024;
            const dc = activeConnection.dataChannel;
            let chunkSize = CHUNK_MIN;

            const waitForBufferDrain = (onResume) => {
                if (dc && typeof dc.bufferedAmountLowThreshold !== 'undefined' && typeof dc.addEventListener === 'function') {
                    dc.bufferedAmountLowThreshold = BUFFER_LOW_WATER;
                    const onLow = () => {
                        dc.removeEventListener('bufferedamountlow', onLow);
                        clearTimeout(fallbackTimer);
                        onResume();
                    };
                    const fallbackTimer = setTimeout(() => {
                        dc.removeEventListener('bufferedamountlow', onLow);
                        onResume();
                    }, 250);
                    dc.addEventListener('bufferedamountlow', onLow);
                } else {
                    setTimeout(onResume, 50);
                }
            };

            let offset = 0;

            const pump = async () => {
                if (window.transferCancelled) return;
                if (!activeConnection || !activeConnection.open) return;
                if (dc && dc.bufferedAmount > BUFFER_HIGH_WATER) {
                    waitForBufferDrain(pump);
                    return;
                }
                try {
                    const buffer = await file.slice(offset, offset + chunkSize).arrayBuffer();
                    if (window.transferCancelled) return;
                    if (!activeConnection || !activeConnection.open) return;
                    activeConnection.send(buffer);
                    const sentBytes = buffer.byteLength;
                    offset += sentBytes;
                    window.batchBytesSent += sentBytes;
                    
                    updateTransferProgress(window.batchBytesSent, window.batchTotalSize);
                    
                    if (dc && dc.bufferedAmount < BUFFER_LOW_WATER && chunkSize < CHUNK_MAX) {
                        chunkSize = Math.min(CHUNK_MAX, chunkSize * 2);
                    }
                    
                    if (offset < file.size) {
                        pump();
                    } else { 
                        activeConnection.send(JSON.stringify({ type: 'eof' }));
                        document.getElementById('transfer-title').innerText = 'Guardando...';
                        document.getElementById('transfer-size-info').innerText = 'Esperando confirmación...';
                    }
                } catch(err) {
                    console.error("Fallo enviando WebRTC chunk", err);
                }
            };
            pump();
        }

        // --- MODAL Y RESULTADO CORREGIDO ---
        function openTransferModal(filename, size, mode) {
            document.getElementById('modal-transfer').classList.remove('hidden');
            document.getElementById('btn-transfer-close').classList.add('hidden');
            document.getElementById('btn-transfer-cancel').classList.remove('hidden');
            
            document.getElementById('transfer-filename').innerText = filename;
            document.getElementById('transfer-title').innerText = mode === 'send' ? 'Enviando...' : 'Recibiendo...';
            
            // Recreamos el ícono limpiamente
            const iconContainer = document.getElementById('transfer-icon-container');
            iconContainer.innerHTML = `<i data-lucide="${mode === 'send' ? 'arrow-up-circle' : 'arrow-down-circle'}" id="transfer-icon" class="w-10 h-10 text-primary"></i>`;
            if (window.lucide) window.lucide.createIcons();
            
            if (window.batchCurrentIndex === 1) {
                updateTransferProgress(0, size);
            }
        }

        function updateTransferProgress(current, total) {
            const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
            document.getElementById('transfer-progress-bar').style.width = percent + '%';
            document.getElementById('transfer-percent').innerText = percent + '%';
            document.getElementById('transfer-size-info').innerText = `${(current/(1024*1024)).toFixed(1)} MB / ${(total/(1024*1024)).toFixed(1)} MB`;
        }

        async function processIncomingFile() {
            playBeep('receive');
            const safeMime = /^[\w.+-]+\/[\w.+-]+$/.test(incomingFileInfo.mime || '') ? incomingFileInfo.mime : 'application/octet-stream';
            const blob = new Blob(incomingData, { type: safeMime });
            const url = URL.createObjectURL(blob);
            
            const isContact = incomingFileInfo.name.toLowerCase().endsWith('.vcf') || (incomingFileInfo.mime || '').includes('vcard');
            const icon = isContact ? 'users' : 'check';
            const iconColorClass = isContact ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400';
            const safeName = sanitizeFilename(incomingFileInfo.name);

            document.getElementById('empty-received').classList.add('hidden');
            const list = document.getElementById('list-received');
            
            const newItemHtml = `
                <li class="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5 animate-slide-up">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="p-2 ${iconColorClass} rounded-lg shrink-0"><i data-lucide="${icon}" class="w-4 h-4"></i></div>
                        <div class="truncate">
                            <p class="text-sm font-semibold text-zinc-200 truncate">${escapeHTML(incomingFileInfo.name)}</p>
                            <p class="text-[10px] text-zinc-500">${(incomingFileInfo.size / (1024*1024)).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <a href="${url}" download="${safeName}" class="p-2 text-primary bg-primary/10 rounded-lg"><i data-lucide="download" class="w-4 h-4"></i></a>
                </li>`;
            
            list.insertAdjacentHTML('afterbegin', newItemHtml);
            if (window.lucide) window.lucide.createIcons();

            if (downloadDirHandle) {
                try {
                    const fileHandle = await downloadDirHandle.getFileHandle(safeName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    window.showToast(`Guardado en ${downloadDirHandle.name}/${safeName}`, 'success');
                } catch (err) {
                    console.warn('Error guardando en carpeta personalizada:', err);
                    const a = document.createElement('a'); a.href = url; a.download = safeName; a.click();
                }
            } else {
                const a = document.createElement('a'); a.href = url; a.download = safeName; a.click();
            }
            
            window.addHistoryItem('receive', incomingFileInfo.name, incomingFileInfo.size);
        }

        function finishSendingBatch() {
            document.getElementById('transfer-title').innerText = '¡Enviado!';
            document.getElementById('transfer-filename').innerText = 'Todos los archivos transferidos';
            
            // Recreamos el ícono limpiamente
            const iconContainer = document.getElementById('transfer-icon-container');
            iconContainer.innerHTML = `<i data-lucide="check-circle" id="transfer-icon" class="w-10 h-10 text-primary"></i>`;
            if (window.lucide) window.lucide.createIcons();
            
            document.getElementById('transfer-progress-bar').style.width = '100%';
            document.getElementById('btn-transfer-cancel').classList.add('hidden');
            document.getElementById('btn-transfer-close').classList.remove('hidden');
            renderFileList(); 
        }

        function finishReceivingBatch() {
            document.getElementById('transfer-title').innerText = '¡Descarga Completa!';
            document.getElementById('transfer-filename').innerText = 'Todos los archivos recibidos';
            
            const iconContainer = document.getElementById('transfer-icon-container');
            iconContainer.innerHTML = `<i data-lucide="check-circle" id="transfer-icon" class="w-10 h-10 text-primary"></i>`;
            if (window.lucide) window.lucide.createIcons();
            
            document.getElementById('transfer-progress-bar').style.width = '100%';
            document.getElementById('btn-transfer-cancel').classList.add('hidden');
            document.getElementById('btn-transfer-close').classList.remove('hidden');
        }

        // --- SISTEMA DE CHAT P2P ---
        let unreadChatMessages = 0;
        let isChatOpen = false;

        window.toggleChat = () => {
            const modal = document.getElementById('modal-chat');
            if (!modal) return;
            isChatOpen = !isChatOpen;
            if (isChatOpen) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                unreadChatMessages = 0;
                window.updateChatBadge();
                setTimeout(() => {
                    const input = document.getElementById('chat-input');
                    if (input) input.focus();
                }, 100);
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        };

        window.sendChatMessage = () => {
            const input = document.getElementById('chat-input');
            const text = input.value.trim();
            if (!text || !activeConnection || !activeConnection.open) return;
            activeConnection.send(JSON.stringify({ type: 'chat', text: text }));
            appendChatMessage(text, 'local');
            input.value = '';
        };

        window.receiveChatMessage = (text) => {
            playBeep('chat'); 
            appendChatMessage(text, 'remote');
            if (!isChatOpen) {
                unreadChatMessages++;
                window.updateChatBadge();
                window.showToast("Nuevo mensaje recibido", "info");
            }
        };

        function appendChatMessage(text, origin) {
            const container = document.getElementById('chat-messages');
            
            const emptyState = container.querySelector('#chat-empty-state');
            if (emptyState) emptyState.remove();

            const wrapper = document.createElement('div');
            wrapper.className = `flex flex-col max-w-[80%] animate-slide-up ${origin === 'local' ? 'self-end' : 'self-start'}`;
            
            // Estilos Pro para las burbujas
            const bubbleClass = origin === 'local' 
                ? "bg-primary text-white rounded-2xl rounded-tr-sm shadow-md" 
                : "bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm shadow-md border border-white/5";

            const bubble = document.createElement('div');
            bubble.className = `py-2 px-3.5 text-[14px] leading-relaxed break-words select-text ${bubbleClass} cursor-pointer transition-opacity active:opacity-60`;
            bubble.textContent = text;
            bubble.title = "Toca para copiar";
            bubble.addEventListener('click', () => copyChatMessage(text));

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const meta = document.createElement('div');
            meta.className = `flex items-center gap-1 mt-1 px-1 ${origin === 'local' ? 'justify-end' : 'justify-start'}`;
            meta.innerHTML = `
                <span class="text-[9px] text-zinc-500 font-medium">${time}</span>
                ${origin === 'local' ? '<i data-lucide="check-check" class="w-3 h-3 text-primary"></i>' : ''}
            `;
            
            wrapper.appendChild(bubble);
            wrapper.appendChild(meta);
            container.appendChild(wrapper);
            if (window.lucide) window.lucide.createIcons();
            container.scrollTop = container.scrollHeight;
        }

        window.copyChatMessage = async function(text) {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = document.createElement("textarea");
                    ta.value = text;
                    ta.style.position = "fixed";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                window.showToast('Mensaje copiado', 'success');
            } catch (err) {
                window.showToast('Error al copiar', 'error');
            }
        };

        window.updateChatBadge = () => {
            const badge = document.getElementById('chat-badge');
            if (badge) {
                if (unreadChatMessages > 0) {
                    badge.innerText = unreadChatMessages;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        };

        // --- CONTADOR DE INPUT ---
        (function() {
            const inputEl = document.getElementById('target-code');
            const counterEl = document.getElementById('code-counter');
            if (inputEl && counterEl) {
                inputEl.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    const length = e.target.value.length;
                    counterEl.innerText = `${length}/6`;
                    if (length === 6) {
                        counterEl.classList.replace('text-zinc-400', 'text-primary');
                        counterEl.classList.replace('bg-zinc-800', 'bg-primary/20');
                    } else {
                        counterEl.classList.replace('text-primary', 'text-zinc-400');
                        counterEl.classList.replace('bg-primary/20', 'bg-zinc-800');
                    }
                });
            }
        })();

        // --- ROTACIÓN DE CÓDIGO (180 Segundos) ---
        const CODE_VALID_TIME = 180;
        let codeTimeLeft = CODE_VALID_TIME;
        let codeTimerInterval = null;

        function startCodeTimer() {
            clearInterval(codeTimerInterval);
            codeTimeLeft = CODE_VALID_TIME;
            const circle = document.getElementById('timer-circle');
            const text = document.getElementById('code-timer-text');
            if (!circle || !text) return;

            circle.classList.remove('text-green-500', 'text-red-500', 'text-primary');
            circle.classList.add('text-primary');
            text.classList.remove('text-green-500', 'text-red-500', 'text-primary');
            text.classList.add('text-primary');
            
            circle.style.strokeDashoffset = '0';
            text.innerText = codeTimeLeft + 's';
            
            codeTimerInterval = setInterval(() => {
                codeTimeLeft--; text.innerText = codeTimeLeft + 's';
                circle.style.strokeDashoffset = 62.83 - (62.83 * (codeTimeLeft / CODE_VALID_TIME));
                
                if (codeTimeLeft === 10) {
                    circle.classList.replace('text-primary', 'text-red-500');
                    text.classList.replace('text-primary', 'text-red-500');
                }
                if (codeTimeLeft <= 0) refreshMyCode();
            }, 1000);
        }

        function stopCodeTimer() {
            clearInterval(codeTimerInterval);
            const circle = document.getElementById('timer-circle');
            const text = document.getElementById('code-timer-text');
            if (circle && text) {
                circle.classList.remove('text-primary', 'text-red-500', 'text-green-500');
                circle.classList.add('text-green-500');
                text.classList.remove('text-primary', 'text-red-500', 'text-green-500');
                text.classList.add('text-green-500');
                circle.style.strokeDashoffset = '0';
                text.innerText = 'OK';
            }
        }

        function refreshMyCode() {
            myRawCode = Math.floor(100000 + Math.random() * 900000).toString();
            myPeerId = PREFIX + myRawCode;
            document.getElementById('my-code').innerText = myRawCode.match(/.{1,3}/g).join('-');
            
            if (window.QRious) {
                new window.QRious({
                    element: document.getElementById('qr-canvas'),
                    value: window.location.href.split('?')[0] + `?connect=${myRawCode}`,
                    size: 200, background: '#ffffff', foreground: '#09090b', level: 'M'
                });
            }
            if (peer) {
                if (!activeConnection || !activeConnection.open) peer.destroy();
                else peer.disconnect();
            }
            initPeer();
            startCodeTimer();
        }
        startCodeTimer();

        // --- INICIALIZAÇÃO DAS PARTÍCULAS (TIPO INTRANET) ---
        tsParticles.load("dynamic-bg", {
            fpsLimit: 60,
            particles: {
                number: { value: 60, density: { enable: true, value_area: 800 } },
                color: { value: "#0ea5e9" },
                links: { enable: true, color: "#6366f1", distance: 150, opacity: 0.3, width: 1 },
                move: { enable: true, speed: 0.8, direction: "none", random: false, straight: false, outModes: { default: "out" } },
                size: { value: 2, random: true },
                opacity: { value: 0.5 }
            },
            interactivity: {
                detectsOn: "canvas",
                events: { onHover: { enable: true, mode: "grab" }, resize: true },
                modes: { grab: { distance: 140, links: { opacity: 0.8 } } }
            },
            detectRetina: true
        });

        // --- EFECTO GLITCH METADATOS MULTILINGÜE ---
        const metadataPhrases = [
            "0x8F9A [Соединение] - TCP/IP",
            "メタデータ : 接続確立 (200 OK)",
            "安全隧道 -> 192.168.x.x",
            "P2P-Protokoll initialisiert",
            "البيانات المشفرة: RSA-2048",
            "Intranet \u00B5-service: ACTIVE",
            "Paquetes_RX: 10485 / TX: 3942",
            "Σφάλμα κρυπτογράφησης (Null)",
            "데이터 전송 중... 99%",
            "Échange de clés Diffie-Hellman",
            "E2E Encrypted Tunnel [OK]",
            "P2P 노드 활성화됨",
            "Tráfico de red: Seguro"
        ];

        const hudPanel = document.getElementById('metadata-hud');
        const hudText = document.getElementById('metadata-hud-text');
        let hudTimeout;
        let glitchInterval;
        let isHudVisible = false;

        function showHUD() {
            if (!isHudVisible) {
                isHudVisible = true;
                hudPanel.classList.remove('translate-y-full');
                hudPanel.classList.add('translate-y-0');
                
                glitchInterval = setInterval(() => {
                    hudText.innerText = metadataPhrases[Math.floor(Math.random() * metadataPhrases.length)];
                }, 100);
            }
            
            // Reiniciar el temporizador de ocultado en cada movimiento
            clearTimeout(hudTimeout);
            hudTimeout = setTimeout(hideHUD, 1500); 
        }

        function hideHUD() {
            if (isHudVisible) {
                isHudVisible = false;
                hudPanel.classList.add('translate-y-full');
                hudPanel.classList.remove('translate-y-0');
                clearInterval(glitchInterval);
            }
        }

        function checkBackgroundInteraction(e) {
            // Activar solo si el evento ocurre sobre el "fondo" (partículas vacías)
            // Ignoramos si el cursor o dedo está sobre un panel de cristal, navegación, modales, etc.
            const target = e.target;
            if (!target.closest('.glass-panel') && !target.closest('header') && !target.closest('nav') && !target.closest('[id^="modal-"]')) {
                showHUD();
            }
        }

        // Eventos adaptados para ratón (PC) y toque/desplazamiento (Móvil)
        window.addEventListener('mousemove', checkBackgroundInteraction);
        window.addEventListener('touchmove', checkBackgroundInteraction, { passive: true });

        // --- SERVICE WORKER (PWA) ---
        const swSupported = 'serviceWorker' in navigator;
        const isSecureHost = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (swSupported && isSecureHost) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW no registrado:', err));
            });
        }
