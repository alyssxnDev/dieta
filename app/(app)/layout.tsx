// Authenticated app shell. Step 3 will add <BottomTabBar /> + safe-area padding.
// For now, a thin pass-through so route group `(app)` produces a layout boundary.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-full flex-col">{children}</div>
}
