// "use client"

// import {
//   Phone,
//   Video,
//   Info,
//   Search,
//   MoreVertical,
//   Users,
//   Bell,
//   BellOff
// } from "lucide-react"

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger
// } from "@/components/ui/dropdown-menu"
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger
// } from "@/components/ui/tooltip"
// import { type Conversation, type User } from "../use-chat"

// interface ChatHeaderProps {
//   conversation: Conversation | null
//   users: User[]
//   onToggleMute?: () => void
//   onToggleInfo?: () => void
// }

// export function ChatHeader({
//   conversation,
//   users,
//   onToggleMute,
//   onToggleInfo
// }: ChatHeaderProps) {
//   if (!conversation) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <p className="text-muted-foreground">Select a conversation to start chatting</p>
//       </div>
//     )
//   }

//   const getConversationUsers = () => {
//     if (conversation.type === "direct") {
//       return users.filter(user => conversation.participants.includes(user.id))
//     }
//     return users.filter(user => conversation.participants.includes(user.id))
//   }

//   const conversationUsers = getConversationUsers()
//   const primaryUser = conversationUsers[0]

//   const getStatusText = () => {
//     if (conversation.type === "group") {
//       const onlineCount = conversationUsers.filter(user => user.status === "online").length
//       return `${conversation.participants.length} members, ${onlineCount} online`
//     } else if (primaryUser) {
//       switch (primaryUser.status) {
//         case "online":
//           return "Active now"
//         case "away":
//           return "Away"
//         case "offline":
//           return `Last seen ${new Date(primaryUser.lastSeen).toLocaleDateString()}`
//         default:
//           return ""
//       }
//     }
//     return ""
//   }

//   const getStatusColor = () => {
//     if (conversation.type === "group") return "text-muted-foreground"

//     switch (primaryUser?.status) {
//       case "online":
//         return "text-green-600"
//       case "away":
//         return "text-yellow-600"
//       case "offline":
//         return "text-muted-foreground"
//       default:
//         return "text-muted-foreground"
//     }
//   }

//   return (
//     <div className="flex items-center justify-between h-full text-black">
//       {/* Left side - Avatar and info */}
//       <div className="flex items-center gap-3">
//         <Avatar className="h-10 w-10 cursor-pointer">
//           <AvatarImage src={conversation.avatar} alt={conversation.name} />
//           <AvatarFallback>
//             {conversation.type === "group" ? (
//               <Users className="h-5 w-5" />
//             ) : (
//               conversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)
//             )}
//           </AvatarFallback>
//         </Avatar>

//         <div className="min-w-0 flex-1">
//           <div className="flex items-center gap-2">
//             <h2 className="font-semibold truncate dark:text-white">{conversation.name}</h2>
//             {conversation.isMuted && (
//               <BellOff className="h-4 w-4 text-muted-foreground" />
//             )}
//             {conversation.type === "group" && (
//               <Badge variant="secondary" className="text-xs cursor-pointer">
//                 Group
//               </Badge>
//             )}
//           </div>
//           <p className={`text-sm ${getStatusColor()}`}>
//             {getStatusText()}
//           </p>
//         </div>
//       </div>

//       {/* Right side - Action buttons */}
//       <div className="flex items-center gap-1 dark:text-white">
//         <TooltipProvider>
//           {/* Search */}
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button variant="ghost" size="icon" className="cursor-pointer">
//                 <Search className="h-4 w-4" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Search in conversation</p>
//             </TooltipContent>
//           </Tooltip>

//           {/* Phone call */}
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button variant="ghost" size="icon" className="cursor-pointer">
//                 <Phone className="h-4 w-4" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Voice call</p>
//             </TooltipContent>
//           </Tooltip>

//           {/* Video call */}
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button variant="ghost" size="icon" className="cursor-pointer">
//                 <Video className="h-4 w-4" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Video call</p>
//             </TooltipContent>
//           </Tooltip>

//           {/* Info */}
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={onToggleInfo}
//                 className="cursor-pointer"
//               >
//                 <Info className="h-4 w-4" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Conversation info</p>
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>

//         {/* More options */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" size="icon" className="cursor-pointer">
//               <MoreVertical className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem
//               onClick={onToggleMute}
//               className="cursor-pointer"
//             >
//               {conversation.isMuted ? (
//                 <>
//                   <Bell className="h-4 w-4 mr-2" />
//                   Unmute conversation
//                 </>
//               ) : (
//                 <>
//                   <BellOff className="h-4 w-4 mr-2" />
//                   Mute conversation
//                 </>
//               )}
//             </DropdownMenuItem>
//             <DropdownMenuItem className="cursor-pointer">
//               <Search className="h-4 w-4 mr-2" />
//               Search messages
//             </DropdownMenuItem>
//             {conversation.type === "group" && (
//               <>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem className="cursor-pointer">
//                   <Users className="h-4 w-4 mr-2" />
//                   Manage members
//                 </DropdownMenuItem>
//               </>
//             )}
//             <DropdownMenuSeparator />
//             <DropdownMenuItem className="cursor-pointer text-destructive">
//               Delete conversation
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>
//     </div>
//   )
// }




"use client"

