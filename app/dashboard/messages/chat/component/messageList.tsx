"use client"

import { useEffect, useRef } from "react"
import { format, isToday, isYesterday } from "date-fns"
import { CheckCheck, MoreHorizontal, Reply, Copy, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../components/ui/avatar"
import { Button } from "../../../../../components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { type Message, type User } from "../use-chat"

interface MessageListProps {
  messages: Message[]
  users: User[]
  currentUserId?: string
}

export function MessageList({ messages, users, currentUserId = "current-user" }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const previousMessageCountRef = useRef(0)
  const isInitialLoadRef = useRef(true)
  const previousConversationRef = useRef<string | null>(null)

  // Reset scroll behavior when switching conversations
  useEffect(() => {
    const currentConversationId = messages.length > 0 ? messages[0]?.id?.split('-')[0] : null
    if (currentConversationId !== previousConversationRef.current) {
      isInitialLoadRef.current = true
      previousConversationRef.current = currentConversationId
    }
  }, [messages])

  // Auto-scroll to bottom only when new messages are added (not on initial load)
  useEffect(() => {
    // Skip auto-scroll on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      previousMessageCountRef.current = messages.length
      return
    }

    // Only auto-scroll if new messages were added
    if (messages.length > previousMessageCountRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }

    previousMessageCountRef.current = messages.length
  }, [messages])

  const getUserById = (userId: string) => {
    if (userId === currentUserId) {
      return {
        id: currentUserId,
        name: "You",
        avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=male-7",
        status: "online" as const,
        email: "you@example.com",
        lastSeen: new Date().toISOString(),
        role: "Developer",
        department: "Engineering"
      }
    }
    return users.find(user => user.id === userId)
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, "HH:mm")
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`
    } else {
      return format(date, "MMM d, HH:mm")
    }
  }

  const shouldShowAvatar = (message: Message, index: number) => {
    if (message.senderId === currentUserId) return false
    if (index === 0) return true

    const prevMessage = messages[index - 1]
    return prevMessage.senderId !== message.senderId
  }

  const shouldShowName = (message: Message, index: number) => {
    if (message.senderId === currentUserId) return false
    if (index === 0) return true

    const prevMessage = messages[index - 1]
    return prevMessage.senderId !== message.senderId
  }

  const isConsecutiveMessage = (message: Message, index: number) => {
    if (index === 0) return false

    const prevMessage = messages[index - 1]
    const timeDiff = new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()

    return prevMessage.senderId === message.senderId && timeDiff < 5 * 60 * 1000 // 5 minutes
  }

  const groupMessagesByDay = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []

    messages.forEach((message) => {
      const messageDate = format(new Date(message.timestamp), "yyyy-MM-dd")
      const lastGroup = groups[groups.length - 1]

      if (lastGroup && lastGroup.date === messageDate) {
        lastGroup.messages.push(message)
      } else {
        groups.push({
          date: messageDate,
          messages: [message]
        })
      }
    })

    return groups
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return "Today"
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "EEEE, MMMM d")
    }
  }

  const messageGroups = groupMessagesByDay(messages)

  return (
    <ScrollArea className="flex-1 min-w-0 px-4 text-black overflow-x-hidden overflow-y-auto dark:text-white" ref={scrollAreaRef} >
      <div className="space-y-4 py-4">
        {messageGroups.length === 0 && (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
            No messages match your search.
          </div>
        )}

        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-2">
              <div className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border border-border/70">
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Messages for this day */}
            <div className="space-y-1">
              {group.messages.map((message, messageIndex) => {
                const user = getUserById(message.senderId)
                const isOwnMessage = message.senderId === currentUserId
                const showAvatar = shouldShowAvatar(message, messageIndex)
                const showName = shouldShowName(message, messageIndex)
                const isConsecutive = isConsecutiveMessage(message, messageIndex)

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full items-start group",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Avatar for others */}
                    {!isOwnMessage && (
                      <div className="w-10 flex-shrink-0">
                        {showAvatar && user && (
                          <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-border/70 dark:ring-white/15">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    {/* Message content */}
                    <div className={cn(
                      "flex flex-col max-w-[70%]",
                      isOwnMessage ? "items-end text-right" : "items-start text-left"
                    )}>
                      {/* Sender name for group messages */}
                      {showName && user && !isOwnMessage && (
                        <div className="text-sm font-medium text-foreground mb-1">
                          {user.name}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className="relative group/message">
                        <div
                          className={cn(
                            "rounded-lg px-4 py-3 text-sm break-words shadow-sm",
                            isOwnMessage
                              ? "bg-teal-600 text-white dark:bg-teal-500"
                              : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white dark:ring-1 dark:ring-white/10",
                            isConsecutive && "mt-1"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>

                          {/* Message reactions */}
                          {message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2 justify-center">
                              {message.reactions.map((reaction, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border cursor-pointer",
                                    "bg-background/90 backdrop-blur-sm shadow-sm"
                                  )}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-muted-foreground">{reaction.count}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp and status */}
                          <div className={cn(
                            "flex items-center gap-2 mt-2 text-xs",
                            isOwnMessage
                              ? "justify-end text-white/80"
                              : "text-zinc-500 dark:text-zinc-400"
                          )}>
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {message.isEdited && (
                              <span className="italic">(edited)</span>
                            )}
                            {isOwnMessage && (
                              <div className="flex">
                                <CheckCheck className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Message actions - positioned inside bubble for own messages */}
                        <div
                          className={cn(
                            "opacity-0 group-hover/message:opacity-100",
                            isOwnMessage ? "absolute top-1 left-2" : "absolute top-1 right-1"
                          )}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 cursor-pointer"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="cursor-pointer">
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              {isOwnMessage && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="cursor-pointer text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}