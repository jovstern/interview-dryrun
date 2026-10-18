import GreetingForm from '@/app/ui/greeting-form'

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">interview-task</h1>
      <GreetingForm />
    </main>
  )
}
