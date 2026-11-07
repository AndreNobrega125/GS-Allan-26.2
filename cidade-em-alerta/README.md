# Cidade em Alerta – Global Solution 2026.2 (CitizenTech)

## Problema
Problemas urbanos (buracos, iluminação, lixo, alagamentos, calçadas) são reportados de forma dispersa, e fica difícil saber o que priorizar.

## Público-alvo
Moradores que reportam ocorrências e equipes de zeladoria urbana que precisam priorizar o atendimento.

## Objetivo
Centralizar os registros e gerar indicadores simples que apoiem a priorização.

## ODS relacionado
**ODS 11 – Cidades e Comunidades Sustentáveis.**

## Tecnologias
HTML, CSS, JavaScript, Node.js, Express e MongoDB.

## Como executar
1. Tenha o Node.js e um MongoDB rodando. Opção rápida com Docker:
   `docker run -d --name mongo-gs -p 27017:27017 mongo`
2. Na pasta do projeto: `npm install`
3. `npm start`
4. Abra http://localhost:3000

Por padrão conecta em `mongodb://127.0.0.1:27017`. Para outro MongoDB (ex.: Atlas), defina a variável de ambiente `MONGODB_URI` antes de iniciar.

Banco: `cidade_em_alerta` | Coleção: `ocorrencias`.

## Rotas
| Método | Rota | Função |
|---|---|---|
| GET | `/` | Formulário de registro |
| GET | `/registros.html` | Listagem e indicadores |
| GET | `/api/opcoes` | Categorias e prioridades |
| GET | `/api/ocorrencias` | Lista os registros |
| POST | `/api/ocorrencias` | Valida e grava um registro |
| GET | `/api/indicadores` | Indicadores |
| qualquer outra | – | 404 |

## Campos do registro
título, categoria, prioridade, bairro, descrição (opcional) e data de criação. O servidor valida tamanho e valores permitidos.

## Indicadores
1. **Total de registros** (`countDocuments`).
2. **Resumo por categoria e por prioridade** (agrupamento `$group` do MongoDB).
3. **% de ocorrências de prioridade alta**: mostra a fatia de casos urgentes.

Esses números mostram onde estão os problemas mais frequentes e urgentes, ajudando a decidir onde agir primeiro.
