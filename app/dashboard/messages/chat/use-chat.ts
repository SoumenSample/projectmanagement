"use client"

import { type ReactNode, createContext, createElement, useCallback, useContext, useMemo, useState } from "react"

export type MessageType = "text" | "image" | "file"

export interface Reaction {
  emoji: string
  count: number
}

export interface Message {
  id: string
  content: string
  timestamp: string
  senderId: string
  type: MessageType
  isEdited: boolean
  reactions: Reaction[]
  replyTo: string | null
}

export interface LastMessage {
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  name: string
  avatar: string
  type: "direct" | "group"
  participants: string[]
  isPinned: boolean
  isMuted: boolean
  unreadCount: number
  lastMessage: LastMessage
}

export interface User {
  id: string
  name: string
  avatar: string
  status: "online" | "away" | "offline"
  email: string
  lastSeen: string
  role: string
  department: string
}

interface ChatContextValue {
  selectedConversation: string | null
  setSelectedConversation: (conversationId: string | null) => void
  currentConversations: Conversation[]
  currentMessagesByConversation: Record<string, Message[]>
  currentUsers: User[]
  searchQuery: string
  setSearchQuery: (value: string) => void
  messageSearchQuery: string
  setMessageSearchQuery: (value: string) => void
  addMessage: (conversationId: string, message: Message) => void
  toggleMute: (conversationId: string) => void
  togglePin: (conversationId: string) => void
  removeConversation: (conversationId: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

interface ChatProviderProps {
  children: ReactNode
  initialConversations: Conversation[]
  initialMessages: Record<string, Message[]>
  initialUsers: User[]
}

export function ChatProvider({
  children,
  initialConversations,
  initialMessages,
  initialUsers,
}: ChatProviderProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    initialConversations[0]?.id ?? null
  )
  const [currentConversations, setCurrentConversations] = useState<Conversation[]>(initialConversations)
  const [currentMessagesByConversation, setCurrentMessagesByConversation] =
    useState<Record<string, Message[]>>(initialMessages)
  const [currentUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageSearchQuery, setMessageSearchQuery] = useState("")

  const addMessage = (conversationId: string, message: Message) => {
    setCurrentMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }))

    setCurrentConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: {
                content: message.content,
                timestamp: message.timestamp,
              },
            }
          : conversation
      )
    )
  }

  const toggleMute = (conversationId: string) => {
    setCurrentConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, isMuted: !conversation.isMuted }
          : conversation
      )
    )
  }

  const togglePin = (conversationId: string) => {
    setCurrentConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, isPinned: !conversation.isPinned }
          : conversation
      )
    )
  }

  const removeConversation = useCallback((conversationId: string) => {
    setCurrentConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId))
    setCurrentMessagesByConversation((prev) => {
      const next = { ...prev }
      delete next[conversationId]
      return next
    })

    setSelectedConversation((current) => {
      if (current !== conversationId) {
        return current
      }

      const nextConversation = currentConversations.find((conversation) => conversation.id !== conversationId)
      return nextConversation?.id ?? null
    })
  }, [currentConversations])

  const value = useMemo(
    () => ({
      selectedConversation,
      setSelectedConversation,
      currentConversations,
      currentMessagesByConversation,
      currentUsers,
      searchQuery,
      setSearchQuery,
      messageSearchQuery,
      setMessageSearchQuery,
      addMessage,
      toggleMute,
      togglePin,
      removeConversation,
    }),
    [
      selectedConversation,
      currentConversations,
      currentMessagesByConversation,
      currentUsers,
      searchQuery,
      messageSearchQuery,
      removeConversation,
    ]
  )

  return createElement(ChatContext.Provider, { value }, children)
}

export function useChat() {
  const context = useContext(ChatContext)

  if (!context) {
    throw new Error("useChat must be used within ChatProvider")
  }

  return context
}
