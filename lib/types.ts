import { type Message } from 'ai'

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ChatModel = 'gpt-3.5-turbo-0613' | 'gpt-3.5-turbo-16k-0613' | 'gpt-4-0613'
export type ChatTool = 'ddg' | 'search' | 'wikipedia' | 'wolfram'

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>
