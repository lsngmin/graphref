() => {
            const el = document.querySelector('.g-recaptcha[data-sitekey], [data-sitekey][data-callback]');
            if (el) return el.getAttribute('data-sitekey');
            const iframe = document.querySelector('iframe[src*="recaptcha"]');
            if (iframe) return iframe.getAttribute('src');
            return null;
        }