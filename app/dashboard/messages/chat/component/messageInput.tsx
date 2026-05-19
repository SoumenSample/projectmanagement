"use client"

import { useState, useRef } from "react"
import { Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "../../../../../components/ui/textarea"

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSendMessage = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage)
      setMessage("")
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }

  }

  return (
    <div className="border-t p-4 text-black dark:text-white">
      <div className="flex items-end gap-2">
        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            disabled={disabled}
            className={cn(
              "min-h-[40px] max-h-[120px] resize-none cursor-text disabled:cursor-not-allowed",
              "pr-3 dark:text-white"
            )}
            rows={1}
          />
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={disabled || !message.trim()}
          className="h-10 w-10 p-0 rounded-full flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

    </div>
  )
}