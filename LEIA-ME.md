# Meu Treino (PWA)

App de treino, dieta e evolução. Funciona offline e se instala na tela inicial do iPhone.

## Publicar (grátis, 2 minutos)

**Netlify (mais fácil):** acesse app.netlify.com/drop, arraste esta pasta inteira (descompactada) e pronto. Você recebe uma URL https.

**GitHub Pages:** crie um repositório, suba estes arquivos na raiz, vá em Settings → Pages → Deploy from branch → main.

## Instalar no iPhone

1. Abra a URL no **Safari**.
2. Toque em Compartilhar → **Adicionar à Tela de Início**.
3. Use sempre pelo ícone da tela inicial (assim o iOS não apaga os dados por falta de uso).

## Fichas

- **Treino / Dieta → Editar ou + Nova ficha.** Treino: um exercício por linha (`Supino reto - 4 x 8 a 12`). Dieta: blocos separados por linha em branco (1ª linha = nome da refeição).
- Pode ter quantas fichas quiser; é possível duplicar e excluir.

## Envio dos dados / banco de dados

Em **Ajustes → URL de envio** o app envia um POST em JSON ao finalizar treino ou salvar medidas.
O caminho mais simples é o Google Sheets (passo a passo e script dentro do próprio app, em Ajustes).

Formato enviado (treino): `{ tipo:"treino", data, ficha, exercicios:[{nome, series:[{n,carga,reps}]}], linhas:[{data,ficha,exercicio,serie,carga,reps}] }`
Formato (corpo): `{ tipo:"corpo", data, peso, cintura, braco, coxa }`

Sem URL configurada, tudo fica salvo no aparelho. Use Ajustes → Exportar para backup.
