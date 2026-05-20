import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth-options";
import BusinessSettings from "@/lib/models/BusinessSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  logoUrl: z.string().trim().max(2048).optional().default(""),
  gstin: z.string().trim().max(30).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  website: z.string().trim().max(2048).optional().default(""),
  address: z.string().trim().max(1000).optional().default(""),
  tagline: z.string().trim().max(160).optional().default(""),
});

const defaultSettings = {
  scope: "global",
  businessName: "Project Management",
  logoUrl: "",
  gstin: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  tagline: "",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const settings = await BusinessSettings.findOne({ scope: "global" }).lean();

    return Response.json({
      settings: settings || defaultSettings,
    });
  } catch (error) {
    console.error("Business settings fetch error:", error);
    return Response.json({ error: "Unable to load business settings" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    const parsed = settingsSchema.safeParse(payload);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid business settings" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedSettings = await BusinessSettings.findOneAndUpdate(
      { scope: "global" },
      {
        $set: {
          scope: "global",
          ...parsed.data,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return Response.json({ settings: updatedSettings || defaultSettings });
  } catch (error) {
    console.error("Business settings update error:", error);
    return Response.json({ error: error?.message || "Unable to update business settings" }, { status: 500 });
  }
}