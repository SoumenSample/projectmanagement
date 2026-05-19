"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";

export default function LogoutButton({ className }) {
  return (
    <Button
      variant="outline"
      className={`gap-2 ${className ?? ""}`}
      onClick={() => signOut({ callbackUrl: "/login" })}
      title="Logout"
      aria-label="Logout"
    >
      <LogOutIcon className="size-4" />
      <span className="group-data-[collapsible=icon]:hidden">Logout</span>
    </Button>
  );
}
