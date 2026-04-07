() => {
                const iframe = document.querySelector(
                    'iframe[src*="recaptcha/enterprise/anchor"], ' +
                    'iframe[src*="recaptcha/api2/anchor"]'
                );
                return iframe ? iframe.src : null;
            }