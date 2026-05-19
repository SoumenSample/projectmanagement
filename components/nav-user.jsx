"use client"

import Link from "next/link"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { EllipsisVerticalIcon, CircleUserRoundIcon, CreditCardIcon, BellIcon, LogOutIcon } from "lucide-react"

export function NavUser({
  user
}) {
  const { isMobile } = useSidebar()
  const nameParts = String(user?.name || "").trim().split(/\s+/).filter(Boolean)
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    : nameParts.length === 1
      ? nameParts[0][0].toUpperCase()
      : "U"
  const avatarSrc = user?.avatar && user.avatar !== "/logo2.png" ? user.avatar : ""

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-full grayscale">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt={user?.name || "User"} /> : null}
                <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  {avatarSrc ? <AvatarImage src={avatarSrc} alt={user?.name || "User"} /> : null}
                  <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/account" className="flex w-full items-center gap-2">
                  <CircleUserRoundIcon />
                  Account
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem>
              <LogOutIcon />
              Log out
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