import {
  Phone,
  Video,
  Info,
  Search,
  MoreVertical,
  Users,
  Bell,
  BellOff,
  Mail,
  Clock,
  X
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { useState } from "react"
import { type Conversation, type User } from "../use-chat"

interface ChatHeaderProps {
  conversation: Conversation | null
  users: User[]
  onToggleMute?: () => void
  onToggleInfo?: () => void
  onToggleMessageSearch?: () => void
  onDeleteConversation?: () => void
}

export function ChatHeader({
  conversation,
  users,
  onToggleMute,
  onToggleInfo,
  onToggleMessageSearch,
  onDeleteConversation,
}: ChatHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    )
  }

  const getConversationUsers = () => {
    return users.filter(user => conversation.participants.includes(user.id))
  }

  const conversationUsers = getConversationUsers()
  const primaryUser = conversationUsers[0]

  const getStatusText = () => {
    if (conversation.type === "group") {
      return `${conversation.participants.length} members`
    }
    return ""
  }

  const getStatusColor = () => {
    if (conversation.type === "group") return "text-muted-foreground"
    switch (primaryUser?.status) {
      case "online":  return "text-green-600"
      case "away":    return "text-yellow-600"
      case "offline": return "text-muted-foreground"
      default:        return "text-muted-foreground"
    }
  }

  const initials = conversation.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center justify-between h-full text-black">

      {/* ── Left: Avatar + info ── */}
      <div className="flex items-center gap-3">

        {/* Clickable Avatar → Profile Popover */}
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
          <PopoverTrigger asChild>
            <button className="relative focus:outline-none group" aria-label="View profile">
              <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-transparent group-hover:ring-gray-300 dark:group-hover:ring-white/20 transition-all">
                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                <AvatarFallback>
                  {conversation.type === "group" ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    initials
                  )}
                </AvatarFallback>
              </Avatar>
              {/* Status dot */}
            </button>
          </PopoverTrigger>

          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={10}
            className="w-72 p-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-zinc-900"
          >
            {/* Banner */}
            <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 relative">
              <button
                onClick={() => setProfileOpen(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Avatar overlapping banner */}
            <div className="px-5 pb-4">
              <div className="-mt-7 mb-3 relative w-fit">
                <Avatar className="h-14 w-14 ring-4 ring-white dark:ring-zinc-900">
                  <AvatarImage src={conversation.avatar} alt={conversation.name} />
                  <AvatarFallback className="text-lg font-bold bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200">
                    {conversation.type === "group" ? (
                      <Users className="h-6 w-6" />
                    ) : (
                      initials
                    )}
                  </AvatarFallback>
                </Avatar>
                {/* Status dot on popover avatar */}
              </div>

              {/* Name + badge */}
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                  {conversation.name}
                </h3>
                {conversation.type === "group" && (
                  <Badge variant="secondary" className="text-xs">Group</Badge>
                )}
                {conversation.isMuted && (
                  <BellOff className="h-3.5 w-3.5 text-gray-400" />
                )}
              </div>

              {/* Status line */}
              <p className={`text-xs font-medium mb-4 ${getStatusColor()}`}>
                {getStatusText()}
              </p>

              {/* Detail rows */}
              <div className="space-y-2.5">
                {/* Email (for direct chats) */}
                {conversation.type !== "group" && primaryUser?.email && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{primaryUser.email}</span>
                  </div>
                )}

                {/* Last seen / joined */}

                {/* Group members count */}
                {conversation.type === "group" && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{conversation.participants.length} members</span>
                  </div>
                )}
              </div>

              {/* Group member avatars */}
              {conversation.type === "group" && conversationUsers.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Members</p>
                  <div className="flex -space-x-2">
                    {conversationUsers.slice(0, 6).map((u) => (
                      <Avatar key={u.id} className="h-7 w-7 ring-2 ring-white dark:ring-zinc-900">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback className="text-xs bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
                          {u.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {conversationUsers.length > 6 && (
                      <div className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          +{conversationUsers.length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Name + status text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate dark:text-white">{conversation.name}</h2>
            {conversation.isMuted && (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            {conversation.type === "group" && (
              <Badge variant="secondary" className="text-xs cursor-pointer">Group</Badge>
            )}
          </div>
          {getStatusText() ? (
            <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
          ) : null}
        </div>
      </div>

      {/* ── Right: Action buttons ── */}
      <div className="flex items-center gap-1 dark:text-white">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={onToggleMessageSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Search in conversation</p></TooltipContent>
          </Tooltip>

          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Voice call</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Video call</p></TooltipContent>
          </Tooltip> */}

          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleInfo} className="cursor-pointer">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Conversation info</p></TooltipContent>
          </Tooltip> */}
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuItem onClick={onToggleMute} className="cursor-pointer">
              {conversation.isMuted ? (
                <><Bell className="h-4 w-4 mr-2" />Unmute conversation</>
              ) : (
                <><BellOff className="h-4 w-4 mr-2" />Mute conversation</>
              )}
            </DropdownMenuItem> */}
            {/* <DropdownMenuItem onClick={onToggleMessageSearch} className="cursor-pointer">
              <Search className="h-4 w-4 mr-2" />Search messages
            </DropdownMenuItem> */}
            {conversation.type === "group" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />Manage members
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDeleteConversation} className="cursor-pointer text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}