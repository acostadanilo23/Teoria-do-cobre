document.addEventListener("DOMContentLoaded", () => {
    const rendererDiv = document.getElementById("content-renderer");
    const loadingDiv = document.getElementById("loading");

    // Função para transformar texto do cabeçalho em ID compatível com o GitHub
    const generateId = (text) => {
        return text.toLowerCase()
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[^\w\s-áàâãéêíóôõúçñ]/g, '') // Mantém letras com acento e números
            .trim()
            .replace(/\s+/g, '-'); // Espaços para hífens
    };

    const renderer = new marked.Renderer();
    renderer.heading = function(token) {
        // Compatibilidade com versões novas e antigas do marked.js
        let text = token.text;
        let depth = token.depth;
        let raw = token.raw;
        
        if (arguments.length > 1) {
            text = arguments[0];
            depth = arguments[1];
            raw = arguments[2];
        }
        
        const id = generateId(raw || text || "");
        return `<h${depth} id="${id}">${text}</h${depth}>`;
    };

    // Configurando marked.js
    marked.setOptions({
        renderer: renderer,
        gfm: true,
        breaks: true
    });

    // Função para buscar o README.md local ou online
    // Nota: quando acessado localmente via file://, pode dar erro de CORS. 
    // É recomendado rodar com um servidor local para testar, ou isso funcionará perfeitamente quando hospedado no Vercel.
    fetch('/README.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao carregar o arquivo README.md. Certifique-se de estar rodando em um servidor web (como Live Server ou Vercel).');
            }
            return response.text();
        })
        .then(markdown => {
            loadingDiv.style.display = 'none';
            rendererDiv.innerHTML = marked.parse(markdown);

            // Renderizar fluxogramas com Mermaid.js
            if (window.mermaid) {
                try {
                    // Inicializar com tema escuro para combinar com o design
                    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
                    
                    // O marked.js gera <pre><code class="language-mermaid">...
                    // O Mermaid prefere <div class="mermaid">...
                    const mermaidBlocks = document.querySelectorAll('pre code.language-mermaid');
                    mermaidBlocks.forEach((block) => {
                        const div = document.createElement('div');
                        div.className = 'mermaid';
                        div.style.textAlign = 'center';
                        div.style.margin = '2rem 0';
                        div.textContent = block.textContent;
                        block.parentElement.replaceWith(div);
                    });
                    
                    // Renderiza todos os divs com a classe 'mermaid'
                    mermaid.run();
                } catch (err) {
                    console.error("Erro ao renderizar gráficos Mermaid:", err);
                }
            }

            // Gerar itens flutuantes por todo o documento
            // Isso precisa ser feito depois que o conteúdo renderiza, para termos a altura real
            setTimeout(() => {
                const assets = [
                    'Raw_Copper_JE3_BE2.png',
                    'Raw_Gold_JE3_BE2.png',
                    'Raw_Iron_JE3_BE2.png',
                    '150px-Emerald_Ore_JE4_BE3.png'
                ];
                
                // Pegamos a altura real do documento depois do render
                const docHeight = document.documentElement.scrollHeight;
                
                // Vamos colocar 1 item a cada ~500px de altura para espalhar bem
                const numItems = Math.max(20, Math.floor(docHeight / 300));
                
                for (let i = 0; i < numItems; i++) {
                    const img = document.createElement('img');
                    const asset = assets[Math.floor(Math.random() * assets.length)];
                    img.src = `assets/${asset}`;
                    img.className = 'floating-copper-dynamic';
                    
                    // Posição X aleatória (deixando margem para não estourar a tela)
                    img.style.left = `${5 + Math.random() * 85}%`;
                    // Posição Y espalhada por todo o documento
                    img.style.top = `${Math.random() * (docHeight - 100)}px`;
                    // Delay aleatório
                    img.style.animationDelay = `-${Math.random() * 5}s`;
                    
                    // Variação de tamanho para as esmeraldas (pois a imagem original é grande)
                    if (asset.includes('Emerald')) {
                        img.style.width = '64px';
                        img.style.height = '64px';
                    }
                    
                    document.body.appendChild(img);
                }
            }, 500); // Dá um tempo pro DOM atualizar as alturas
        })
        .catch(error => {
            loadingDiv.style.display = 'block';
            loadingDiv.innerHTML = `<span style="color:#FF5555;">Erro crítico: ${error.message}</span>`;
            console.error("Erro ao processar markdown:", error);
        });
});
