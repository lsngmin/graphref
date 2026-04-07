// extract_enterprise_s_value deprecated
() => {
                try {
                    const cfg = window.___grecaptcha_cfg;
                    if (!cfg || !cfg.clients) return null;
                    for (const i in cfg.clients) {
                        const c = cfg.clients[i];
                        for (const k in c) {
                            if (c[k] && c[k].s) return c[k].s;
                        }
                    }
                } catch(e) {}
                return null;
            }