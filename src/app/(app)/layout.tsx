import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-shell/app-header";
import { BottomTabBar } from "@/components/app-shell/bottom-tab-bar";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/entrar");
  }

  const user = session.user;
  const displayName = user.name?.split(" ")[0] ?? user.email ?? "você";

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader displayName={displayName} avatarUrl={user.image ?? null} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:py-8 md:pb-12">{children}</div>
      </main>

      <BottomTabBar />
    </div>
  );
}
