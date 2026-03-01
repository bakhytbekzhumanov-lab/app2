import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { getLevel } from "@/lib/xp";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string | null = null;
  let isGuest = false;

  // 1. Try NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    // 2. Try guest cookie
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;
    if (guestId) {
      const guest = await prisma.user.findFirst({
        where: { id: guestId, isGuest: true, guestExpiresAt: { gt: new Date() } },
        select: { id: true },
      });
      if (guest) {
        userId = guest.id;
        isGuest = true;
      }
    }
  }

  // Fallback — should not happen since middleware creates guest, but just in case
  if (!userId) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, totalXp: true, currentStreak: true },
  });

  const levelInfo = getLevel(user?.totalXp ?? 0);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar isGuest={isGuest} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          nickname={user?.nickname ?? undefined}
          streak={user?.currentStreak ?? 0}
          level={levelInfo.level}
          isGuest={isGuest}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
