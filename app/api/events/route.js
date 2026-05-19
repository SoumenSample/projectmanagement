// import { getServerSession } from "next-auth";
// import { NextResponse } from "next/server";
// import { authOptions } from "@/lib/auth-options";
// import { connectToDatabase } from "@/lib/mongodb";
// import Event from "@/lib/models/Event";
// import User from "@/lib/models/User";
// import { emitToUsers } from "@/lib/socket/server";

// function normalizeEmail(value) {
//   return String(value || "").trim().toLowerCase();
// }

// function uniqueEmails(values) {
//   return Array.from(new Set((values || []).map(normalizeEmail).filter(Boolean)));
// }

// function formatEventDateTime(eventDate, eventTime) {
//   const date = new Date(eventDate);
//   const safeTime = String(eventTime || "").trim();

//   if (safeTime) {
//     const match = safeTime.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
//     if (match) {
//       let hours = Number(match[1]) % 12;
//       if (match[3].toUpperCase() === "PM") hours += 12;
//       if (match[3].toUpperCase() === "AM" && Number(match[1]) === 12) hours = 0;
//       date.setHours(hours, Number(match[2]), 0, 0);
//     }
//   }

//   return date;
// }

// async function resolveUserIdsByEmails(emails) {
//   const normalized = uniqueEmails(emails);
//   if (normalized.length === 0) return [];

//   const users = await User.find({ email: { $in: normalized } }, { _id: 1, email: 1 }).lean();
//   return users.map((user) => user._id.toString());
// }

// async function emitScheduleNotification({ emails, excludeUserIds = [], type, title, message }) {
//   const targetUserIds = (await resolveUserIdsByEmails(emails)).filter(
//     (userId) => !excludeUserIds.includes(userId)
//   );

//   if (targetUserIds.length === 0) return;

//   emitToUsers(targetUserIds, "notification", {
//     type,
//     title,
//     text: message,
//     message,
//     category: "schedule",
//   });
// }

// // =========================
// // CREATE EVENT (POST)
// // =========================
// export async function POST(req) {
//   try {
//     await connectToDatabase();

//     const session = await getServerSession(authOptions);
//     const body = await req.json();

//     // Ensure assignedToEmails is always an array
//     const assignedEmails = Array.isArray(body.assignedToEmails)
//       ? body.assignedToEmails
//       : [body.assignedToEmails].filter(Boolean);

//     const normalizedEmails = uniqueEmails(assignedEmails);
//     const actorUserId = session?.user?.id || body.actorUserId || null;

//     const eventPayload = {
//       title: body.title,
//       date: new Date(body.date),
//       time: body.time,
//       duration: body.duration,
//       type: body.type,
//       location: body.location,
//       description: body.description,
//       attendees: body.attendees || [],
//       assignedRoles: body.assignedRoles || [],
//       assignedToEmails: normalizedEmails,
//       allDay: body.allDay,
//       reminder: body.reminder,
//       color: body.color,
//     };

//     const newEvent = await Event.create(eventPayload);

//     await emitScheduleNotification({
//       emails: normalizedEmails,
//       excludeUserIds: actorUserId ? [actorUserId.toString()] : [],
//       type: "success",
//       title: "Event assigned",
//       message: `${newEvent.title} is scheduled for ${formatEventDateTime(newEvent.date, newEvent.time).toLocaleString("en-US", {
//         dateStyle: "medium",
//         timeStyle: "short",
//       })}`,
//     });

//     return NextResponse.json(
//       { message: "Event created", event: newEvent },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("🔥 FULL ERROR:", error);
//     console.error("Error stack:", error.stack);
//     return NextResponse.json(
//       { error: error.message, full: error.toString() },
//       { status: 500 }
//     );
//   }
// }

// // =========================
// // GET EVENTS
// // =========================
// export async function GET() {
//   try {
//     await connectToDatabase();

//     const events = await Event.find().sort({ date: 1 });
//     return NextResponse.json({ events });
//   } catch (error) {
//     console.error("GET EVENT ERROR:", error);
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }

// // =========================
// // DELETE EVENT
// // =========================
// export async function DELETE(req) {
//   try {
//     await connectToDatabase();

//     const session = await getServerSession(authOptions);
//     const { id, actorUserId } = await req.json();

//     const existing = await Event.findById(id).lean();
//     if (!existing) {
//       return NextResponse.json({ error: "Event not found" }, { status: 404 });
//     }

//     await Event.findByIdAndDelete(id);

