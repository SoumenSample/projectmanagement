import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import MarketplaceProduct from "@/lib/models/MarketplaceProduct";
import MarketplaceInterest from "@/lib/models/MarketplaceInterest";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";
import { sendMarketplaceInterestEmail } from "@/lib/email/sendMarketplaceEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submitInterestSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

// POST - Submit interest in a product
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only clients can express interest
    if (session.user.role !== "client") {
      return Response.json(
        { error: "Only clients can express interest in products" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = submitInterestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if product exists
    const product = await MarketplaceProduct.findById(parsed.data.productId);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch client details from authenticated user/profile instead of form input
    const user = await User.findById(session.user.id).select("name email clientProfile");
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    let clientPhone = "Not provided";

    if (user.clientProfile) {
      const linkedClient = await Client.findById(user.clientProfile).select("phone");
      if (linkedClient?.phone?.trim()) {
        clientPhone = linkedClient.phone.trim();
      }
    }

    if (clientPhone === "Not provided") {
      const fallbackClient = await Client.findOne({
        $or: [{ linkedUser: session.user.id }, { email: user.email }],
      }).select("phone");

      if (fallbackClient?.phone?.trim()) {
        clientPhone = fallbackClient.phone.trim();
      }
    }

    // Check if client has already expressed interest
    const existingInterest = await MarketplaceInterest.findOne({
      productId: parsed.data.productId,
      clientId: session.user.id,
    });

    if (existingInterest) {
      return Response.json(
        { error: "You have already expressed interest in this product" },
        { status: 400 }
      );
    }

    // Get admin email
    const admin = await User.findOne({ role: "admin" }).select("email");
    if (!admin) {
      return Response.json(
        { error: "Admin not found" },
        { status: 500 }
      );
    }

    // Create interest record
    const interest = new MarketplaceInterest({
      productId: parsed.data.productId,
      productTitle: product.title,
      clientId: session.user.id,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone,
      creatorId: product.createdBy,
      creatorEmail: product.createdByEmail,
    });

    await interest.save();

    // Increment interest count on product
    await MarketplaceProduct.findByIdAndUpdate(
      parsed.data.productId,
      { $inc: { interests: 1 } },
      { new: false }
    );

    // Send emails
    await sendMarketplaceInterestEmail({
      creatorEmail: product.createdByEmail,
      adminEmail: admin.email,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone,
      productTitle: product.title,
    });

    return Response.json(
      { message: "Interest submitted successfully", interest },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error submitting interest:", err);
    return Response.json(
      { error: "Failed to submit interest" },
      { status: 500 }
    );
  }
}

// GET - Get interests (for creator or admin)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    let query = {};

    if (session.user.role === "admin") {
      // Admin sees all interests
    } else if (session.user.role === "employee") {
      // Employee sees only interests in their products
      query.creatorId = session.user.id;
    } else {
      // Clients see their own interests
      query.clientId = session.user.id;
    }

    const interests = await MarketplaceInterest.find(query)
      .populate("productId", "title imageUrl price")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(
      { interests },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching interests:", err);
    return Response.json(
      { error: "Failed to fetch interests" },
      { status: 500 }
    );
  }
}
