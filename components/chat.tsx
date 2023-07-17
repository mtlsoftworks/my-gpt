'use client'

import { useChat, type Message } from 'ai/react'

import { ChatModelNames, ChatToolNames, cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useRef, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import { ChatModel, ChatTool } from '@/lib/types'
import { Icon } from '@radix-ui/react-select'
import { IconCheck, IconOpenAI, IconPlus, IconRefresh } from './ui/icons'
import { Separator } from './ui/separator'

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )
  const [previewTokenDialog, setPreviewTokenDialog] = useState(IS_PREVIEW)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')
  const [model, setModel] = useState<ChatModel>('gpt-3.5-turbo-0613')
  const [tools, setTools] = useState<ChatTool[]>([])
  const {
    messages,
    setMessages,
    append,
    reload,
    stop,
    isLoading,
    input,
    setInput
  } = useChat({
    initialMessages,
    id,
    body: {
      id,
      previewToken,
      model,
      tools: JSON.stringify(tools)
    },
    onResponse(response) {
      if (response.status === 401) {
        toast.error(response.statusText)
      }
    }
  })
  const inputRef = useRef<HTMLTextAreaElement>(null)
  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        <h1 className="text-2xl font-bold text-center w-max mx-auto mb-4">
          <IconOpenAI className="inline-block mr-2" />
          Chat Settings
        </h1>
        <h2 className="text-base font-semibold mb-2 text-center">Model</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center justify-center mb-6 px-4">
          {Object.keys(ChatModelNames).map(key => (
            <Button
              key={key}
              onClick={() => setModel(key as ChatModel)}
              className={`bg-background w-full sm:w-max text-current hover:bg-accent hover:text-accent-foreground transition-colors ring-1 ${
                model === key ? 'ring-white' : 'ring-accent'
              }`}
            >
              {model === key && <IconCheck className="mr-2" />}
              {ChatModelNames[key as ChatModel]}
            </Button>
          ))}
        </div>
        <h2 className="text-base font-semibold mb-2 text-center">Tools</h2>
        <p className="text-sm text-center mb-4">
          Tools work best with <b>GPT-4</b>
        </p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center justify-center mb-6 px-4">
          {Object.keys(ChatToolNames).map(key => (
            <Button
              key={key}
              onClick={() =>
                setTools(prev =>
                  prev.includes(key as ChatTool)
                    ? prev.filter(tool => tool !== key)
                    : [...prev, key as ChatTool]
                )
              }
              className={`bg-background w-full sm:w-max text-current hover:bg-accent hover:text-accent-foreground transition-colors ring-1 ${
                tools.includes(key as ChatTool) ? 'ring-white' : 'ring-accent'
              }`}
            >
              {tools.includes(key as ChatTool) ? (
                <IconCheck className="mr-2" />
              ) : (
                <IconPlus className="mr-2" />
              )}
              {ChatToolNames[key as ChatTool]}
            </Button>
          ))}
        </div>
        <Separator className="my-4 md:my-8" />
        {messages.length ? (
          <>
            <ChatList
              messages={messages}
              setMessages={setMessages}
              isLoading={isLoading}
              input={input}
              setInput={setInput}
              inputRef={inputRef}
              reload={reload}
            />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        inputRef={inputRef}
      />

      <Dialog open={previewTokenDialog} onOpenChange={setPreviewTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your OpenAI Key</DialogTitle>
            <DialogDescription>
              If you have not obtained your OpenAI API key, you can do so by{' '}
              <a
                href="https://platform.openai.com/signup/"
                className="underline"
              >
                signing up
              </a>{' '}
              on the OpenAI website. This is only necessary for preview
              environments so that the open source community can test the app.
              The token will be saved to your browser&apos;s local storage under
              the name <code className="font-mono">ai-token</code>.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={previewTokenInput}
            placeholder="OpenAI API key"
            onChange={e => setPreviewTokenInput(e.target.value)}
          />
          <DialogFooter className="items-center">
            <Button
              onClick={() => {
                setPreviewToken(previewTokenInput)
                setPreviewTokenDialog(false)
              }}
            >
              Save Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