//     await emitScheduleNotification({
//       emails: existing.assignedToEmails || [],
//       excludeUserIds: session?.user?.id || actorUserId ? [String(session?.user?.id || actorUserId)] : [],
//       type: "warning",
//       title: "Event cancelled",
//       message: `${existing.title} was removed from the schedule.`,
//     });

//     return NextResponse.json({ message: "Deleted" });
//   } catch (error) {
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }

// // =========================
// // UPDATE EVENT
// // =========================
// export async function PUT(req) {
//   try {
//     await connectToDatabase();

//     const session = await getServerSession(authOptions);
//     const body = await req.json();
//     const actorUserId = session?.user?.id || body.actorUserId || null;

//     const existing = await Event.findById(body.id).lean();

//     const updated = await Event.findByIdAndUpdate(
//       body.id,
//       {
//         ...body,
//         date: new Date(body.date),
//         assignedRoles: body.assignedRoles || [],
//         assignedToEmails: uniqueEmails(body.assignedToEmails || []),
//       },
//       { returnDocument: 'after' }
//     );

//     if (!updated) {
//       return NextResponse.json({ error: "Event not found" }, { status: 404 });
//     }

//     await emitScheduleNotification({
//       emails: updated?.assignedToEmails || existing?.assignedToEmails || [],
//       excludeUserIds: actorUserId ? [String(actorUserId)] : [],
//       type: "info",
//       title: "Event updated",
//       message: `${updated.title} was updated in the schedule.`,
//     });

//     return NextResponse.json({ event: updated });
//   } catch (error) {
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import User from "@/lib/models/User";
import { sendTicketEmail } from "@/lib/email/sendTicketEmail";
import notificationService from "@/lib/notifications/notification-service";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueEmails(values) {
  return Array.from(new Set((values || []).map(normalizeEmail).filter(Boolean)));
}

function formatEventDateTime(eventDate, eventTime) {
  const date = new Date(eventDate);
  const safeTime = String(eventTime || "").trim();

  if (safeTime) {
    const match = safeTime.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (match) {
      let hours = Number(match[1]) % 12;
      if (match[3].toUpperCase() === "PM") hours += 12;
      if (match[3].toUpperCase() === "AM" && Number(match[1]) === 12) hours = 0;
      date.setHours(hours, Number(match[2]), 0, 0);
    }
  }

  return date;
}

async function resolveUserIdsByEmails(emails) {
  const normalized = uniqueEmails(emails);
  if (normalized.length === 0) return [];

  const users = await User.find({ email: { $in: normalized } }, { _id: 1, email: 1 }).lean();
  return users.map((user) => user._id.toString());
}

async function emitScheduleNotification({ emails, excludeUserIds = [], type, title, message }) {
  const targetUserIds = (await resolveUserIdsByEmails(emails)).filter(
    (userId) => !excludeUserIds.includes(userId)
  );

  if (targetUserIds.length === 0) return;

  await notificationService.createAndEmitNotification({
    userIds: targetUserIds,
    type,
    title,
    message,
    text: message,
    source: "schedule",
    payload: { category: "schedule" },
  });
}

async function sendEventEmail({ to, subject, html }) {
  if (!Array.isArray(to) && typeof to === "string") {
    to = to.split(",").map((item) => item.trim()).filter(Boolean);
  }

  const recipients = Array.isArray(to) ? Array.from(new Set(to.filter(Boolean))) : [];
  if (recipients.length === 0) {
    console.warn("sendEventEmail called with no recipients")
    return false;
  }

  console.info("sendEventEmail recipients:", recipients)

  await sendTicketEmail({
    to: recipients.join(", "),
    subject,
    html,
  });

  return true;
}

