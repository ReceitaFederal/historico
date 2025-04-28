export class ComponenteBase {
    async carregarScript(url, marcadorWindow = null) {
        if (marcadorWindow && window[marcadorWindow]) {
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                if (marcadorWindow) {
                    window[marcadorWindow] = true;
                }
                resolve();
            };
            script.onerror = () => reject(new Error(`Erro ao carregar script: ${url}`));
            document.head.appendChild(script);
        });
    }

    async carregarCss(url, atributoIdentificador = '') {
        if (atributoIdentificador && document.querySelector(`link[data-css-id="${atributoIdentificador}"]`)) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        if (atributoIdentificador) {
            link.setAttribute('data-css-id', atributoIdentificador);
        }
        document.head.appendChild(link);
    }
}
