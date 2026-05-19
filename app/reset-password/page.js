"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage("✅ Password updated successfully!");
      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <Card className="w-full max-w-md border border-cyan-500/20 bg-black/70">
        <CardHeader>
          <CardTitle className="text-cyan-400">Reset Password</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password */}
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            {message && (
              <p className="text-sm text-center text-cyan-400">{message}</p>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>

          {/* Back to Login */}
          <a
            href="/login"
            className="text-sm text-cyan-400 text-center block mt-3"
          >
            Back to Login
          </a>
        </CardContent>
      </Card>
    </div>
  );
}