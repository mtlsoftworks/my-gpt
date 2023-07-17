import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'
import { ChatModel } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export const ChatModelNames: { [key: ChatModel | string]: string } = {
  'gpt-3.5-turbo-0613': 'GPT-3.5',
  'gpt-3.5-turbo-16k-0613': 'GPT-3.5 (16k)',
  'gpt-4-0613': 'GPT-4'
}

export function getChatModelName(model: ChatModel): string {
  return ChatModelNames[model]
}

export function getChatModelFromName(name: string): ChatModel {
  const keys = Object.keys(ChatModelNames)

  for (let key of keys) {
    if (ChatModelNames[key] === name) {
      return key as ChatModel
    }
  }

  throw new Error(`Chat model with name "${name}" not found.`)
}
