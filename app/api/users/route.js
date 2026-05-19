import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { z } from "zod";
import nodemailer from "nodemailer";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";
import { emitToUsers } from "@/lib/socket/server";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ===============================
// VALIDATION
// ===============================
const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "employee"]),
  phone: z.string().optional(), // ✅ add this
  age: z.coerce.number().int().min(1).max(120).optional(),
  region: z.string().max(120).optional(),
  finalBudget: z.string().optional(),
  projectName: z.string().optional(),
  projectDescription: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

// ===============================
// GET USERS
// ===============================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const users = await User.find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ users }, { status: 200 });
  } catch (err) {
    console.error("GET users error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// ===============================
// CREATE USER
// ===============================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      console.log("ZOD ERROR:", parsed.error.format());
      return Response.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const email = parsed.data.email.toLowerCase().trim();

    const existing = await User.findOne({ email });
    if (existing) {
      return Response.json({ error: "User already exists" }, { status: 409 });
    }

    // If role is client and validFrom/validTo are provided, validate them
    if (parsed.data.role === "client") {
      if (parsed.data.age === undefined || parsed.data.age === null) {
        return Response.json(
          { error: "Age is required for client users" },
          { status: 400 },
        );
      }

      if (!parsed.data.region || !parsed.data.region.trim()) {
        return Response.json(
          { error: "Region is required for client users" },
          { status: 400 },
        );
      }

      if (!parsed.data.validFrom || !parsed.data.validTo) {
        return Response.json(
          {
            error:
              "Contract dates (validFrom and validTo) are required for client users",
          },
          { status: 400 },
        );
      }

      const fromDate = new Date(parsed.data.validFrom);
      const toDate = new Date(parsed.data.validTo);

      if (fromDate >= toDate) {
        return Response.json(
          { error: "Contract ending date must be after starting date" },
          { status: 400 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const created = await User.create({
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role: parsed.data.role,
      isActive: true,
      createdBy: session.user.id,
      age: typeof parsed.data.age === "number" ? parsed.data.age : null,
      region: parsed.data.region?.trim() || "",
      source: parsed.data.source?.trim() || "manual-admin",
    });

    // If client user, also create a Client profile
    let clientProfile = null;
    if (parsed.data.role === "client") {
      clientProfile = await Client.create({
        name: parsed.data.name.trim(),
        email,
        // phone: "",
        phone: parsed.data.phone || "0000000000",
        age: typeof parsed.data.age === "number" ? parsed.data.age : null,
        region: parsed.data.region?.trim() || "",
        services: [],
        validFrom: new Date(parsed.data.validFrom),
        validTo: new Date(parsed.data.validTo),
        source: parsed.data.source?.trim() || "manual-admin",
        status: parsed.data.status || "active",
        linkedUser: created._id,
        createdBy: session.user.id,
        finalBudget: parsed.data.finalBudget || "0",
        projectName: parsed.data.projectName || "",
        projectDescription: parsed.data.projectDescription || "",
      });

      // Link client profile to user
      await User.findByIdAndUpdate(created._id, {
        clientProfile: clientProfile._id,
      });
    }

    const adminIds = (await User.find({ role: "admin" }).select("_id"))
      .map((user) => user._id?.toString?.() || user._id)
      .filter(Boolean);

    if (adminIds.length) {
      await notificationService.createAndEmitNotification({
        userIds: adminIds,
        type: "user",
        title: "New user created",
        message: `${created.role} account created for ${created.name}`,
        text: `${created.role} account created for ${created.name}`,
        source: "user",
        payload: { userId: created._id.toString() },
      });
    }

    // ===============================
    // SEND EMAILS (SAFE)
    // ===============================
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        let emailHTML = `
          <h2>Welcome, ${created.name}</h2>
          <p>Your account has been created successfully.</p>
          <p><b>Email:</b> ${created.email}</p>
          <p><b>Temporary Password:</b> ${parsed.data.password}</p>
            <p>
  Please change your password after signing in.
  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}/login" className="text-blue-500 underline">
    Click here to login
  </a>
</p>
        `;

        if (
          parsed.data.role === "client" &&
          parsed.data.validFrom &&
          parsed.data.validTo
        ) {
          emailHTML += `
            <hr />
            <h3>Contract Information</h3>
            <p><b>Contract Starting Date:</b> ${new Date(parsed.data.validFrom).toLocaleDateString()}</p>
            <p><b>Contract Ending Date:</b> ${new Date(parsed.data.validTo).toLocaleDateString()}</p>
            ${parsed.data.finalBudget ? `<p><b>Final Budget:</b> ${parsed.data.finalBudget}</p>` : ""}
            ${parsed.data.projectName ? `<p><b>Project Name:</b> ${parsed.data.projectName}</p>` : ""}
            ${parsed.data.projectDescription ? `<p><b>Project Description:</b> ${parsed.data.projectDescription}</p>` : ""}
          `;
        }

        await transporter.sendMail({
          from: `${process.env.EMAIL_USER}`,
          to: created.email,
          subject: "Your Account Has Been Created",
          html: emailHTML,
        });

        const adminEmail = process.env.CONTACT_EMAIL_TO?.trim();

        if (adminEmail) {
          await transporter.sendMail({
            from: `${process.env.EMAIL_USER}`,
            to: adminEmail,
            subject: `New user created: ${created.name}`,
            html: `
              <h2>New User Created</h2>
              <p>A new user account was created in the system.</p>
              <p><b>Name:</b> ${created.name}</p>
              <p><b>Email:</b> ${created.email}</p>
              <p><b>Role:</b> ${created.role}</p>
              ${created.source ? `<p><b>Source:</b> ${created.source}</p>` : ""}
              <p><b>Created At:</b> ${new Date().toLocaleString()}</p>
            `,
          });
        }
      } else {
        console.warn("Email skipped: Missing env vars");
      }
    } catch (err) {
      console.error("Email failed:", err);
    }

    return Response.json(
      {
        user: {
          id: created._id.toString(),
          name: created.name,
          email: created.email,
          role: created.role,
          isActive: created.isActive,
        },
        clientProfile: clientProfile ? clientProfile._id : null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST user error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// ===============================
// UPDATE USER
// ===============================
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, name, email, phone, age, region, source, status } = body;

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const nextEmail =
      typeof email === "string" ? email.toLowerCase().trim() : user.email;
    if (nextEmail !== user.email) {
      const duplicate = await User.findOne({
        email: nextEmail,
        _id: { $ne: userId },
      });
      if (duplicate) {
        return Response.json(
          { error: "Another user already uses this email" },
          { status: 409 },
        );
      }
    }

    const nextStatus = status === "inactive" ? false : true;

    const updates = {
      ...(typeof name === "string" ? { name: name.trim() } : {}),
      email: nextEmail,
      ...(typeof phone === "string" ? { phone: phone.trim() } : {}),
      ...(age === "" || age === null
        ? { age: null }
        : Number.isFinite(Number(age))
          ? { age: Number(age) }
          : {}),
      ...(typeof region === "string" ? { region: region.trim() } : {}),
      ...(typeof source === "string"
        ? { source: source.trim() || "manual-admin" }
        : {}),
      isActive: nextStatus,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-passwordHash");

    if (updatedUser?.clientProfile) {
      await Client.findByIdAndUpdate(updatedUser.clientProfile, {
        ...(typeof name === "string" ? { name: name.trim() } : {}),
        email: nextEmail,
        ...(typeof phone === "string" ? { phone: phone.trim() } : {}),
        ...(age === "" || age === null
          ? { age: null }
          : Number.isFinite(Number(age))
            ? { age: Number(age) }
            : {}),
        ...(typeof region === "string" ? { region: region.trim() } : {}),
        ...(typeof source === "string"
          ? { source: source.trim() || "manual-admin" }
          : {}),
        status: nextStatus ? "active" : "inactive",
      });
    }

    return Response.json(
      {
        user: updatedUser,
        message: "User updated successfully",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("PATCH users error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// ===============================
// DELETE USER
// ===============================
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    await connectToDatabase();

    // ❗ prevent deleting self
    if (userId === session.user.id) {
      return Response.json(
        { error: "You cannot delete yourself" },
        { status: 400 },
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a client profile, delete it too
    if (user.clientProfile) {
      await Client.findByIdAndDelete(user.clientProfile);
    }

    await User.findByIdAndDelete(userId);

    const adminIds = (await User.find({ role: "admin" }).select("_id"))
      .map((item) => item._id?.toString?.() || item._id)
      .filter(Boolean);

    if (adminIds.length) {
      await notificationService.createAndEmitNotification({
        userIds: adminIds,
        type: "user",
        title: "User deleted",
        message: `${user.name} (${user.email}) was deleted`,
        text: `${user.name} (${user.email}) was deleted`,
        source: "user",
        payload: { userId },
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE user error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
