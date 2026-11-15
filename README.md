# Cidade em Alerta

Global Solution 2026.2 – Application Development (CitizenTech)

Aplicação web para registrar problemas urbanos (buracos, iluminação, lixo, alagamentos, calçadas) e acompanhar indicadores que ajudam a priorizar o atendimento.

**Vídeo pitch:** _COLE AQUI O LINK DO VÍDEO_

## Problema
Problemas urbanos são reportados de forma dispersa, e fica difícil saber o que é mais frequente e o que é mais urgente.

## Público-alvo
- Moradores que querem reportar ocorrências na sua região.
- Equipes de zeladoria urbana que precisam priorizar o atendimento.

## Objetivo
Centralizar os registros em um só lugar e gerar indicadores simples que apoiem a decisão sobre onde agir primeiro.

## ODS relacionado
**ODS 11 – Cidades e Comunidades Sustentáveis.**

## Tecnologias
HTML, CSS, JavaScript, Node.js, Express e MongoDB (driver oficial `mongodb`).

## Pré-requisitos
- Node.js
- **MongoDB rodando em `mongodb://127.0.0.1:27017`** (o banco não vem dentro do projeto). Escolha uma opção:
  1. **MongoDB instalado na máquina** (MongoDB Community): basta o serviço estar ativo.
  2. **Docker** (imagem oficial `mongo:7`): dentro da pasta `cidade-em-alerta`, rode `docker compose up -d`.
  3. **MongoDB Atlas** (nuvem): defina a variável de ambiente `MONGODB_URI` com a sua connection string antes de iniciar.

> Durante o desenvolvimento o MongoDB rodou em um container Docker. Não é um emulador: é o MongoDB oficial, o mesmo software de uma instalação comum, apenas empacotado em container. O código funciona igual em qualquer uma das opções.

## Como executar

Precisa de **Node.js** instalado e, para usar o MongoDB via Docker, do **Docker Desktop aberto**. Comandos para Windows (CMD); as variações para PowerShell e Linux/macOS estão no passo 2.

**1. Entre na pasta do projeto** (o `package.json` fica dentro de `cidade-em-alerta`, não na raiz do repositório):
```bash
cd cidade-em-alerta
```

**2. Garanta que não há uma configuração antiga do MongoDB.** A variável `MONGODB_URI` fica gravada na janela do terminal até ela ser fechada. Se você nunca a definiu, pode pular este passo.
```bash
set MONGODB_URI=
```
PowerShell: `Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue` · Linux/macOS: `unset MONGODB_URI`

**3. Suba o MongoDB** (porta 27017). Se você já tem o MongoDB instalado e ativo na máquina, pule este passo.
```bash
docker compose up -d
```

**4. Instale as dependências** (só na primeira vez):
```bash
npm install
```

**5. Inicie o app** e deixe esse terminal aberto:
```bash
npm start
```
Deve aparecer:
```
MongoDB conectado.
Servidor rodando em http://localhost:3000
```

**6. Abra no navegador:** http://localhost:3000 (formulário) e http://localhost:3000/registros.html (lista e indicadores).

### Controles
| Ação | Comando |
|---|---|
| Parar o app | `Ctrl + C` no terminal do `npm start` |
| Desligar o MongoDB (os dados são mantidos) | `docker compose down` |
| Ligar tudo de novo | `docker compose up -d` e depois `npm start` |
| Apagar o banco por completo (**cuidado: perde os registros**) | `docker compose down -v` |
| Ver se o MongoDB está no ar | `docker ps` (deve listar `cidade-em-alerta-mongo-1`) |
| Rodar os testes automatizados | `npm test` |

### Problemas comuns
| Mensagem | Causa e solução |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | O MongoDB não está rodando. Abra o Docker Desktop e rode `docker compose up -d` (passo 3). |
| `ECONNREFUSED` em outra porta (ex.: `27018`) | Sobrou uma `MONGODB_URI` antiga na janela. Faça o passo 2 ou abra um terminal novo. |
| `Could not read package.json` / `ENOENT` | Você está na pasta errada. Entre na `cidade-em-alerta` (passo 1). |
| `EADDRINUSE` (porta 3000 ocupada) | Feche o outro programa, ou use `set PORT=3001&& npm start` e abra http://localhost:3001 (sem espaço antes do `&&`). |

Se o MongoDB não estiver acessível, o servidor mostra uma mensagem de erro clara no terminal e encerra.

## Testes automatizados
```bash
npm test
```
São 14 testes (`node:test`, sem dependências extras) que **não precisam de MongoDB**: usam uma coleção em memória. Cobrem validação (incluindo tentativa de injeção NoSQL), rotas GET/POST, indicadores, 404, JSON malformado, corpo grande (413) e falha do banco (500 sem vazar detalhes).

## Variáveis de ambiente (opcionais)
| Variável | Padrão | Uso |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | Endereço do MongoDB |
| `PORT` | `3000` | Porta do servidor |

## Como testar manualmente
1. Em `/`, envie o formulário com um campo faltando: deve aparecer uma mensagem de erro.
2. Envie uma ocorrência válida: deve aparecer a mensagem de sucesso.
3. Abra `/registros.html`: a ocorrência aparece na lista e os indicadores são atualizados.
4. Acesse uma rota inexistente (ex.: `/xyz`): deve aparecer a página 404.

## Estrutura
```
cidade-em-alerta/
  server.js          servidor Express, validação e acesso ao MongoDB
  package.json
  docker-compose.yml MongoDB opcional via Docker
  public/            HTML, CSS e JavaScript do front-end
  test/              testes automatizados (npm test)
```

## Rotas
| Método | Rota | Função |
|---|---|---|
| GET | `/` | Formulário de registro |
| GET | `/registros.html` | Listagem e indicadores |
| GET | `/api/opcoes` | Categorias e prioridades aceitas |
| GET | `/api/ocorrencias` | Lista os registros |
| POST | `/api/ocorrencias` | Valida e grava um registro |
| GET | `/api/indicadores` | Indicadores calculados |
| qualquer outra | – | 404 |

## Dados
Banco `cidade_em_alerta`, coleção `ocorrencias`. Cada registro tem: título, categoria, prioridade, bairro, descrição (opcional) e data de criação. O servidor valida tamanho e valores permitidos antes de gravar.

## Indicadores
1. **Total de registros** (`countDocuments`).
2. **Resumo por categoria e por prioridade** (agrupamento `$group` do MongoDB).
3. **% de ocorrências com prioridade alta**: mostra a fatia de casos urgentes.

Esses números mostram quais problemas são mais frequentes e urgentes, ajudando a decidir onde agir primeiro.
