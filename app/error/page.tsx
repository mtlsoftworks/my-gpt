export default async function ErrorPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <h1 className="text-3xl font-bold">Access Denied</h1>
      <p className="text-center mt-4">Not accepting new users at this time.</p>
    </div>
  )
}
