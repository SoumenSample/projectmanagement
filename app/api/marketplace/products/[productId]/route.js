import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import MarketplaceProduct from "@/lib/models/MarketplaceProduct";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get a single product by ID
export async function GET(request, { params }) {
  try {
    const { productId } = params;

    await connectToDatabase();

    const product = await MarketplaceProduct.findById(productId)
      .populate("createdBy", "name email")
      .lean();

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Increment view count
    await MarketplaceProduct.findByIdAndUpdate(
      productId,
      { $inc: { views: 1 } },
      { new: false }
    );

    return Response.json({ product }, { status: 200 });
  } catch (err) {
    console.error("Error fetching product:", err);
    return Response.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product (only creator or admin can delete)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;

    await connectToDatabase();

    const product = await MarketplaceProduct.findById(productId);

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Only creator or admin can delete
    if (
      session.user.id !== product.createdBy.toString() &&
      session.user.role !== "admin"
    ) {
      return Response.json(
        { error: "You don't have permission to delete this product" },
        { status: 403 }
      );
    }

    await MarketplaceProduct.findByIdAndDelete(productId);

    return Response.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting product:", err);
    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
