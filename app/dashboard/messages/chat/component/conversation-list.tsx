"use client"

import { format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns"
import {
  Search,
  Pin,
  VolumeX,
  MoreHorizontal,
  Users,
  Hash
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useChat, type Conversation } from "../use-chat"

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: string | null
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void | Promise<void>
}

// Enhanced time formatting function
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, 'h:mm a') // 3:30 PM
  } else if (isYesterday(date)) {
    return 'Yesterday'
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE') // Day name
  } else if (isThisYear(date)) {
    return format(date, 'MMM d') // Jan 15
  } else {
    return format(date, 'dd/MM/yy') // 15/01/24
  }
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const { searchQuery, setSearchQuery, togglePin, toggleMute } = useChat()

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    // Pinned conversations first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    // Then by last message timestamp
    const bTime = new Date(b.lastMessage?.timestamp || 0).getTime()
    const aTime = new Date(a.lastMessage?.timestamp || 0).getTime()
    return bTime - aTime
  })

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white text-black border-r border-border/70 dark:bg-zinc-900 dark:text-white dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/70 flex-shrink-0 dark:border-white/10">
        <h2 className="text-lg font-semibold text-black dark:text-white">Messages</h2>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border/70 flex-shrink-0 dark:border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-white" />
          <Input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 cursor-text text-black placeholder:text-black/50 border-border/70 dark:text-white dark:border-white"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 border-t border-border/60 bg-white dark:bg-zinc-900 dark:text-white dark:border-white/10 overflow-y-auto">
        <div className="p-2 pr-3">
          {sortedConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border border-border/70 cursor-pointer relative group overflow-hidden hover:bg-muted/50 transition-colors",
                selectedConversation === conversation.id
                  ? "bg-muted/70 text-black border-border dark:bg-white/10 dark:border-white/20"
                  : ""
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <Avatar className={cn(
                  "h-12 w-12 ring-1 ring-border/70 dark:ring-white/10",
                  selectedConversation === conversation.id && "ring-2 ring-border dark:ring-white/30"
                )}>
                  <AvatarImage src={conversation.avatar} alt={conversation.name} />
                  <AvatarFallback className="text-sm text-black bg-muted/70">
                    {conversation.type === "group" ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      conversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Online indicator for direct messages */}
                {/* Group indicator */}
                {conversation.type === "group" && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 border-2 border-background rounded-full flex items-center justify-center">
                    <Hash className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-1 min-w-0">
                  <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-medium truncate min-w-0 max-w-[180px] text-black dark:text-white">{conversation.name}</h3>
                    {conversation.isPinned && (
                      <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {conversation.isMuted && (
                      <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2 whitespace-nowrap dark:text-white">
                    {formatMessageTime(conversation.lastMessage.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <p className="text-sm text-muted-foreground truncate flex-1 min-w-0 max-w-[200px] dark:text-white">
                    {conversation.lastMessage.content}
                  </p>

                  {/* Unread count */}
                  {conversation.unreadCount > 0 && (
                    <Badge variant="default" className="ml-2 min-w-[20px] h-5 text-xs cursor-pointer flex-shrink-0">
                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions menu */}
              <div className="opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePin(conversation.id)
                      }}
                      className="cursor-pointer"
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {conversation.isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMute(conversation.id)
                      }}
                      className="cursor-pointer"
                    >
                      <VolumeX className="h-4 w-4 mr-2" />
                      {conversation.isMuted ? "Unmute" : "Mute"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conversation.id)
                      }}
                      className="cursor-pointer text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}