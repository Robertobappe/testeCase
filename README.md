# Gerenciador de Tarefas — NextJS + tRPC

Sistema simples de gerenciamento de tarefas com CRUD completo
## Stack

- **NextJS 16** (App Router, Server Components, SSR)
- **tRPC v11** (API type-safe end-to-end)
- **React Query** (cache, infinite scroll, invalidação)
- **Tailwind CSS v3** (estilização)
- **Zod** (validação de input)
- **TypeScript** (tipagem estática)

## Arquitetura

```
src/
├── server/
│   ├── trpc/index.ts        # Inicialização tRPC + superjson
│   ├── caller.ts            # Server-side caller para SSR
│   └── routers/
│       ├── _app.ts          # Router principal
│       └── task.ts          # CRUD de tarefas (memória)
├── trpc/
│   ├── client.ts            # createTRPCReact (client-side)
│   └── provider.tsx         # Provider com React Query
├── app/
│   ├── api/trpc/[trpc]/     # Route handler tRPC
│   ├── layout.tsx           # Layout com TRPCProvider
│   └── page.tsx             # SSR: pré-carrega tarefas
└── components/
    └── TaskManager.tsx       # UI completa com infinite scroll
```

## Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Rodar servidor de desenvolvimento
npm run dev

# 3. Abrir no navegador
open http://localhost:3000
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |

## Funcionalidades

### Backend (tRPC)
- **Criar tarefa** — título obrigatório, descrição opcional
- **Listar tarefas** — endpoint completo + endpoint paginado (cursor)
- **Atualizar tarefa** — editar título e descrição
- **Deletar tarefa** — remover por id
- **Toggle** — marcar/desmarcar como concluída
- **Validação** — Zod rejeita título vazio; erros significativos para tarefas inexistentes

### Frontend
- **SSR** — `page.tsx` é async Server Component (`force-dynamic`), pré-carrega tarefas no servidor
- **Infinite Scroll** — `useInfiniteQuery` + `IntersectionObserver` carrega páginas conforme scroll
- **Feedback visual** — mensagens de sucesso (verde) e erro (vermelho) com auto-dismiss de 3s
- **Edição inline** — formulário aparece dentro do card sem navegar para outra página
- **Validação no formulário** — botão desabilitado se título vazio ou só espaços

### Modelo de Dados

```typescript
interface Task {
  id: string;        // gerado automaticamente (incremento)
  titulo: string;    // obrigatório
  descricao: string; // opcional (default "")
  completed: boolean;
  dataCriacao: Date;
}
```

## Decisões Técnicas

| Decisão | Motivo |
|---------|--------|
| Backend em memória (array) | Requisito do case — sem banco |
| superjson | Serializar `Date` sem perda de tipo |
| Cursor-based pagination | Mais eficiente que offset para listas mutáveis |
| `force-dynamic` no page.tsx | Garante SSR a cada request (dados sempre atualizados) |
| Tailwind v3 (não v4) | v4 usa binários nativos (oxide) que podem falhar em certos ambientes |
| Edição inline (não rota separada) | UX mais fluida, "menos é mais" |
| IntersectionObserver | Padrão nativo, sem dependência extra para infinite scroll |

## Observações

- Os dados vivem **em memória** — reiniciar o servidor apaga todas as tarefas (comportamento esperado)
- A paginação usa **10 itens por página** (configurável via `PAGE_SIZE`)
- O React Query faz **refetch automático** quando a aba ganha foco (`refetchOnWindowFocus`)
