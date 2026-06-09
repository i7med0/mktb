import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSuperAdminData, getEmployeeComparisonStats, getAuditLogs } from "./actions";
import SuperAdminDashboardClient from "./super-admin-dashboard-client";

export default async function SuperAdminPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [
    { offices, globalRecords, targetMonth, targetYear },
    employeeStats,
    auditLogs
  ] = await Promise.all([
    getSuperAdminData(resolvedSearchParams.month, resolvedSearchParams.year),
    getEmployeeComparisonStats(resolvedSearchParams.month, resolvedSearchParams.year),
    getAuditLogs(30)
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 relative overflow-hidden">
      {/* Background Glassmorphism Ornaments */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 p-6 rounded-3xl shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">لوحة تحكم الإدارة العليا</h1>
            <p className="text-zinc-400 mt-1">مرحباً بك، {session.user.name}</p>
          </div>
          <div className="flex items-center gap-4">
             <a href="/api/auth/signout" className="text-sm font-medium text-red-400 hover:text-red-300 transition bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-full border border-red-500/20">تسجيل الخروج</a>
          </div>
        </header>

        <SuperAdminDashboardClient
          offices={offices}
          globalRecords={globalRecords}
          targetMonth={targetMonth}
          targetYear={targetYear}
          employeeStats={employeeStats}
          auditLogs={auditLogs}
        />
      </div>
    </div>
  );
}
