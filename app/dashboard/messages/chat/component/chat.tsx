"use client"

import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { Menu, Search, X } from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConversationList } from "./conversation-list"
import { ChatHeader } from "./chatHeader"
import { MessageList } from "./messageList"
import { MessageInput } from "./messageInput"
import {
  ChatProvider,
  useChat,
  type Conversation,
  type Message,
  type User,
} from "../use-chat"

interface ChatProps {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  users: User[]
  onSendMessageApi?: (receiverId: string, content: string) => Promise<Message | null>
  currentUserId?: string
}

export function Chat({
  conversations,
  messages,
  users,
  onSendMessageApi,
  currentUserId,
}: ChatProps) {
  return (
    <ChatProvider
      initialConversations={conversations}
      initialMessages={messages}
      initialUsers={users}
    >
      <ChatInner
        conversations={conversations}
        messages={messages}
        users={users}
        onSendMessageApi={onSendMessageApi}
        currentUserId={currentUserId}
      />
    </ChatProvider>
  )
}

function ChatInner({
  conversations,
  messages,
  users,
  onSendMessageApi,
  currentUserId,
}: ChatProps) {
  const {
    selectedConversation,
    setSelectedConversation,
    currentConversations,
    currentMessagesByConversation,
    currentUsers,
    addMessage,
    toggleMute,
    removeConversation,
    messageSearchQuery,
    setMessageSearchQuery,
  } = useChat()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false)

  useEffect(() => {
    setIsMessageSearchOpen(false)
    setMessageSearchQuery("")
  }, [selectedConversation, setMessageSearchQuery])

  useEffect(() => {
    if (!currentUserId) return undefined

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "")
    const resolvedSocketUrl = (typeof window !== "undefined" && window.location.hostname === "localhost")
      ? (process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000")
      : socketUrl

    // Create socket with authentication and auto-reconnect
    const socket = io(resolvedSocketUrl, {
      transports: ["websocket", "polling"],
      auth: {
        userId: currentUserId,
        // token can be added here if using JWT
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.emit("join", { userId: currentUserId }, (response: any) => {
      if (response?.ok) {
        console.log(`[socket] Joined successfully. Online count: ${response.onlineCount}`)
      } else {
        console.error(`[socket] Join failed:`, response?.error)
      }
    })

    socket.on("connect", () => {
      console.debug("[socket] connected", socket.id, "userId=", currentUserId)
      // Rejoin on reconnect
      socket.emit("join", { userId: currentUserId })
    })

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error", err)
    })

    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected", reason)
    })

    socket.on("receive-message", (payload) => {
      const senderId = payload?.sender?.toString?.() || payload?.senderId || payload?.sender || ""
      const receiverId = payload?.receiver?.toString?.() || payload?.receiverId || payload?.receiver || ""
      const conversationId = senderId === currentUserId ? receiverId : senderId

      if (!conversationId) return

      const content = payload?.text || payload?.content || ""
      if (!content) return

      const message: Message = {
        id: payload?._id?.toString?.() || payload?.id || `msg-${Date.now()}`,
        content,
        timestamp: payload?.createdAt || payload?.timestamp || new Date().toISOString(),
        senderId: senderId || receiverId || "unknown",
        type: "text",
        isEdited: false,
        reactions: [],
        replyTo: null,
      }

      addMessage(conversationId, message)
    })

    return () => {
      socket.off("receive-message")
      socket.off("connect")
      socket.off("connect_error")
      socket.off("disconnect")
      socket.disconnect()
    }
  }, [addMessage, currentUserId])

  // Close sidebar when resizing back to desktop.
  useEffect(() => {
    const handleResize = () => {
      if ((typeof window !== "undefined" ? window.innerWidth : 0) >= 1024) {
        setIsSidebarOpen(false)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  const activeConversation = currentConversations.find((conversation) => conversation.id === selectedConversation) || null
  const currentMessages = selectedConversation ? currentMessagesByConversation[selectedConversation] || [] : []
  const filteredMessages = messageSearchQuery.trim()
    ? currentMessages.filter((message) =>
        message.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
      )
    : currentMessages

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return

    const fallbackMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      senderId: "current-user",
      type: "text",
      isEdited: false,
      reactions: [],
      replyTo: null,
    }

    const persisted = onSendMessageApi
      ? await onSendMessageApi(selectedConversation, content)
      : null

    addMessage(selectedConversation, persisted || fallbackMessage)
  }

  const handleToggleMute = () => {
    if (selectedConversation) {
      toggleMute(selectedConversation)
    }
  }

  const handleToggleMessageSearch = () => {
    setIsMessageSearchOpen((current) => !current)
  }

  const handleDeleteConversationById = async (conversationId: string) => {
    const confirmed = window.confirm("Delete this conversation? This will remove all messages in the thread.")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/conversations?userId=${conversationId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }

      removeConversation(conversationId)
      setIsMessageSearchOpen(false)
      setMessageSearchQuery("")
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteConversation = () => {
    if (selectedConversation) {
      void handleDeleteConversationById(selectedConversation)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full min-h-150 max-h-[calc(100vh-200px)] flex min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-background dark:border-border">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Conversations Sidebar - Responsive */}
        <div className={`
          w-90 max-w-full border-r border-zinc-200 bg-background shrink-0 dark:border-border
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:relative lg:block
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
        `}>
          {/* Sidebar Header with Close Button (Mobile Only) */}
          <div className="lg:hidden p-4 border-b flex items-center justify-between bg-background">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ConversationList
            conversations={currentConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={(id) => {
              setSelectedConversation(id)
              setIsSidebarOpen(false) // Close sidebar on mobile after selection
            }}
            onDeleteConversation={async (id) => {
              await handleDeleteConversationById(id)
            }}
          />
        </div>

        {/* Chat Panel - Flexible Width */}
        <div className="flex-1 flex min-w-0 flex-col bg-background">
          {/* Chat Header with Hamburger Menu */}
          <div className="flex items-center h-16 min-w-0 px-4 border-b border-zinc-200 bg-background dark:border-border">
            {/* Hamburger Menu Button - Only visible when sidebar is hidden on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="cursor-pointer lg:hidden mr-2"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <ChatHeader
                conversation={activeConversation}
                users={currentUsers}
                onToggleMute={handleToggleMute}
                onToggleMessageSearch={handleToggleMessageSearch}
                onDeleteConversation={handleDeleteConversation}
              />
            </div>
          </div>

          {isMessageSearchOpen && selectedConversation && (
            <div className="border-b border-zinc-200 bg-background px-4 py-3 dark:border-border">
              <div className="relative max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={messageSearchQuery}
                  onChange={(event) => setMessageSearchQuery(event.target.value)}
                  placeholder="Search messages in this conversation"
                  className="pl-9 pr-10 text-foreground placeholder:text-muted-foreground bg-background"
                />
                {messageSearchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessageSearchQuery("")}
                    className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 flex min-h-0 min-w-0 flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                <MessageList
                  messages={filteredMessages}
                  users={currentUsers}
                  currentUserId={currentUserId}
                />

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  placeholder={`Message ${activeConversation?.name || ""}...`}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Welcome to Chat</h3>
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}