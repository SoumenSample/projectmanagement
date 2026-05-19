"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      console.log("Response:", data);

      if (!res.ok) throw new Error(data.error);

      setMessage("✅ Reset link sent to your email");
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <Card className="w-full max-w-md border border-cyan-500/20 bg-black/70">
        <CardHeader>
          <CardTitle className="text-cyan-400">Forgot Password</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email to receive a reset link
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && (
              <p className="text-sm text-center text-cyan-400">{message}</p>
            )}

            {/* ✅ FIX IS HERE */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <a href="/login" className="text-sm text-cyan-400 text-center block mt-3">
            Back to Login
          </a>
        </CardContent>
      </Card>
    </div>
  );
}