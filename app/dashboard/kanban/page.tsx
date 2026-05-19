import { requireAuth } from "@/lib/auth"
import { KanbanBoard } from "@/components/dashboard/kanban-board"

export const dynamic = "force-dynamic"

export default async function KanbanPage() {
  await requireAuth()

  return <KanbanBoard />
}