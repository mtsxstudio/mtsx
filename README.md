# MTSX® Tech · site

Site estático, sem build: HTML, CSS e JavaScript puros. As animações de rolagem usam GSAP + ScrollTrigger (cdnjs) e a rolagem macia no computador usa Lenis (jsDelivr). Se elas não carregarem, ou se o visitante usar "reduzir movimento", o site aparece completo e estático.

## Arquivos

- `index.html`: estrutura, textos, SEO e dados estruturados
- `styles.css`: identidade visual, layout responsivo e estados das animações
- `main.js`: menu do celular, timecode, vídeos, galeria de projetos, cursor, formulário e todas as animações de rolagem
- `assets/`: logo original otimizada, favicon, ícone Apple e imagem de compartilhamento
- `assets/photos/`: fotos reais do Unsplash (licença Unsplash, uso comercial livre) em WebP, em dois tamanhos
- `assets/video/`: vídeos reais da MTSX. `*-loop.mp4` são trechos de 8 s sem som que tocam nos cartões; `*-full.mp4` são os vídeos completos com som que abrem ao clicar; `*-poster.webp` é a imagem mostrada antes do vídeo carregar

## Como rodar

Sirva a pasta localmente (abrir o arquivo direto também funciona, mas o formulário só envia publicado):

```
python3 -m http.server 8000
```

e acesse http://localhost:8000.

## Publicar

Envie a pasta inteira para a hospedagem (Netlify: arraste a pasta em app.netlify.com/drop ou conecte ao repositório). Mantenha `index.html` na raiz.

## Formulário de orçamento

O formulário valida os campos e envia de verdade, mas depende da hospedagem:

- **Netlify (padrão):** o formulário já tem `data-netlify="true"`. Ao publicar no Netlify, ative "Form detection" em Site configuration > Forms e os pedidos aparecem no painel (dá para receber por e-mail em Notifications).
- **Outra hospedagem:** crie um formulário no Formspree, abra `main.js` e troque `FORM_MODE` para `'formspree'` e `FORMSPREE_URL` para o endpoint (`https://formspree.io/f/XXXX`).

Se o envio falhar, a página avisa e oferece o botão "Enviar pelo WhatsApp" com a mensagem já preenchida. Ela nunca mostra sucesso sem resposta positiva do servidor.

## Onde editar

- Número do WhatsApp: `WA_NUMBER` em `main.js` e os textos visíveis em `index.html`
- Mensagens prontas de cada botão: atributo `data-wa` de cada link
- Preços: seções `#servicos` e `#planos` em `index.html` (nos planos, o número também está em `data-to`)
- Fotos: troque os arquivos em `assets/photos/` mantendo os nomes, ou edite os `src`/`srcset`
- Cores e fontes: bloco `:root` no topo de `styles.css`
- Projetos: cada cartão em `#projetos` no `index.html` (nome, texto, link, e os caminhos `data-video`, `data-src` e `poster`)

## Adicionar um projeto novo

1. Corte um trecho de 8 s sem som em 540×960: `ffmpeg -ss 5 -t 8 -i video.mp4 -an -vf scale=540:960 -c:v libx264 -preset veryfast -crf 30 -movflags +faststart assets/video/nome-loop.mp4`
2. Versão completa com som: `ffmpeg -i video.mp4 -vf scale=540:960 -c:v libx264 -preset veryfast -crf 29 -c:a aac -b:a 64k -movflags +faststart assets/video/nome-full.mp4`
3. Copie um `<article class="proj">` no `index.html` e troque os caminhos e textos.

## Comportamento das animações

- Vídeos não tocam sozinhos com "reduzir movimento" ou com economia de dados; fica a imagem de capa.
- Cursor próprio, botões magnéticos e rolagem macia só aparecem com mouse.
- A galeria de projetos é horizontal presa na rolagem no computador e arrastável com o dedo no celular.
- Duração das cenas presas na rolagem: `.motion-ok .hero-pin` e `.motion-ok .build-pin` em `styles.css`
