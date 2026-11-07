# Cidade em Alerta

Global Solution 2026.2 – Application Development (CitizenTech)

Aplicação web para registrar problemas urbanos (buracos, iluminação, lixo, alagamentos, calçadas) e acompanhar indicadores que ajudam a priorizar o atendimento.

*Vídeo pitch:* COLE AQUI O LINK DO VÍDEO

## Problema
Problemas urbanos são reportados de forma dispersa, e fica difícil saber o que é mais frequente e o que é mais urgente.

## Público-alvo
- Moradores que querem reportar ocorrências na sua região.
- Equipes de zeladoria urbana que precisam priorizar o atendimento.

## Objetivo
Centralizar os registros em um só lugar e gerar indicadores simples que apoiem a decisão sobre onde agir primeiro.

## ODS relacionado
*ODS 11 – Cidades e Comunidades Sustentáveis.*

## Tecnologias
HTML, CSS, JavaScript, Node.js, Express e MongoDB (driver oficial mongodb).

## Pré-requisitos
- Node.js
- *MongoDB rodando em mongodb://127.0.0.1:27017* (o banco não vem dentro do projeto). Escolha uma opção:
  1. *MongoDB instalado na máquina* (MongoDB Community): basta o serviço estar ativo.
  2. *Docker* (imagem oficial mongo:7): na pasta do projeto, rode docker compose up -d.
  3. *MongoDB Atlas* (nuvem): defina a variável de ambiente MONGODB_URI com a sua connection string antes de iniciar.

> Durante o desenvolvimento o MongoDB rodou em um container Docker. Não é um emulador: é o MongoDB oficial, o mesmo software de uma instalação comum, apenas empacotado em container. O código funciona igual em qualquer uma das opções.

## Como executar
bash
npm install
npm start

Depois abra http://localhost:3000

Se o MongoDB não estiver acessível, o servidor mostra uma mensagem de erro clara no terminal e encerra.

## Como testar rapidamente
1. Em /, envie o formulário com um campo faltando: deve aparecer uma mensagem de erro.
2. Envie uma ocorrência válida: deve aparecer a mensagem de sucesso.
3. Abra /registros.html: a ocorrência aparece na lista e os indicadores são atualizados.
4. Acesse uma rota inexistente (ex.: /xyz): deve aparecer a página 404.

## Estrutura

cidade-em-alerta/
  server.js          servidor Express, validação e acesso ao MongoDB
  package.json
  docker-compose.yml MongoDB opcional via Docker
  public/            HTML, CSS e JavaScript do front-end


## Rotas
| Método | Rota | Função |
|---|---|---|
| GET | / | Formulário de registro |
| GET | /registros.html | Listagem e indicadores |
| GET | /api/opcoes | Categorias e prioridades aceitas |
| GET | /api/ocorrencias | Lista os registros |
| POST | /api/ocorrencias | Valida e grava um registro |
| GET | /api/indicadores | Indicadores calculados |
| qualquer outra | – | 404 |

## Dados
Banco cidade_em_alerta, coleção ocorrencias. Cada registro tem: título, categoria, prioridade, bairro, descrição (opcional) e data de criação. O servidor valida tamanho e valores permitidos antes de gravar.

## Indicadores
1. *Total de registros* (countDocuments).
2. *Resumo por categoria e por prioridade* (agrupamento $group do MongoDB).
3. *% de ocorrências com prioridade alta*: mostra a fatia de casos urgentes.

Esses números mostram quais problemas são mais frequentes e urgentes, ajudando a decidir onde agir primeiro.
