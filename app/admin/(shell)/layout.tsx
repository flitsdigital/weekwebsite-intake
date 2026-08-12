import Nav from './nav';
import { signOut } from '../actions';

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-white px-3 py-5 md:flex">
        <div className="mb-7 px-3">
          <p className="text-sm font-bold">Weekwebsite</p>
          <p className="text-xs text-muted">Backoffice</p>
        </div>

        <Nav />

        <form action={signOut} className="mt-auto px-3 pt-6">
          <button className="text-xs text-muted hover:text-ink">Uitloggen</button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-line bg-white px-4 py-2 md:hidden">
          <Nav compact />
        </div>
        {children}
      </div>
    </div>
  );
}
