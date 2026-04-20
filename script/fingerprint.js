(() => {
    const makeNative = (fn) => {
        const name = fn.name || '';
        const str = `function ${name}() { [native code] }`;
        Object.defineProperty(fn, 'toString', {
            value: () => str,
            writable: false,
            enumerable: false,
            configurable: false,
        });
        return fn;
    };
    const noise = () => Math.random() * 0.1 - 0.05;

    // ── 1. navigator.webdriver 제거 ──────────────────────
    try {
        delete Object.getPrototypeOf(navigator).webdriver;
    } catch (e) {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
        });
    }

    // ── 2. Canvas 핑거프린트 노이즈 ──────────────────────
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
        // willReadFrequently 옵션으로 새 컨텍스트 생성
        const ctx = this.getContext('2d', { willReadFrequently: true });
        if (ctx && this.width > 0 && this.height > 0) {
            try {
                const imageData = ctx.getImageData(0, 0, this.width, this.height);
                // 랜덤 위치 픽셀에 노이즈 주입
                const idx = (Math.floor(Math.random() * this.height) * this.width
                            + Math.floor(Math.random() * this.width)) * 4;
                imageData.data[idx]     = Math.min(255, imageData.data[idx]     + Math.floor(Math.random() * 3) + 1);
                imageData.data[idx + 1] = Math.min(255, imageData.data[idx + 1] + Math.floor(Math.random() * 3) + 1);
                imageData.data[idx + 2] = Math.min(255, imageData.data[idx + 2] + Math.floor(Math.random() * 3) + 1);
                ctx.putImageData(imageData, 0, 0);
            } catch(e) {}
        }
        return origToDataURL.apply(this, args);
    };
    makeNative(HTMLCanvasElement.prototype.toDataURL);

    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
        const ctx = this.getContext('2d');
        if (ctx) {
            const imageData = ctx.getImageData(0, 0, this.width || 1, this.height || 1);
            imageData.data[0] = Math.min(255, imageData.data[0] + Math.floor(Math.random() * 3));
            ctx.putImageData(imageData, 0, 0);
        }
        return origToBlob.call(this, callback, ...args);
    };
    makeNative(HTMLCanvasElement.prototype.toBlob);

    // ── 3. WebGL 위장 ─────────────────────────────────────
