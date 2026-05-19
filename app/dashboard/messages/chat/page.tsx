"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

import { Chat } from "./component/chat"
import { type Conversation, type Message, type User } from "./use-chat"

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== "authenticated") {
      return
    }

    const loadData = async () => {
      try {
        const usersRes = await fetch("/api/users/list", { credentials: "include" })
        const usersJson = await usersRes.json()

        const apiUsers = Array.isArray(usersJson?.users) ? usersJson.users : []

        const mappedUsers: User[] = apiUsers.map((u: any) => ({
          id: u._id,
          name: u.name || "Unknown User",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=0D8ABC&color=fff`,
          status: "offline",
          email: u.email || "",
          lastSeen: new Date().toISOString(),
          role: u.role || "member",
          department: "General",
        }))

        const messagesByConversation: Record<string, Message[]> = {}

        await Promise.all(
          mappedUsers.map(async (u) => {
            try {
              const convoRes = await fetch(`/api/conversations?userId=${u.id}`, {
                credentials: "include",
              })
              const convoJson = await convoRes.json()
              const apiMessages = Array.isArray(convoJson?.messages) ? convoJson.messages : []

              messagesByConversation[u.id] = apiMessages.map((m: any) => ({
                id: m._id?.toString() || `${u.id}-${Math.random().toString(36).slice(2)}`,
                content: m.text || "",
                timestamp: m.createdAt || new Date().toISOString(),
                senderId: m.sender?.toString?.() || m.sender || "",
                type: "text",
                isEdited: false,
                reactions: [],
                replyTo: null,
              }))
            } catch {
              messagesByConversation[u.id] = []
            }
          })
        )

        const mappedConversations: Conversation[] = mappedUsers.map((u) => {
          const list = messagesByConversation[u.id] || []
          const last = list[list.length - 1]

          return {
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            type: "direct",
            participants: [u.id],
            isPinned: false,
            isMuted: false,
            unreadCount: Number(apiUsers.find((x: any) => x._id === u.id)?.unread || 0),
            lastMessage: {
              content: last?.content || "No messages yet",
              timestamp: last?.timestamp || new Date().toISOString(),
            },
          }
        })

        setUsers(mappedUsers)
        setMessages(messagesByConversation)
        setConversations(mappedConversations)
      } catch (error) {
        console.error("Failed to load chat data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [status])

  const sendMessage = async (receiverId: string, content: string): Promise<Message | null> => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, text: content }),
      })

      const json = await res.json()
      if (!res.ok || !json?.message) {
        return null
      }

      const m = json.message
      const senderId = m.sender?.toString?.() || m.sender || "current-user"

      return {
        id: m._id?.toString() || `msg-${Date.now()}`,
        content: m.text || content,
        timestamp: m.createdAt || new Date().toISOString(),
        senderId,
        type: "text",
        isEdited: false,
        reactions: [],
        replyTo: null,
      }
    } catch {
      return null
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6">
      <Chat
        conversations={conversations}
        messages={messages}
        users={users}
        onSendMessageApi={sendMessage}
        currentUserId={(session?.user as { id?: string } | undefined)?.id}
      />
    </div>
  )
}