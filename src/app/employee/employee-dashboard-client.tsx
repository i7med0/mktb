"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, CheckCircle2, AlertCircle, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function EmployeeDashboardClient({ works, stats }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Summary Stats Bento */}
      <Card className="md:col-span-3 bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-xl rounded-3xl">
        <CardContent className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">إحصائيات آخر 30 يوماً</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-blue-500 to-transparent" />
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">إجمالي المنجز</p>
                <p className="text-4xl font-black text-white">{stats.totalOrdersLast30Days}</p>
              </div>
            </div>

            <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-500 to-transparent" />
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">الطلبات المدفوعة</p>
                <p className="text-4xl font-black text-emerald-400">{stats.totalPaid}</p>
              </div>
            </div>

            <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-rose-500 to-transparent" />
              <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">الطلبات غير المدفوعة</p>
                <p className="text-4xl font-black text-rose-400">{stats.totalUnpaid}</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* 2. Work History Table Bento */}
      <Card className="md:col-span-3 bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-xl rounded-3xl">
        <CardHeader className="border-b border-zinc-800/50 pb-6">
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <CalendarDays className="text-purple-400 w-5 h-5" />
            </div>
            سجل العمل (آخر 30 يوماً)
          </CardTitle>
          <CardDescription className="text-zinc-400 mt-2">يعرض هذا السجل الطلبات التي قمت بإنجازها والوضع المالي لها</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {works.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 bg-zinc-800/10 rounded-2xl border border-zinc-800/30 border-dashed">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">لا يوجد سجل عمل في آخر 30 يوماً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-zinc-400">
                    <th className="pb-4 font-medium px-4">التاريخ</th>
                    <th className="pb-4 font-medium px-4">عدد الطلبات المنجزة</th>
                    <th className="pb-4 font-medium px-4">حالة الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {works.map((work: any) => (
                    <tr key={work.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 px-4 text-zinc-300">
                        {format(new Date(work.dailyRecord.date), 'EEEE، d MMMM yyyy', { locale: ar })}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center justify-center bg-zinc-800 text-white font-bold px-4 py-1 rounded-full border border-zinc-700/50">
                          {work.ordersCount} طلب
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {work.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            تم الدفع
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-1.5 rounded-full border border-rose-400/20 font-medium">
                            <AlertCircle className="w-4 h-4" />
                            غير مدفوع
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
