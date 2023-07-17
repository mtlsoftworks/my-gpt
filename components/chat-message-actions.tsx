'use client'

import { type Message } from 'ai'

import { Button } from '@/components/ui/button'
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconRefresh
} from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { UseChatHelpers } from 'ai/react/dist'
import { useState } from 'react'

interface ChatMessageActionsProps
  extends Pick<
    UseChatHelpers,
    'isLoading' | 'messages' | 'setMessages' | 'input' | 'setInput' | 'reload'
  > {
  message: Message
  inputRef: React.RefObject<HTMLTextAreaElement>
  className?: string
}

export function ChatMessageActions({
  message,
  isLoading,
  messages,
  setMessages,
  input,
  setInput,
  inputRef,
  reload,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const [messageCache, setMessageCache] = useState<Message[]>([])

  const editMessage = () => {
    setInput(message.content)
    setMessageCache(messages.slice(messages.indexOf(message)))
    setMessages(messages.slice(0, messages.indexOf(message)))
    inputRef.current?.focus()
    inputRef.current?.addEventListener('blur', cancelEdit, { once: true })
  }

  const cancelEdit = () => {
    setInput('')
    setMessages([...messages, ...messageCache])
    setMessageCache([])
  }

  const regenerateMessage = () => {
    setMessages(messages.slice(0, messages.indexOf(message)))
    reload()
  }

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end m-y-0 transition-opacity group-hover:opacity-100',
        className
      )}
      {...props}
    >
      <div className="flex sm:flex-col flex-1 space-x-1 sm:space-x-0 sm:space-y-1 items-center justify-end">
        {message.role === 'user' && (
          <Button variant="ghost" size="icon" onClick={editMessage}>
            <IconEdit />
            <span className="sr-only">Edit message</span>
          </Button>
        )}
        {message.role === 'assistant' && (
          <Button variant="ghost" size="icon" onClick={regenerateMessage}>
            <IconRefresh />
            <span className="sr-only">Regenerate message</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onCopy}>
          {isCopied ? <IconCheck /> : <IconCopy />}
          <span className="sr-only">Copy message</span>
        </Button>
      </div>
    </div>
  )
}
