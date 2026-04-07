// inject_captcha.js
(token) => {
    // 1. 토큰 주입
    const selectors = [
        'textarea[name="g-recaptcha-response"]',
        'textarea#g-recaptcha-response',
        'input[name="g-recaptcha-response"]'
    ];
    let injected = false;
    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
            el.value = token;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            injected = true;
        }
    }

    // 2. 콜백 탐색 및 실행
    let callbackExecuted = false;
    if (window.___grecaptcha_cfg && window.___grecaptcha_cfg.clients) {
        for (const i in window.___grecaptcha_cfg.clients) {
            const client = window.___grecaptcha_cfg.clients[i];
            for (const prop in client) {
                const obj = client[prop];
                if (obj && typeof obj.callback !== 'undefined') {
                    if (typeof obj.callback === 'function') {
                        obj.callback(token);
                        callbackExecuted = true;
                    } else if (typeof obj.callback === 'string' && typeof window[obj.callback] === 'function') {
                        window[obj.callback](token);
                        callbackExecuted = true;
                    }
                }
            }
        }
    }

    // 3. 마지막 수단: 폼 제출
    if (!callbackExecuted) {
        const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            submitBtn.click();
        } else {
            const form = document.querySelector('#captcha-form') || document.querySelector('form');
            if (form) form.submit();
        }
    }
    return injected;
}