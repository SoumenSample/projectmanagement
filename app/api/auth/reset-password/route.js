import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectToDatabase();
 
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });


    if (!user) {
      return Response.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    
    user.passwordHash = await bcrypt.hash(password, 12);

  
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();
  
return Response.json({ success: true });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}