# Posts diários automáticos

Gera **um post por dia** a partir do banco de conteúdo, para você ter sempre conteúdo no feed.

## Como funciona
1. `conteudo.js` — banco com **30 posts prontos** (dicas, frases, curiosidades, perguntas e lembretes).
2. `generate.mjs` — escolhe o item do dia (pela data) e renderiza a **arte 1080×1080** + a **legenda**.
3. O resultado sai em `saida/posto-AAAA-MM-DD.png` (arte) e `saida/posto-AAAA-MM-DD.md` (legenda).

## Rodar manualmente
```bash
cd instagram/diario
node generate.mjs
```

## Agendar (automático, sem precisar do seu PC ligado)
Já existe o workflow `.github/workflows/post-diario.yml` que roda **todo dia às 9h (Brasília)** nos servidores do GitHub, gera o post e faz commit dele no repositório.

⚠️ **Importante:** o GitHub só roda workflows agendados se o arquivo estiver na **branch padrão (`main`)**. Depois de mesclar a `oferta-15` na `main` (ou mover o arquivo para lá), o agendamento passa a funcionar. Você também pode rodar manualmente pela aba **Actions → Post diário do Instagram → Run workflow**.

## Quando o banco acabar
São 30 posts. Quando terminar (em ~1 mês), me peça para **gerar mais 30** que eu reabasteço o `conteudo.js`. O script continua rodando e recomeça o ciclo (repete a partir do dia 1), então você nunca fica sem post.
