import { type Message } from 'ai'

import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'
import { UseChatHelpers } from 'ai/react/dist'

export interface ChatList
  extends Pick<
    UseChatHelpers,
    'isLoading' | 'messages' | 'setMessages' | 'input' | 'setInput' | 'reload'
  > {
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export function ChatList({ messages, setMessages, isLoading, input, setInput, inputRef, reload }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <div key={index}>
          <ChatMessage
            message={message}
            isLoading={isLoading}
            messages={messages}
            setMessages={setMessages}
            input={input}
            setInput={setInput}
            inputRef={inputRef}
            reload={reload}
          />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
        </div>
      ))}
    </div>
  )
}
