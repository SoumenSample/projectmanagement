"use client"

import * as React from "react"

import { useSession } from "next-auth/react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  rectIntersection,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  UserCircle,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskPriority = "low" | "medium" | "high"

type KanbanTask = {
  id: string
  title: string
  description: string
  priority: TaskPriority
  assignee: string
  assigneeId: string
  assigneeInitials: string
  collaborators: { name: string; initials: string }[]
  dueDate: string
  tags: string[]
  comments: number
  attachments: number
  createdByName: string
  createdById: string
}

type KanbanColumn = {
  id: string
  title: string
  tasks: KanbanTask[]
}

type UserEntry = { id: string; name: string; role?: string }

// ─── Seed / fallback ──────────────────────────────────────────────────────────

const initialColumns: KanbanColumn[] = [
  { id: "backlog", title: "Backlog", tasks: [] },
  { id: "in-progress", title: "In Progress", tasks: [] },
  { id: "done", title: "Done", tasks: [] },
]

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchColumns(): Promise<KanbanColumn[] | null> {
  try {
    const res = await fetch("/api/kanban", {
      cache: "no-store",
      credentials: "include",
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data.columns) ? data.columns : null
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createColumnId() {
  return `column-${crypto.randomUUID()}`
}

function makeInitials(name = "") {
  return (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getPriorityTone(priority: TaskPriority) {
  if (priority === "high")
    return "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
  if (priority === "medium")
    return "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
}

function findColumnByTaskId(
  columns: KanbanColumn[],
  taskId: string
): KanbanColumn | undefined {
  return columns.find((col) => col.tasks.some((t) => t.id === taskId))
}

function isKnownColumnId(columns: KanbanColumn[], value: string): boolean {
  return columns.some((col) => col.id === value)
}

// ─── Task card (sortable) ─────────────────────────────────────────────────────

function KanbanTaskCard({
  task,
  columnId,
  onEditTask,
  onDeleteTask,
  isOverlay = false,
}: {
  task: KanbanTask
  columnId: string
  onEditTask: (columnId: string, task: KanbanTask) => void
  onDeleteTask: (columnId: string, taskId: string) => void
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", columnId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition,
      }}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10",
        isDragging && !isOverlay && "opacity-40 ring-primary/30",
        isOverlay && "shadow-2xl rotate-1 cursor-grabbing"
      )}
    >
      <CardHeader className="gap-3 border-b border-border/60 pb-3">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-border/60 bg-muted/60 text-muted-foreground active:cursor-grabbing"
            aria-label={`Move ${task.title}`}
          >
            <GripVertical className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-semibold",
                  getPriorityTone(task.priority)
                )}
              >
                {task.tags[0] ?? "Task"}
              </Badge>
            </div>
            <CardTitle className="mt-2 text-base leading-5">
              {task.title}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2 text-sm leading-5">
              {task.description}
            </CardDescription>
            {task.createdByName && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                <UserCircle className="size-3" />
                Created by {task.createdByName}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-full"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Task actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditTask(columnId, task)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteTask(columnId, task.id)}
              >
                Delete
                <DropdownMenuShortcut>Del</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {task.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="rounded-full border-border/70 bg-background/80 px-2.5 py-0.5 text-xs font-medium"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <AvatarGroup>
            {task.collaborators.slice(0, 3).map((person) => (
              <Avatar key={`${task.id}-${person.initials}`} size="sm">
                <AvatarFallback>{person.initials}</AvatarFallback>
              </Avatar>
            ))}
            {task.collaborators.length > 3 ? (
              <div className="-ml-2 flex h-6 items-center rounded-full border border-background bg-muted px-2 text-xs font-medium text-muted-foreground">
                +{task.collaborators.length - 3}
              </div>
            ) : null}
          </AvatarGroup>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {task.comments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3.5" />
              {task.attachments}
            </span>
          </div>
        </div>
      </CardContent>
    </div>
  )
}

// ─── Column card (sortable) ───────────────────────────────────────────────────

function KanbanColumnCard({
  column,
  onAddTask,
  onDeleteColumn,
  onEditTask,
  onDeleteTask,
  isOverlay = false,
  users,
  session,
}: {
  column: KanbanColumn
  onAddTask: (columnId: string, task: Omit<KanbanTask, "id">) => void
  onDeleteColumn: (columnId: string) => void
  onEditTask: (columnId: string, task: KanbanTask) => void
  onDeleteTask: (columnId: string, taskId: string) => void
  isOverlay?: boolean
  users: UserEntry[]
  session: any
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
  })

  const [isComposerOpen, setIsComposerOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [assigneeId, setAssigneeId] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const isCompletedColumn = column.id === "done"

  function getAssignableUsers() {
    const currentRole = session?.user?.role
    const currentId = session?.user?.id
    if (!currentRole) return users
    return users.filter((u) => {
      if (currentRole === "employee")
        return u.role === "admin" || u.role === "employee" || u.id === currentId
      if (currentRole === "admin")
        return u.role === "employee" || u.role === "client" || u.id === currentId
      if (currentRole === "client")
        return u.id === currentId || u.role === "admin"
      return false
    })
  }

  function buildTaskPayload(): Omit<KanbanTask, "id"> {
    const selectedUser = users.find((u) => u.id === assigneeId)
    const resolvedName = selectedUser?.name ?? ""
    const resolvedInitials = makeInitials(resolvedName)
    return {
      title: title.trim(),
      description: description.trim(),
      priority: "medium",
      assignee: resolvedName,
      assigneeId: selectedUser?.id ?? "",
      assigneeInitials: resolvedInitials,
      collaborators: resolvedName
        ? [{ name: resolvedName, initials: resolvedInitials }]
        : [],
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      tags: [column.title],
      comments: 0,
      attachments: 0,
      createdByName: "",
      createdById: "",
    }
  }

  function handleAddTask() {
    if (!title.trim()) return
    onAddTask(column.id, buildTaskPayload())
    setTitle("")
    setDescription("")
    setAssigneeId("")
    setDueDate("")
    setIsComposerOpen(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition,
      }}
      className={cn(
        "group/card relative flex h-full min-h-[34rem] w-[22rem] shrink-0 flex-col overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 transition-shadow",
        isDragging && !isOverlay && "opacity-40 ring-primary/30",
        isOverlay && "shadow-2xl cursor-grabbing"
      )}
    >
      <CardHeader className="relative border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition hover:bg-muted active:cursor-grabbing"
            aria-label={`Move ${column.title}`}
          >
            <GripVertical className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-[1.05rem] font-semibold">
              <span
                className={cn(
                  isCompletedColumn && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {column.title}
              </span>
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {column.tasks.length}
              </span>
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-full"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Column actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setIsComposerOpen(true)}>
                Add task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteColumn(column.id)}
              >
                Delete column
                <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 p-3">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex min-h-28 flex-1 flex-col gap-3">
            {column.tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
            {column.tasks.length === 0 && (
              <div className="flex min-h-32 flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/70 px-4 text-center text-sm text-muted-foreground">
                Drop a task here or create a new one.
              </div>
            )}
          </div>
        </SortableContext>

        {isComposerOpen ? (
          <div className="space-y-3 rounded-xl border border-border/70 bg-background p-3">
            <div className="grid gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddTask() }
                  if (e.key === "Escape") setIsComposerOpen(false)
                }}
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short task summary"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                >
                  <option value="">Auto-assign (me)</option>
                  {getAssignableUsers().map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.role ? `(${u.role})` : ""}
                    </option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" className="flex-1" onClick={handleAddTask}>
                Add task
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsComposerOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="justify-start rounded-lg border border-dashed border-border/70"
            onClick={() => setIsComposerOpen(true)}
          >
            <Plus className="size-4" />
            Add task
          </Button>
        )}
      </CardContent>
    </div>
  )
}

// ─── Board ────────────────────────────────────────────────────────────────────

export function KanbanBoard() {
  const [columns, setColumns] = React.useState<KanbanColumn[]>(initialColumns)
  const [mounted, setMounted] = React.useState(false)
  const [newColumnTitle, setNewColumnTitle] = React.useState("")
  const [addingColumn, setAddingColumn] = React.useState(false)

  // columnsRef always mirrors `columns` so drag handlers never read stale state
  const columnsRef = React.useRef<KanbanColumn[]>(columns)
  React.useEffect(() => {
    columnsRef.current = columns
  }, [columns])

  // active drag state
  const [activeTask, setActiveTask] = React.useState<{
    task: KanbanTask
    columnId: string
  } | null>(null)
  const [activeColumn, setActiveColumn] = React.useState<KanbanColumn | null>(null)

  // edit dialog
  const [editingTask, setEditingTask] = React.useState<{
    columnId: string
    taskId: string
  } | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [editAssigneeId, setEditAssigneeId] = React.useState("")
  const [editDueDate, setEditDueDate] = React.useState("")

  const { data: session } = useSession()
  const [users, setUsers] = React.useState<UserEntry[]>([])

  // Guard against duplicate in-flight PATCHes for the same drag gesture
  const dragPatchInFlight = React.useRef(false)

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX (core): We store the task's ORIGINAL column at drag-start, so that
  // handleDragEnd always knows the DB-persisted column to PATCH from/to.
  // After dragOver moves the task visually, columnsRef is updated — but we
  // still need the *destination* column. We resolve it from columnsRef at
  // drag-end time (after all dragOver mutations have settled), not from the
  // stale `over.data.current?.columnId` which is frozen at drag-start.
  // ─────────────────────────────────────────────────────────────────────────────
  const dragOriginColumnId = React.useRef<string>("")

  React.useEffect(() => { setMounted(true) }, [])

  // Load board data on mount
  React.useEffect(() => {
    let active = true
    ;(async () => {
      const cols = await fetchColumns()
      if (!active) return
      setColumns(cols ?? initialColumns)
    })()
    return () => { active = false }
  }, [])

  // Load users once
  React.useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch("/api/users/list", { credentials: "include" })
        const json = await res.json()
        const apiUsers = Array.isArray(json?.users) ? json.users : []
        const mapped: UserEntry[] = apiUsers.map((u: any) => ({
          id: u._id,
          name: u.name || u.email || "Unknown",
          role: u.role,
        }))
        if (active) setUsers(mapped)
      } catch { /* ignore */ }
    })()
    return () => { active = false }
  }, [])

  function getAssignableUsersForEditor(): UserEntry[] {
    const currentRole = (session as any)?.user?.role
    const currentId = (session as any)?.user?.id
    if (!currentRole) return users
    return users.filter((u) => {
      if (currentRole === "employee")
        return u.role === "admin" || u.role === "employee" || u.id === currentId
      if (currentRole === "admin")
        return u.role === "employee" || u.role === "client" || u.id === currentId
      if (currentRole === "client")
        return u.id === currentId || u.role === "admin"
      return false
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Drag start ──────────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type

    if (type === "column") {
      const col = columnsRef.current.find((c) => c.id === event.active.id)
      setActiveColumn(col ?? null)
      setActiveTask(null)
      dragOriginColumnId.current = ""
      return
    }

    if (type === "task") {
      const columnId = event.active.data.current?.columnId as string
      const col = columnsRef.current.find((c) => c.id === columnId)
      const task = col?.tasks.find((t) => t.id === event.active.id)
      if (task) {
        setActiveTask({ task, columnId })
        // FIX: record where the task started so dragEnd can compute the right destination
        dragOriginColumnId.current = columnId
      }
      setActiveColumn(null)
    }
  }

  // ── Drag over (live visual reorder while dragging) ──────────────────────────

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    if (activeType !== "task") return

    // FIX: always read from columnsRef — never from stale `active.data.current.columnId`
    // After the first dragOver fires and moves the task, the data attached to the
    // active item no longer reflects the current column. Use columnsRef instead.
    const latestColumns = columnsRef.current
    const activeColNow = findColumnByTaskId(latestColumns, String(active.id))
    if (!activeColNow) return

    const overType = over.data.current?.type
    const overColumnId: string =
      overType === "task"
        ? (over.data.current?.columnId as string)
        : overType === "column"
        ? (over.id as string)
        : isKnownColumnId(latestColumns, String(over.id))
        ? String(over.id)
        : ""

    if (!overColumnId) return
    if (activeColNow.id === overColumnId) return // same column — handled in dragEnd

    setColumns((current) => {
      const next = current.map((col) => ({ ...col, tasks: [...col.tasks] }))

      const sourceCol = next.find((c) => c.id === activeColNow.id)
      const destCol = next.find((c) => c.id === overColumnId)
      if (!sourceCol || !destCol) return current

      const activeIndex = sourceCol.tasks.findIndex((t) => t.id === active.id)
      if (activeIndex === -1) return current // already moved

      const [movedTask] = sourceCol.tasks.splice(activeIndex, 1)
      if (!movedTask) return current

      const overIndex =
        overType === "task"
          ? destCol.tasks.findIndex((t) => t.id === over.id)
          : destCol.tasks.length

      destCol.tasks.splice(overIndex < 0 ? destCol.tasks.length : overIndex, 0, movedTask)

      return next
    })
  }

  // ── Drag end (finalise + persist) ───────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    setActiveColumn(null)

    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type

    // ── Column reorder ──────────────────────────────────────────────────────
    if (activeType === "column") {
      if (active.id === over.id) return

      setColumns((current) => {
        const fromIndex = current.findIndex((c) => c.id === active.id)
        const toIndex = current.findIndex((c) => c.id === over.id)
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex)
          return current

        const next = arrayMove(current, fromIndex, toIndex)

        ;(async () => {
          try {
            await fetch("/api/kanban", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                action: "reorderColumns",
                orderedIds: next.map((c) => c.id),
              }),
            })
          } catch { /* non-critical */ }
        })()

        return next
      })
      return
    }

    // ── Task drop ───────────────────────────────────────────────────────────
    if (activeType !== "task") return

    // FIX: resolve the destination column from columnsRef AFTER all dragOver
    // mutations have already settled — this is the actual column the task is in now.
    const latestColumns = columnsRef.current
    const destinationCol = findColumnByTaskId(latestColumns, String(active.id))
    if (!destinationCol) return

    const finalColumnId = destinationCol.id
    const originColumnId = dragOriginColumnId.current

    // ── Same-column reorder ─────────────────────────────────────────────────
    if (finalColumnId === originColumnId) {
      // dragOver doesn't handle same-column reorder — do it here
      const overType = over.data.current?.type
      if (overType !== "task" || active.id === over.id) return

      setColumns((current) => {
        const next = current.map((col) => ({ ...col, tasks: [...col.tasks] }))
        const col = next.find((c) => c.id === finalColumnId)
        if (!col) return current

        const fromIndex = col.tasks.findIndex((t) => t.id === active.id)
        const toIndex = col.tasks.findIndex((t) => t.id === over.id)
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex)
          return current

        col.tasks = arrayMove(col.tasks, fromIndex, toIndex)
        return next
      })
      // Same-column reorder — no PATCH needed (order within a column isn't persisted)
      return
    }

    // ── Cross-column: dragOver already updated local state visually ─────────
    // Now persist the new columnId to the server.
    if (dragPatchInFlight.current) return
    dragPatchInFlight.current = true

    ;(async () => {
      try {
        const res = await fetch("/api/kanban", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            // FIX: send the task id and the RESOLVED destination columnId from
            // columnsRef — NOT from over.data.current which is frozen at drag-start
            id: String(active.id),
            columnId: finalColumnId,
          }),
        })

        if (res.ok) {
          // Refresh from server to confirm persistence (don't re-apply visually)
          const cols = await fetchColumns()
          if (cols) setColumns(cols)
        } else {
          // Server rejected — revert to server state
          const cols = await fetchColumns()
          if (cols) setColumns(cols)
        }
      } catch {
        // Network error — revert to server state
        const cols = await fetchColumns()
        if (cols) setColumns(cols)
      } finally {
        dragPatchInFlight.current = false
        dragOriginColumnId.current = ""
      }
    })()
  }

  // ── Board mutations ─────────────────────────────────────────────────────────

  async function addTask(columnId: string, task: Omit<KanbanTask, "id">) {
    try {
      const payload: Record<string, unknown> = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeId: task.assigneeId || undefined,
        assigneeName: task.assignee || undefined,
        assigneeInitials: task.assigneeInitials || undefined,
        collaborators: task.collaborators,
        dueDate: task.dueDate || undefined,
        tags: task.tags,
        columnId,
      }

      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const cols = await fetchColumns()
        if (cols) { setColumns(cols); return }
      }
    } catch { /* fallthrough */ }

    // Optimistic local update as fallback
    setColumns((current) =>
      current.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: [
                ...col.tasks,
                {
                  ...task,
                  id: `task-${crypto.randomUUID()}`,
                  createdByName: (session as any)?.user?.name ?? "",
                  createdById: (session as any)?.user?.id ?? "",
                },
              ],
            }
          : col
      )
    )
  }

  async function addColumn() {
    const title = newColumnTitle.trim()
    if (!title) return

    const newId = createColumnId()

    setColumns((current) => [...current, { id: newId, title, tasks: [] }])
    setNewColumnTitle("")
    setAddingColumn(false)

    try {
      await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "createColumn", columnId: newId, title }),
      })
    } catch { /* non-critical */ }
  }

  async function deleteColumn(columnId: string) {
    if (!window.confirm("Delete this column? Tasks will move to Backlog.")) return
    setColumns((current) => current.filter((col) => col.id !== columnId))

    try {
      await fetch("/api/kanban", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "deleteColumn", columnId }),
      })
    } catch { /* non-critical */ }
  }

  function openTaskEditor(columnId: string, task: KanbanTask) {
    setEditingTask({ columnId, taskId: task.id })
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditDueDate(task.dueDate)
    setEditAssigneeId(task.assigneeId ?? "")
  }

  function saveTaskEdit() {
    if (!editingTask) return
    const title = editTitle.trim()
    if (!title) return

    const assigneeUser = users.find((u) => u.id === editAssigneeId)
    const assigneeName = assigneeUser?.name ?? ""
    const assigneeInitials = makeInitials(assigneeName)

    ;(async () => {
      try {
        const payload: Record<string, unknown> = {
          id: editingTask.taskId,
          title,
          description: editDescription.trim(),
          dueDate: editDueDate || undefined,
          updateAssignee: true,
          assigneeId: assigneeUser ? assigneeUser.id : null,
          assigneeName: assigneeName || "",
          assigneeInitials: assigneeInitials,
        }

        const res = await fetch("/api/kanban", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          const cols = await fetchColumns()
          if (cols) {
            setColumns(cols)
            setEditingTask(null)
            return
          }
        }
      } catch { /* fallback to local */ }

      setColumns((current) => {
        const next = current.map((col) => {
          if (col.id !== editingTask.columnId) return col
          return {
            ...col,
            tasks: col.tasks.map((t) =>
              t.id === editingTask.taskId
                ? {
                    ...t,
                    title,
                    description: editDescription.trim(),
                    assignee: assigneeName,
                    assigneeId: editAssigneeId,
                    assigneeInitials,
                    dueDate: editDueDate || t.dueDate,
                  }
                : t
            ),
          }
        })
        setEditingTask(null)
        return next
      })
    })()
  }

  function deleteTask(columnId: string, taskId: string) {
    if (!window.confirm("Delete this task?")) return
    ;(async () => {
      try {
        const res = await fetch("/api/kanban", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: taskId }),
        })

        if (res.ok) {
          const cols = await fetchColumns()
          if (cols) { setColumns(cols); return }
        }
      } catch { /* fallback */ }

      setColumns((current) =>
        current.map((col) =>
          col.id === columnId
            ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
            : col
        )
      )
    })()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted) {
    return <div className="w-full overflow-x-auto pb-4" />
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-max">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex min-h-[36rem] w-max items-start gap-4 pb-2">
              {columns.map((column) => (
                <KanbanColumnCard
                  key={column.id}
                  column={column}
                  onAddTask={addTask}
                  onDeleteColumn={deleteColumn}
                  onEditTask={openTaskEditor}
                  onDeleteTask={deleteTask}
                  users={users}
                  session={session}
                />
              ))}

              {/* Add New Column */}
              <div className="flex w-[22rem] shrink-0 flex-col">
                {addingColumn ? (
                  <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <Input
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      placeholder="Column title"
                      className="bg-background"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addColumn()
                        if (e.key === "Escape") {
                          setAddingColumn(false)
                          setNewColumnTitle("")
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button type="button" onClick={addColumn} className="flex-1">
                        Add column
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setAddingColumn(false)
                          setNewColumnTitle("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingColumn(true)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 text-sm font-medium text-muted-foreground transition-colors hover:border-border/80 hover:bg-card hover:text-foreground"
                  >
                    <Plus className="size-4" />
                    Add New Column
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          {/* Drag overlay — floating clone while dragging */}
          <DragOverlay
            dropAnimation={{
              duration: 180,
              easing: "cubic-bezier(0.18,0.67,0.6,1.22)",
            }}
          >
            {activeTask ? (
              <KanbanTaskCard
                task={activeTask.task}
                columnId={activeTask.columnId}
                onEditTask={() => {}}
                onDeleteTask={() => {}}
                isOverlay
              />
            ) : activeColumn ? (
              <KanbanColumnCard
                column={activeColumn}
                onAddTask={() => {}}
                onDeleteColumn={() => {}}
                onEditTask={() => {}}
                onDeleteTask={() => {}}
                isOverlay
                users={users}
                session={session}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit task dialog */}
      <Dialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update the task details and save the changes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task title"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={editAssigneeId}
                onChange={(e) => setEditAssigneeId(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="">Unassigned</option>
                {getAssignableUsersForEditor().map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingTask(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveTaskEdit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}