// =========================
// CREATE EVENT (POST)
// =========================
export async function POST(req) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const body = await req.json();

    // Ensure assignedToEmails is always an array
    const assignedEmails = Array.isArray(body.assignedToEmails)
      ? body.assignedToEmails
      : [body.assignedToEmails].filter(Boolean);

    const normalizedEmails = uniqueEmails(assignedEmails);
    const actorUserId = session?.user?.id || body.actorUserId || null;

    const eventPayload = {
      title: body.title,
      date: new Date(body.date),
      time: body.time,
      duration: body.duration,
      type: body.type,
      location: body.location,
      meetingLink: body.meetingLink || "",
      description: body.description,
      attendees: body.attendees || [],
      assignedRoles: body.assignedRoles || [],
      assignedToEmails: normalizedEmails,
      allDay: body.allDay,
      reminder: body.reminder,
      color: body.color,
    };

    const newEvent = await Event.create(eventPayload);

    await emitScheduleNotification({
      emails: normalizedEmails,
      excludeUserIds: actorUserId ? [actorUserId.toString()] : [],
      type: "success",
      title: "Event assigned",
      message: `${newEvent.title} is scheduled for ${formatEventDateTime(newEvent.date, newEvent.time).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`,
    });

    try {
      await sendEventEmail({
        to: normalizedEmails,
        subject: `Event assigned: ${newEvent.title}`,
        html: `
          <div style="font-family:Arial;padding:10px">
            <h2>New Event Assigned</h2>
            <p><strong>${newEvent.title}</strong> has been scheduled for ${formatEventDateTime(newEvent.date, newEvent.time).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}.</p>
            <p><strong>Location:</strong> ${newEvent.location || "TBD"}</p>
            ${newEvent.meetingLink ? `<p><strong>Meeting link:</strong> <a href="${newEvent.meetingLink}">${newEvent.meetingLink}</a></p>` : ""}
            <p><strong>Description:</strong> ${newEvent.description || "No description provided."}</p>
            <p><strong>Assigned Emails:</strong> ${normalizedEmails.join(", ")}</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Event email send error:", emailErr);
    }

    return NextResponse.json(
      { message: "Event created", event: newEvent },
      { status: 201 }
    );
  } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message, full: error.toString() },
      { status: 500 }
    );
  }
}

// =========================
// GET EVENTS
// =========================
export async function GET() {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const currentEmail = normalizeEmail(session?.user?.email);
    const isAdmin = session?.user?.role === "admin";

    const query = isAdmin || !currentEmail
      ? {}
      : { assignedToEmails: currentEmail };

    const events = await Event.find(query).sort({ date: 1 });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET EVENT ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// =========================
// DELETE EVENT
// =========================
export async function DELETE(req) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const { id, actorUserId } = await req.json();

    const existing = await Event.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const recipients = uniqueEmails(existing.assignedToEmails || []);

    await Event.findByIdAndDelete(id);

    await emitScheduleNotification({
      emails: recipients,
      excludeUserIds: session?.user?.id || actorUserId ? [String(session?.user?.id || actorUserId)] : [],
      type: "warning",
      title: "Event cancelled",
      message: `${existing.title} was removed from the schedule.`,
    });

    try {
      await sendEventEmail({
        to: recipients,
        subject: `Event cancelled: ${existing.title}`,
        html: `
          <div style="font-family:Arial;padding:10px">
            <h2>Event Cancelled</h2>
            <p><strong>${existing.title}</strong> was removed from the schedule.</p>
            <p><strong>Date/time:</strong> ${formatEventDateTime(existing.date, existing.time).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}</p>
            <p><strong>Location:</strong> ${existing.location || "TBD"}</p>
            ${existing.meetingLink ? `<p><strong>Meeting link:</strong> <a href="${existing.meetingLink}">${existing.meetingLink}</a></p>` : ""}
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Event cancellation email send error:", emailErr);
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// =========================
// UPDATE EVENT
// =========================
export async function PUT(req) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const actorUserId = session?.user?.id || body.actorUserId || null;

    const existing = await Event.findById(body.id).lean();

    const assignedToEmails = body.assignedToEmails
      ? uniqueEmails(body.assignedToEmails)
      : existing?.assignedToEmails || [];

    const updated = await Event.findByIdAndUpdate(
      body.id,
      {
        ...body,
        date: new Date(body.date),
        assignedRoles: body.assignedRoles || [],
        assignedToEmails,
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await emitScheduleNotification({
      emails: updated?.assignedToEmails || existing?.assignedToEmails || [],
      excludeUserIds: actorUserId ? [String(actorUserId)] : [],
      type: "info",
      title: "Event updated",
      message: `${updated.title} was updated in the schedule.`,
    });

    try {
      await sendEventEmail({
        to: updated.assignedToEmails || [],
        subject: `Event updated: ${updated.title}`,
        html: `
          <div style="font-family:Arial;padding:10px">
            <h2>Event Updated</h2>
            <p><strong>${updated.title}</strong> has been updated.</p>
            <p><strong>New date/time:</strong> ${formatEventDateTime(updated.date, updated.time).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}</p>
            <p><strong>Location:</strong> ${updated.location || "TBD"}</p>
            ${updated.meetingLink ? `<p><strong>Meeting link:</strong> <a href="${updated.meetingLink}">${updated.meetingLink}</a></p>` : ""}
            <p><strong>Description:</strong> ${updated.description || "No description provided."}</p>
            <p><strong>Assigned Emails:</strong> ${(updated.assignedToEmails || []).join(", ")}</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Event update email send error:", emailErr);
    }

    return NextResponse.json({ event: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}