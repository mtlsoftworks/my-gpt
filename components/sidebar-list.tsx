import { getChats, removeChat, shareChat } from '@/app/actions'
import { SidebarActions } from '@/components/sidebar-actions'
import { SidebarItem } from '@/components/sidebar-item'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from './ui/button'
import { Tooltip, TooltipTrigger } from './ui/tooltip'
import { IconMessage, IconPlus } from './ui/icons'

export interface SidebarListProps {
  userId?: string
}

export async function SidebarList({ userId }: SidebarListProps) {
  const chats = await getChats(userId)

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-2 px-2">
        <div className="relative">
          <div className="absolute left-2 top-1 flex h-6 w-6 items-center justify-center">
            <IconPlus className="mr-2" />
          </div>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'group w-full pl-8 pr-16'
            )}
          >
            <div
              className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
              title="New Chat"
            >
              <span className="whitespace-nowrap">Start New Chat</span>
            </div>
          </Link>
        </div>
        {chats.map(
          chat =>
            chat && (
              <SidebarItem key={chat?.id} chat={chat}>
                <SidebarActions
                  chat={chat}
                  removeChat={removeChat}
                  shareChat={shareChat}
                />
              </SidebarItem>
            )
        )}
      </div>
    </div>
  )
}
