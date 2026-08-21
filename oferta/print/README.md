# Materiais de impressão — Campanha "Oferta 15%"

Arquivos prontos para a gráfica:

| Arquivo | O que é |
|---|---|
| `folheto.html` | Folheto **A5** (148×210mm), frente + verso, com QR embutido |
| `cartao.html` | Cartão **85×55mm** (9×5cm), frente + verso, com QR embutido |
| `folheto.pdf` | Folheto A5 já exportado, pronto pra gráfica |
| `cartao.pdf` | Cartão 85×55mm já exportado, pronto pra gráfica |
| `qr-folheto.png` / `qr-folheto.svg` | QR isolado (folheto) → `/oferta?f=folheto` |
| `qr-cartao.png` / `qr-cartao.svg` | QR isolado (cartão) → `/oferta?f=cartao` |

Os dois QRs levam para `diasdemoda.com/oferta`, mas com uma diferença invisível
(`?f=folheto` ou `?f=cartao`) que registra **de qual material veio o lead** no painel.

---

## Como gerar o PDF para a gráfica

1. Abra o arquivo `.html` no **Google Chrome** (ou Edge).
2. `Ctrl + P` (ou menu → Imprimir).
3. Destino: **Salvar como PDF**.
4. **Importante:**
   - Margens: **Nenhuma** (ou "Padrão" e escala 100%)
   - Ativar **"Gráficos de fundo"** ✅ (senão as cores/QR somem)
   - Tamanho do papel: **A5** no folheto / **Personalizado 85×55mm** no cartão (o CSS já define, o Chrome respeita)
5. Salvar. O PDF sai no tamanho exato, vetorial, com as cores corretas.

> Cada arquivo gera um PDF de **2 páginas** (frente e verso). Na gráfica, peça
> **frente e verso** com a mesma orientação.

---

## Especificações para a gráfica

- **Folheto:** A5 (148×210mm), 4/4 (colorido frente e verso), papel couché 90–150g.
- **Cartão:** 85×55mm, 4/4, papel couché 250–300g, sem verniz necessário.
- **Sem sangria** (o layout já tem margem de segurança interna). Se a gráfica
  exigir sangria de 3mm, avise que o fundo pode ser estendido.
- Fontes: Cormorant Garamond (títulos) + Karla (texto) — embutidas no PDF.

---

## Identidade visual usada

- Rosa principal `#AE567C` · Rosa escuro `#8C3F63` · Ameixa `#2B1A22` · Branco quente `#FBF6F4`
- Linha de costura pontilhada, botões/curvas arredondadas — mesma linguagem do site.
