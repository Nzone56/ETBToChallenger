import Brand from "./Brand";
import MobileNav from "./MobileNav";
import NavPanel from "./NavPanel";

/**
 * Fixed sidebar on desktop, top bar + drawer below `lg`, and the content
 * column. Awaits nothing: everything data-backed in here streams.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-border bg-card/60 backdrop-blur-sm lg:flex">
        <div className="flex h-20 items-center px-5">
          <Brand />
        </div>
        <NavPanel />
      </aside>

      <MobileNav brand={<Brand />}>
        <NavPanel />
      </MobileNav>

      <div className="lg:pl-sidebar">
        <main className="mx-auto w-full max-w-app px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
