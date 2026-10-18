#!/usr/bin/env bash
# Writes a small TanStack Start + TanStack DB + oRPC + Drizzle app on Cloudflare into the empty workspace.
set -euo pipefail
mkdir -p src/server/db src/lib src/features/projects src/features/issues src/routes src/components
cat > package.json <<'EOF'
{
  "name": "acme-tracker",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.3.0",
  "scripts": { "dev": "vite dev", "build": "vite build", "check": "tsc --noEmit && vitest run" },
  "dependencies": {
    "@orpc/client": "1.15.7",
    "@orpc/server": "1.15.7",
    "@tanstack/query-db-collection": "1.4.4",
    "@tanstack/react-db": "0.14.0",
    "@tanstack/react-form": "1.23.0",
    "@tanstack/react-query": "5.90.2",
    "@tanstack/react-router": "1.140.0",
    "@tanstack/react-start": "1.140.0",
    "drizzle-orm": "0.45.1",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "zod": "4.1.12"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "1.13.0",
    "typescript": "7.0.2",
    "vite": "7.3.0",
    "vitest": "5.0.4",
    "wrangler": "4.150.0"
  }
}
EOF
cat > wrangler.jsonc <<'EOF'
{
  "name": "acme-tracker",
  "main": "src/server.ts",
  "compatibility_date": "2026-09-01",
  "durable_objects": { "bindings": [{ "name": "ISSUES_ROOM", "class_name": "IssuesRoom" }] },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["IssuesRoom"] }]
}
EOF
cat > src/server/db/schema.ts <<'EOF'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  ownerId: uuid('owner_id').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const issues = pgTable('issues', {
  id: uuid('id').primaryKey(),
  projectId: uuid('project_id').notNull(),
  title: text('title').notNull(),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
EOF
cat > src/server/router.ts <<'EOF'
import { os, ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from './db/client.server'
import { issues, projects } from './db/schema'

type Ctx = { user: { id: string } }
const authed = os.$context<Ctx>()

export const router = {
  projects: {
    list: authed.handler(({ context }) => db.select().from(projects).where(eq(projects.ownerId, context.user.id))),
    rename: authed
      .input(z.object({ id: z.uuid(), name: z.string().trim().min(1).max(200) }))
      .handler(async ({ input, context }) => {
        const [row] = await db.update(projects).set({ name: input.name })
          .where(and(eq(projects.id, input.id), eq(projects.ownerId, context.user.id))).returning()
        if (!row) throw new ORPCError('NOT_FOUND')
        return row
      }),
  },
  issues: {
    list: authed.input(z.object({ projectId: z.uuid() }))
      .handler(({ input }) => db.select().from(issues).where(eq(issues.projectId, input.projectId))),
  },
}
export type Router = typeof router
EOF
cat > src/lib/rpc.ts <<'EOF'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { Router } from '../server/router'

export const client: RouterClient<Router> = createORPCClient(new RPCLink({ url: `${location.origin}/rpc` }))
EOF
cat > src/lib/query.ts <<'EOF'
import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient()
EOF
cat > src/features/projects/collection.ts <<'EOF'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { queryClient } from '../../lib/query'
import { client } from '../../lib/rpc'

export const projectsCollection = createCollection(queryCollectionOptions({
  queryClient,
  queryKey: ['projects'],
  queryFn: () => client.projects.list(),
  getKey: (p) => p.id,
  onUpdate: ({ transaction }) =>
    Promise.all(transaction.mutations.map((m) => client.projects.rename({ id: m.original.id, name: m.modified.name }))),
}))
EOF
cat > 'src/routes/projects.$projectId.tsx' <<'EOF'
import { createFileRoute } from '@tanstack/react-router'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { projectsCollection } from '../features/projects/collection'
import { IssueList } from '../features/issues/IssueList'

export const Route = createFileRoute('/projects/$projectId')({
  loader: () => projectsCollection.preload(),
  component: ProjectPage,
})

function ProjectPage() {
  const { projectId } = Route.useParams()
  const { data } = useLiveQuery((q) => q.from({ p: projectsCollection }).where(({ p }) => eq(p.id, projectId)))
  const project = data[0]
  return (
    <main>
      <h1>{project?.name}</h1>
      {/* TODO: tasks */}
      <IssueList projectId={projectId} />
    </main>
  )
}
EOF
cat > src/features/issues/IssueList.tsx <<'EOF'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../lib/rpc'

export function IssueList({ projectId }: { projectId: string }) {
  const { data = [] } = useQuery({ queryKey: ['issues', projectId], queryFn: () => client.issues.list({ projectId }) })
  return <ul>{data.map((i) => <li key={i.id}>{i.title} · {i.status}</li>)}</ul>
}
EOF
cat > src/components/Sidebar.tsx <<'EOF'
import { useState } from 'react'

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(260)
  return (
    <aside style={{ width }}>
      <div onPointerDown={(e) => startResize(e, width, setWidth)} aria-label="Resize sidebar" role="separator" />
      {children}
    </aside>
  )
}

function startResize(e: React.PointerEvent, start: number, set: (w: number) => void) {
  const x0 = e.clientX
  const move = (ev: PointerEvent) => set(Math.min(480, Math.max(180, start + ev.clientX - x0)))
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', () => window.removeEventListener('pointermove', move), { once: true })
}
EOF
cat > src/components/DataTable.tsx <<'EOF'
import { useState } from 'react'

export function DataTable<T>({ id, columns, rows }: { id: string; columns: { key: keyof T & string; label: string }[]; rows: T[] }) {
  const [widths, setWidths] = useState<Record<string, number>>({})
  return (
    <table data-table={id}>
      <thead><tr>{columns.map((c) => (
        <th key={c.key} style={{ width: widths[c.key] ?? 160 }} onDoubleClick={() => setWidths((w) => ({ ...w, [c.key]: 160 }))}>{c.label}</th>
      ))}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c.key}>{String(r[c.key])}</td>)}</tr>)}</tbody>
    </table>
  )
}
EOF
mkdir -p src/features/projects
cat > src/features/projects/hooks.ts <<'EOT'
import { useEffect, useState } from 'react'
import { client } from '../../lib/rpc'

// Recent projects for the sidebar. Simple and fine for now.
export function useRecentProjects() {
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof client.projects.list>>>([])
  useEffect(() => { client.projects.list().then((p) => setProjects(p.slice(0, 5))) }, [])
  return projects
}
EOT
