import { requireRole } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/lib/models/Event"
import User from "@/lib/models/User"
import { Calendar } from "../../../schedule/component/calender"

export const dynamic = "force-dynamic"

function normalizeValue(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseLocalDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function buildVisibleEventDates(filteredEvents: Array<{ date: Date }>) {
  const counts = new Map<string, number>()

  filteredEvents.forEach((event) => {
    const key = formatLocalDateKey(event.date)
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return Array.from(counts.entries()).map(([date, count]) => ({
    date: parseLocalDateKey(date),
    count,
  }))
}

export default async function VendorSchedulePage() {
  const session = await requireRole("vendor")
  const userEmail = normalizeValue(session.user.email)

  await connectToDatabase()
  const userModel = User as any
  const eventModel = Event as any
  const currentUser = await userModel.findOne({ email: session.user.email }).select("role").lean()

  const rawEvents = currentUser?.role === "admin"
    ? await eventModel.find().sort({ date: 1 }).lean()
    : await eventModel.find({ assignedToEmails: userEmail }).sort({ date: 1 }).lean()

  const events = rawEvents.map((event, index) => ({
    id: index + 1,
    title: event.title,
    date: new Date(event.date),
    time: event.time,
    duration: event.duration || "1 hour",
    type: event.type,
    attendees: Array.isArray(event.attendees) ? event.attendees : [],
    location: event.location || "",
    meetingLink: event.meetingLink || "",
    color: event.color || "bg-blue-500",
    description: event.description || "",
    assignedRoles: Array.isArray(event.assignedRoles) ? event.assignedRoles : [],
    assignedToEmails: Array.isArray(event.assignedToEmails) ? event.assignedToEmails : [],
  }))

  const visibleEvents = events.filter((event) => {
    const assignedEmails = (event.assignedToEmails || []).map(normalizeValue)
    return assignedEmails.includes(userEmail)
  })

  const visibleEventDates = buildVisibleEventDates(visibleEvents)

  return (
    <div className="px-4 pb-4 md:px-6">
      <Calendar
        events={visibleEvents}
        eventDates={visibleEventDates}
        currentUserEmail={session.user.email || ""}
      />
    </div>
  )
}