const glParamSpoof = (proto) => {
    const orig = proto.getParameter;
    proto.getParameter = function(param) {
        if (param === 37445) return 'Google Inc. (Apple)';
        if (param === 37446) return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)';
        return orig.call(this, param);
    };
    makeNative(proto.getParameter);
};
glParamSpoof(WebGLRenderingContext.prototype);
glParamSpoof(WebGL2RenderingContext.prototype);
    // ── 4. AudioContext 노이즈 ────────────────────────────
    const origCreateOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function() {
        const osc = origCreateOscillator.call(this);
        osc.detune.value += noise();
        return osc;
    };
    makeNative(AudioContext.prototype.createOscillator);

    // ── 5. Navigator 속성 ─────────────────────────────────
    Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => __HW__
    });
    Object.defineProperty(navigator, 'deviceMemory', {
        get: () => __MEM__
    });
    Object.defineProperty(navigator, 'languages', {
        get: () => ['__LOCALE__', '__LANG__', 'en-US', 'en']
    });

    Object.defineProperty(Navigator.prototype, 'language', {
    get: makeNative(function() { return '__LOCALE__'; }),
    configurable: true
});

    // ── stealth 대체 항목들 ───────────────────────────────
    Object.defineProperty(Navigator.prototype, 'languages', {
        get: makeNative(function() {
            return ['__LOCALE__', '__LANG__', 'en-US', 'en'];
        }),
        configurable: true
    });
    Object.defineProperty(Navigator.prototype, 'userAgent', {
        get: makeNative(function() {
            return '__UA__';
        }),
        configurable: true
    });
    Object.defineProperty(Navigator.prototype, 'platform', {
        get: makeNative(function() {
            return '__PLATFORM__';
        }),
        configurable: true
    });
    Object.defineProperty(Navigator.prototype, 'vendor', {
        get: makeNative(function() { return 'Google Inc.'; }),
        configurable: true
    });

    // ── 6. Screen ─────────────────────────────────────────
    Object.defineProperty(screen, 'width',       { get: () => __SCREEN_W__ });
    Object.defineProperty(screen, 'height',      { get: () => __SCREEN_H__ });
    Object.defineProperty(screen, 'availWidth',  { get: () => __SCREEN_W__ });
    Object.defineProperty(screen, 'availHeight', { get: () => __SCREEN_H__ - 40 });
    Object.defineProperty(screen, 'colorDepth',  { get: () => 24 });

    // ── 7. Timezone ───────────────────────────────────────
    Date.prototype.getTimezoneOffset = function() {
        return __TZ_OFFSET__;
    };
    const origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function() {
        const opts = origResolvedOptions.call(this);
        opts.timeZone = '__TIMEZONE__';
        return opts;
    };

    // ── 8. chrome 객체 위장 (id 및 메서드 보완) ──────────────────────
    window.chrome = {
        app: {
            isInstalled: false,
            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
            RunningState: { CANNOT_RUN: 'cannot_run', RUNNING: 'running', CAN_RUN: 'can_run' },
            getDetails: makeNative(function getDetails() {}),
            getIsInstalled: makeNative(function getIsInstalled() {}),
            installState: makeNative(function installState() {}),
            runningState: makeNative(function runningState() {})
        },
        runtime: {
            id: undefined,
            connect: makeNative(function connect() {}),
            sendMessage: makeNative(function sendMessage() {}),
            onConnect: { addListener: makeNative(function addListener() {}) },
            onMessage: { addListener: makeNative(function addListener() {}) }
        },
        webstore: {
            onInstallStageChanged: { addListener: makeNative(function addListener() {}) },
            onDownloadProgress: { addListener: makeNative(function addListener() {}) },
            install: makeNative(function install() {})
        },
        loadTimes: makeNative(function loadTimes() { return {}; }),
        csi: makeNative(function csi() { return {}; })
    };
    // ── 9. plugins / mimeTypes 위장 (Length 및 Prototype 보완) ────────
    const fakePlugins = [
        { name: 'PDF Viewer',                filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer',         filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chromium PDF Viewer',       filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'WebKit built-in PDF',       filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
    ].map(p => {
        // 각 플러그인을 Plugin.prototype 상속 객체로 만들기
        const plugin = Object.create(Plugin.prototype);
        Object.defineProperty(plugin, 'name',        { get: () => p.name,        enumerable: true });
        Object.defineProperty(plugin, 'filename',    { get: () => p.filename,    enumerable: true });
        Object.defineProperty(plugin, 'description', { get: () => p.description, enumerable: true });
        Object.defineProperty(plugin, 'length',      { get: () => 0,             enumerable: true });
        return plugin;
    });

    // PluginArray 프로토타입을 직접 상속
    const pluginArray = Object.create(PluginArray.prototype);
    fakePlugins.forEach((plugin, i) => {
        pluginArray[i] = plugin;
    });
    Object.defineProperty(pluginArray, 'length', { get: () => fakePlugins.length });
    Object.defineProperty(pluginArray, 'item', { value: (i) => fakePlugins[i] });
    Object.defineProperty(pluginArray, 'namedItem', {
        value: (name) => fakePlugins.find(p => p.name === name) || null
    });
    pluginArray[Symbol.iterator] = function* () {
        for (let i = 0; i < fakePlugins.length; i++) {
            yield fakePlugins[i];
        }
    };
    pluginArray.toJSON = function() {
        return Array.from({ length: this.length }, (_, i) => this[i]);
    };
    pluginArray[Symbol.toStringTag] = 'PluginArray';

    Object.defineProperty(navigator, 'plugins', {
        get: () => pluginArray
    });

    const fakeMimeTypes = [{ type: 'application/pdf' }];
    const mimeTypeArray = Object.create(MimeTypeArray.prototype);
    fakeMimeTypes.forEach((mime, i) => {
        mimeTypeArray[i] = mime;
    });
    Object.defineProperty(mimeTypeArray, 'length', { get: () => fakeMimeTypes.length });
    Object.defineProperty(mimeTypeArray, 'item', { value: (i) => fakeMimeTypes[i] });
    Object.defineProperty(mimeTypeArray, 'namedItem', {
        value: (name) => fakeMimeTypes.find(m => m.type === name) || null
    });

    Object.defineProperty(navigator, 'mimeTypes', {
        get: () => mimeTypeArray
    });

    // ── 10. permissions 위장 ──────────────────────────────
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications'
            ? Promise.resolve({
                state: Notification.permission,
                onchange: null,
                name: 'notifications',
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false
              })
            : originalQuery(parameters)
    );
    makeNative(window.navigator.permissions.query);
    // ── 11. WebRTC IP 누출 방지 ─────────────────────────��─────────
    // RTCPeerConnection을 relay 전용으로 강제 → 로컬/공인 IP ICE 후보 생성 차단
    const _OrigRTC = window.RTCPeerConnection;
    if (_OrigRTC) {
        function _SafeRTC(config, constraints) {
            const safeConfig = Object.assign({}, config || {});
            safeConfig.iceTransportPolicy = 'relay';
            return new _OrigRTC(safeConfig, constraints);
        }
        _SafeRTC.prototype = _OrigRTC.prototype;
        if (_OrigRTC.generateCertificate) {
            _SafeRTC.generateCertificate = _OrigRTC.generateCertificate.bind(_OrigRTC);
        }
        makeNative(_SafeRTC);
        window.RTCPeerConnection = _SafeRTC;
        if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = _SafeRTC;
        if (window.mozRTCPeerConnection)    window.mozRTCPeerConnection    = _SafeRTC;
    }

    // ── 12. connection 위장 (항상 정의) ───────────────────────────
    // 수정: if (navigator.connection) 조건을 제거하여
    // 환경에 상관없이 항상 실제 4G 환경처럼 보이도록 덮어씀
    Object.defineProperty(navigator, 'connection', {
        get: () => ({
            rtt: 50,
            downlink: 10,
            effectiveType: '4g',
            saveData: false,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false
        })
    });
})();
