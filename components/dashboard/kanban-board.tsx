"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
  CalendarDays,
  CircleDashed,
  GripVertical,
  KanbanSquare,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type TaskPriority = "low" | "medium" | "high"

type KanbanTask = {
  id: string
  title: string
  description: string
  priority: TaskPriority
  assignee: string
  assigneeInitials: string
  collaborators: { name: string; initials: string }[]
  dueDate: string
  tags: string[]
  comments: number
  attachments: number
}

type KanbanColumn = {
  id: string
  title: string
  tasks: KanbanTask[]
}

const initialColumns: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      {
        id: "task-1",
        title: "Map customer onboarding flow",
        description: "Document the first-touch journey and highlight the highest-friction steps.",
        priority: "high",
        assignee: "Maya",
        assigneeInitials: "M",
        collaborators: [
          { name: "Maya", initials: "M" },
          { name: "Noah", initials: "N" },
          { name: "Zoe", initials: "Z" },
        ],
        dueDate: "2026-05-08",
        tags: ["Research", "UX"],
        comments: 1,
        attachments: 2,
      },
      {
        id: "task-2",
        title: "Review sprint requests",
        description: "Triage incoming work and split it into actionable deliverables.",
        priority: "medium",
        assignee: "Noah",
        assigneeInitials: "N",
        collaborators: [
          { name: "Noah", initials: "N" },
          { name: "Ava", initials: "A" },
        ],
        dueDate: "2026-05-10",
        tags: ["Planning"],
        comments: 2,
        attachments: 0,
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    tasks: [
      {
        id: "task-3",
        title: "Ship kanban interactions",
        description: "Wire drag and drop, add-task actions, and live column updates.",
        priority: "high",
        assignee: "Ava",
        assigneeInitials: "A",
        collaborators: [
          { name: "Ava", initials: "A" },
          { name: "Maya", initials: "M" },
          { name: "Leo", initials: "L" },
          { name: "Zoe", initials: "Z" },
        ],
        dueDate: "2026-05-03",
        tags: ["Frontend", "Motion"],
        comments: 2,
        attachments: 6,
      },
      {
        id: "task-4",
        title: "Refine board spacing",
        description: "Tune card density and scroll behavior for larger project boards.",
        priority: "low",
        assignee: "Leo",
        assigneeInitials: "L",
        collaborators: [
          { name: "Leo", initials: "L" },
          { name: "Ava", initials: "A" },
        ],
        dueDate: "2026-05-12",
        tags: ["UI"],
        comments: 1,
        attachments: 0,
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      {
        id: "task-5",
        title: "Confirm release scope",
        description: "Lock the deliverables and publish the checklist for stakeholders.",
        priority: "medium",
        assignee: "Zoe",
        assigneeInitials: "Z",
        collaborators: [
          { name: "Zoe", initials: "Z" },
          { name: "Maya", initials: "M" },
          { name: "Noah", initials: "N" },
        ],
        dueDate: "2026-05-01",
        tags: ["Delivery"],
        comments: 2,
        attachments: 1,
      },
    ],
  },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function createTaskId() {
  return `task-${crypto.randomUUID()}`
}

function createColumnId() {
  return `column-${crypto.randomUUID()}`
}

function getPriorityTone(priority: TaskPriority) {
  if (priority === "high") return "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
  if (priority === "medium") return "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
}

function KanbanTaskCard({
  task,
  columnId,
  onEditTask,
  onDeleteTask,
}: {
  task: KanbanTask
  columnId: string
  onEditTask: (columnId: string, task: KanbanTask) => void
  onDeleteTask: (columnId: string, taskId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
      className="group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10"
    >
      <CardHeader className="gap-3 border-b border-border/60 pb-3">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "mt-0.5 inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-border/60 bg-muted/60 text-muted-foreground active:cursor-grabbing"
            )}
            aria-label={`Move ${task.title}`}
          >
            <GripVertical className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", getPriorityTone(task.priority))}>
                {task.tags[0] ?? "Task"}
              </Badge>
            </div>
            <CardTitle className="mt-2 text-base leading-5">{task.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2 text-sm leading-5">
              {task.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 rounded-full">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Task actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditTask(columnId, task)}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDeleteTask(columnId, task.id)}>
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
            <Badge key={tag} variant="outline" className="rounded-full border-border/70 bg-background/80 px-2.5 py-0.5 text-xs font-medium">
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

function KanbanColumnCard({
  column,
  onAddTask,
  onDeleteColumn,
  onEditTask,
  onDeleteTask,
}: {
  column: KanbanColumn
  onAddTask: (columnId: string, task: Omit<KanbanTask, "id">) => void
  onDeleteColumn: (columnId: string) => void
  onEditTask: (columnId: string, task: KanbanTask) => void
  onDeleteTask: (columnId: string, taskId: string) => void
}) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({
    id: column.id,
    data: { type: "column" },
  })
  const [isComposerOpen, setIsComposerOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [assignee, setAssignee] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const isCompletedColumn = column.id === "done"

  // users and role-aware assignee options
  const [users, setUsers] = React.useState<Array<{ id: string; name: string; role?: string }>>([])
  const { data: session } = useSession()

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/users/list", { credentials: "include" })
        const json = await res.json()
        const apiUsers = Array.isArray(json?.users) ? json.users : []
        const mapped = apiUsers.map((u: any) => ({ id: u._id, name: u.name || u.email || "Unknown", role: u.role }))
        if (mounted) setUsers(mapped)
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  function getAssignableUsers() {
    const currentRole = (session as any)?.user?.role
    const currentId = (session as any)?.user?.id
    if (!currentRole) return users

    return users.filter((u) => {
      if (currentRole === "employee") {
        // employee can assign admins, other employees and himself
        return u.role === "admin" || u.role === "employee" || u.id === currentId
      }
      if (currentRole === "admin") {
        // admin can assign employees, clients and himself
        return u.role === "employee" || u.role === "client" || u.id === currentId
      }
      if (currentRole === "client") {
        // client can assign himself and admins
        return u.id === currentId || u.role === "admin"
      }

      return false
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return

    const normalizedAssignee = assignee.trim() || "Unassigned"
    const assigneeInitials = normalizedAssignee
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

    onAddTask(column.id, {
      title: title.trim(),
      description: description.trim(),
      priority: "medium",
      assignee: normalizedAssignee,
      assigneeInitials,
      collaborators: [{ name: normalizedAssignee, initials: assigneeInitials }],
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      tags: [column.title],
      comments: 0,
      attachments: 0,
    })

    setTitle("")
    setDescription("")
    setAssignee("")
    setDueDate("")
    setIsComposerOpen(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group/card relative flex h-full min-h-[34rem] w-[22rem] shrink-0 flex-col overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 transition-shadow",
        isDragging && "opacity-50 ring-2 ring-primary/40 shadow-xl"
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
              <span className={cn(isCompletedColumn && "text-emerald-600 dark:text-emerald-400")}>{column.title}</span>

            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 rounded-full">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Column actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setIsComposerOpen(true)}>Add task</DropdownMenuItem>
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
        <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
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

            {column.tasks.length === 0 ? (
              <div className="flex min-h-32 flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/70 px-4 text-center text-sm text-muted-foreground">
                Drop a task here or create a new one.
              </div>
            ) : null}
          </div>
        </SortableContext>

        {isComposerOpen ? (
          <form className="space-y-3 rounded-xl border border-border/70 bg-background p-3" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Task title"
                autoFocus
              />
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short task summary"
              />
              <div className="grid grid-cols-2 gap-2">
              {users.length > 0 ? (
                <select
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1"
                >
                  <option value="">Unassigned</option>
                  {getAssignableUsers().map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} {u.role ? `(${u.role})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                  placeholder="Assignee"
                />
              )}
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" className="flex-1">
                Add task
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsComposerOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
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

export function KanbanBoard() {
  const [columns, setColumns] = React.useState<KanbanColumn[]>(initialColumns)
  const [newColumnTitle, setNewColumnTitle] = React.useState("")
  const [addingColumn, setAddingColumn] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<{ columnId: string; taskId: string } | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [editAssignee, setEditAssignee] = React.useState("")
  const [editDueDate, setEditDueDate] = React.useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const taskCount = columns.reduce((total, column) => total + column.tasks.length, 0)
  const doneCount = columns.find((column) => column.id === "done")?.tasks.length ?? 0

  function addTask(columnId: string, task: Omit<KanbanTask, "id">) {
    setColumns((current) =>
      current.map((column) =>
        column.id === columnId
          ? { ...column, tasks: [...column.tasks, { ...task, id: createTaskId() }] }
          : column
      )
    )
  }

  function addColumn() {
    const title = newColumnTitle.trim()
    if (!title) return

    setColumns((current) => [
      ...current,
      {
        id: createColumnId(),
        title,
        tasks: [],
      },
    ])
    setNewColumnTitle("")
    setAddingColumn(false)
  }

  function deleteColumn(columnId: string) {
    setColumns((current) => current.filter((column) => column.id !== columnId))
  }

  function openTaskEditor(columnId: string, task: KanbanTask) {
    setEditingTask({ columnId, taskId: task.id })
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditAssignee(task.assignee)
    setEditDueDate(task.dueDate)
  }

  function saveTaskEdit() {
    if (!editingTask) return

    const title = editTitle.trim()
    if (!title) return

    setColumns((current) =>
      current.map((column) => {
        if (column.id !== editingTask.columnId) return column

        return {
          ...column,
          tasks: column.tasks.map((task) =>
            task.id === editingTask.taskId
              ? {
                  ...task,
                  title,
                  description: editDescription.trim(),
                  assignee: editAssignee.trim() || "Unassigned",
                  dueDate: editDueDate || task.dueDate,
                }
              : task
          ),
        }
      })
    )

    setEditingTask(null)
  }

  function deleteTask(columnId: string, taskId: string) {
    const shouldDelete = window.confirm("Delete this task?")
    if (!shouldDelete) return

    setColumns((current) =>
      current.map((column) =>
        column.id === columnId
          ? { ...column, tasks: column.tasks.filter((task) => task.id !== taskId) }
          : column
      )
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type

    if (activeType === "column") {
      const sourceIndex = columns.findIndex((column) => column.id === active.id)
      const destinationIndex = columns.findIndex((column) => column.id === over.id)

      if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) {
        return
      }

      setColumns((current) => arrayMove(current, sourceIndex, destinationIndex))
      return
    }

    if (activeType !== "task") return

    const sourceColumnId = active.data.current?.columnId as string | undefined
    if (!sourceColumnId) return

    const sourceColumnIndex = columns.findIndex((column) => column.id === sourceColumnId)
    const sourceColumn = columns[sourceColumnIndex]
    if (!sourceColumn) return

    const activeTaskIndex = sourceColumn.tasks.findIndex((task) => task.id === active.id)
    if (activeTaskIndex === -1) return

    const overType = over.data.current?.type
    const destinationColumnId =
      (overType === "task" && (over.data.current?.columnId as string | undefined)) ||
      (overType === "column" ? (over.id as string) : undefined)

    if (!destinationColumnId) return

    const destinationColumnIndex = columns.findIndex((column) => column.id === destinationColumnId)
    const destinationColumn = columns[destinationColumnIndex]
    if (!destinationColumn) return

    const destinationTaskIndex =
      overType === "task"
        ? destinationColumn.tasks.findIndex((task) => task.id === over.id)
        : destinationColumn.tasks.length

    setColumns((current) => {
      const next = current.map((column) => ({ ...column, tasks: [...column.tasks] }))
      const source = next.find((column) => column.id === sourceColumnId)
      const destination = next.find((column) => column.id === destinationColumnId)

      if (!source || !destination) return current

      const [movedTask] = source.tasks.splice(activeTaskIndex, 1)
      if (!movedTask) return current

      movedTask.tags = Array.from(new Set([...movedTask.tags.filter(Boolean), destination.title]))
      movedTask.dueDate = movedTask.dueDate || new Date().toISOString().slice(0, 10)

      if (source.id === destination.id) {
        const targetIndex =
          destinationTaskIndex < 0 ? source.tasks.length : destinationTaskIndex
        source.tasks.splice(targetIndex, 0, movedTask)
      } else {
        const targetIndex = destinationTaskIndex < 0 ? destination.tasks.length : destinationTaskIndex
        destination.tasks.splice(targetIndex, 0, movedTask)
      }

      return next
    })
  }

  const completed = columns.find((column) => column.id === "done")?.tasks.length ?? 0

  // users for edit dialog and role filtering
  const { data: session } = useSession()
  const [users, setUsers] = React.useState<Array<{ id: string; name: string; role?: string }>>([])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/users/list", { credentials: "include" })
        const json = await res.json()
        const apiUsers = Array.isArray(json?.users) ? json.users : []
        const mapped = apiUsers.map((u: any) => ({ id: u._id, name: u.name || u.email || "Unknown", role: u.role }))
        if (mounted) setUsers(mapped)
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  function getAssignableUsersForEditor() {
    const currentRole = (session as any)?.user?.role
    const currentId = (session as any)?.user?.id
    if (!currentRole) return users

    return users.filter((u) => {
      if (currentRole === "employee") return u.role === "admin" || u.role === "employee" || u.id === currentId
      if (currentRole === "admin") return u.role === "employee" || u.role === "client" || u.id === currentId
      if (currentRole === "client") return u.id === currentId || u.role === "admin"
      return false
    })
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-max">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columns.map((column) => column.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex min-h-[36rem] w-max items-start gap-4 pb-2">
              {columns.map((column) => (
                <KanbanColumnCard
                  key={column.id}
                  column={column}
                  onAddTask={addTask}
                  onDeleteColumn={deleteColumn}
                  onEditTask={openTaskEditor}
                  onDeleteTask={deleteTask}
                />
              ))}

              {/* Add New Column — inline at end */}
              <div className="flex w-[22rem] shrink-0 flex-col">
                {addingColumn ? (
                  <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <Input
                      value={newColumnTitle}
                      onChange={(event) => setNewColumnTitle(event.target.value)}
                      placeholder="Column title"
                      className="bg-background"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addColumn()
                        if (e.key === "Escape") { setAddingColumn(false); setNewColumnTitle("") }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button type="button" onClick={addColumn} className="flex-1">
                        Add column
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setAddingColumn(false); setNewColumnTitle("") }}
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
        </DndContext>
      </div>

      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the task details and save the changes.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Task title" />
            <Textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              placeholder="Task description"
            />
            <div className="grid grid-cols-2 gap-2">
              {users.length > 0 ? (
                <select
                  value={editAssignee}
                  onChange={(event) => setEditAssignee(event.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1"
                >
                  <option value="">Unassigned</option>
                  {getAssignableUsersForEditor().map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} {u.role ? `(${u.role})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={editAssignee}
                  onChange={(event) => setEditAssignee(event.target.value)}
                  placeholder="Assignee"
                />
              )}
              <Input
                type="date"
                value={editDueDate}
                onChange={(event) => setEditDueDate(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setEditingTask(null)}>
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