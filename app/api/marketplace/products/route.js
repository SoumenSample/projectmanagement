import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import MarketplaceProduct from "@/lib/models/MarketplaceProduct";
import User from "@/lib/models/User";
import { convertGoogleDriveLink, isGoogleDriveLink } from "@/lib/utils/driveImageUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createProductSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "web-development",
    "app-development",
    "ui-ux-design",
    "graphic-design",
    "digital-marketing",
    "software-development",
    "ai-intelligent-systems",
    "research-and-analytics",
  ]),
  imageUrl: z.string()
    .min(1, "Image URL is required")
    .refine(
      (url) => url.startsWith("data:image/") || url.startsWith("http://") || url.startsWith("https://"),
      "Image must be a valid URL or uploaded file"
    ),
  demoLink: z.string().url("Invalid demo link"),
  price: z.number().min(0, "Price must be 0 or greater"),
});

// POST - Create a new marketplace product
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and employee can create products
    if (!["admin", "employee"].includes(session.user.role)) {
      return Response.json(
        { error: "Only admin and employees can create products" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Check image URL size before validation (safety limit for MongoDB)
    if (body.imageUrl && body.imageUrl.length > 5 * 1024 * 1024) {
      return Response.json(
        { error: "Image data is too large. Please use an image under 1MB." },
        { status: 400 }
      );
    }

    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return Response.json(
        { error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Convert Google Drive links to direct preview URLs
    const imageUrl = isGoogleDriveLink(parsed.data.imageUrl)
      ? convertGoogleDriveLink(parsed.data.imageUrl)
      : parsed.data.imageUrl;

    const product = new MarketplaceProduct({
      ...parsed.data,
      imageUrl: imageUrl,
      createdBy: session.user.id,
      createdByName: user.name,
      createdByEmail: user.email,
    });

    await product.save();

    return Response.json(
      { message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating product:", err);
    console.error("Error stack:", err.stack);
    console.error("Error message:", err.message);
    return Response.json(
      { error: err.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

// GET - List all active marketplace products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;

    await connectToDatabase();

    let query = { isActive: true };

    if (category && category !== "all") {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const products = await MarketplaceProduct.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MarketplaceProduct.countDocuments(query);

    return Response.json(
      {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching products:", err);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
