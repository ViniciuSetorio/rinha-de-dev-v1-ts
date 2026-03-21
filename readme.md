# I Rinha de Dev: O Caos do Ingresso

Bem-vindos à Rinha de Dev (uma cópia descarada do rinha de backend https://github.com/zanfranceschi/rinha-de-backend-2025)! 

Esqueça códigos bonitos e padrões de projeto complexos por um momento. Aqui, o que importa é se sua API aguenta o tranco ou vai morrer?

O desafio é simples. Estamos vendendo **100 ingressos** para a primeira versão do rinha de dev. Milhares de devs vão tentar comprar ao mesmo tempo. E você deve vender somente os 100 ingressos, nada a mais (talvez algo a menos, mas pelo amor de deus nada a mais)

## O Desafio: Concorrência Real

Você deve construir uma API para gerenciar a reserva desses 100 ingressos.

**A Regra de Ouro:** não pode haver overbooking. Se você vender 101 ingressos, você está fora. Se dois usuários tentarem pegar o último ingresso no mesmo milissegundo, apenas um pode vencer.

## Endpoints Obrigatórios

Sua API precisa expor:

### 1. Listar Ingressos

`GET /eventos`

**Resposta (`200 OK`):**

```json
[
  {
    "id": 1,
    "nome": "Show do Picos Fest",
    "ingressos_disponiveis": 100
  }
]
```

### 2. Reservar Ingresso

`POST /reservas`

**Payload:**

```json
{
  "evento_id": 1,
  "usuario_id": 123
}
```

**Respostas:**

- `201 Created`: Reserva garantida!
- `422 Unprocessable Entity`: Acabou o estoque.
- `400 Bad Request`: Você mandou algo errado.

## O Ringue (Restrições)

Eu não tenho um servidor da NASA. O hardware é curto para ver quem sabe otimizar de verdade:

- **CPU:** `0.5`.
- **RAM:** `256 MB`.
- **Stack:** 1 instância da sua API + 1 Banco de Dados (Postgres).

## O que você precisa entregar?

Para entrar na arena, abra uma nova issue no repositório e cole o link do seu vendedor de ingressos, prazo limite de entrega 20 de fevereiro, seu repo deve ter:

- **O Código:** na linguagem que você domina (ou naquela que você diz que sabe no LinkedIn kkkk).
- **Dockerfile:** sua aplicação deve subir e ouvir na porta `8080`.
- **Database:** use o arquivo `init.sql` e o `docker-compose.yml` disponibilizados na raiz deste repo. Não mude as tabelas. O juiz (script de teste) precisa encontrar os dados onde eles deveriam estar.


## Ainn, mas eu não tenho Docker e nem sei usar...
Você não precisa ter o Docker instalado nessa sua carroça para participar. Quem vai rodar o código via Docker sou eu, mas você ainda precisa gerar o Dockerfile (qualquer IA decente faz isso) e garantir que ele esta rodando na porta 8080, e você testa sua aplicação rodando sem Docker.

## Como será o Massacre

Será utilizado o **k6** (ferramenta de stress test). O fluxo é:

- O script vai simular centenas de usuários simultâneos "esmurrando" o endpoint de reserva.
- Vamos medir quantas reservas você conseguiu fazer antes do estoque zerar.
- Vamos ver quantas vezes sua API caiu ou deu erro de timeout.

## Critérios do Ranking

- **Resiliência:** zero ingressos vendidos acima do limite.
- **Throughput:** quantas requisições por segundo (RPS) sua API aguentou.
- **Latência:** quão rápido você respondeu enquanto o mundo pegava fogo.

## Dicas de Sobrevivência

- **Cuidado com o lock:** se travar o banco demais, a fila cresce e o sistema para. Se não travar, você vende ingresso duplicado. Ache o equilíbrio.
- **Pool de conexões:** não abra uma conexão nova por requisição ou sua memória vai pro espaço em 2 segundos.
- **Logs:** desative o modo debug. O tempo que sua API gasta escrevendo "Recebi um request" no console é o tempo que ela poderia estar salvando um ingresso no banco.

Dúvidas? Chame o organizador ou abra uma Issue.

Prepare seu Docker, otimize seu código e que vença o mais rápido (ou quem não vender mais do que deveria né)!
