import Navbar from '@/components/layout/Navbar'
import Providers from '@/components/Providers'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </Providers>
  )
}
