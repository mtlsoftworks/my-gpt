import { auth } from '@/auth'
import { LoginButton } from '@/components/login-button'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  const session = await auth()
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <LoginButton />
      <p className="text-center mt-4">
        Not accepting new users at this time.
      </p>
    </div>
  )
}
