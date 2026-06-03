"use client";

import { togglePaymentStatus, addNewOffice } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Clock, CheckCircle2, AlertCircle, CreditCard, Users, Briefcase, Plus, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SuperAdminDashboardClient({ offices }: any) {
  
  const handleTogglePayment = async (workId: string, currentStatus: string) => {
    await togglePaymentStatus(workId, currentStatus);
  };

  return (
    <div className="space-y-8">
      
      <div className="flex justify-between items-center bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 backdrop-blur-xl shadow-lg">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          إدارة المكاتب
        </h2>
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-white text-zinc-950 hover:bg-zinc-200 h-11 px-6 gap-2 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]">
            <Plus className="w-4 h-4" /> إضافة مكتب جديد
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md rounded-2xl shadow-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">تسجيل مكتب جديد</DialogTitle>
            </DialogHeader>
            <form action={addNewOffice} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">اسم المكتب</Label>
                <Input name="name" className="bg-zinc-900 border-zinc-700 h-12 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">اسم المستخدم (لتسجيل الدخول)</Label>
                <Input name="username" className="bg-zinc-900 border-zinc-700 h-12 rounded-xl text-left" required dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">كلمة المرور</Label>
                <Input name="password" type="password" className="bg-zinc-900 border-zinc-700 h-12 rounded-xl text-left" required dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">عناوين IP المسموحة (اختياري)</Label>
                <Input name="allowedIps" placeholder="192.168.1.1, 10.0.0.5 أو اتركها * للكل" className="bg-zinc-900 border-zinc-700 h-12 rounded-xl text-left placeholder:text-zinc-600" dir="ltr" />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-12 mt-4 shadow-lg shadow-emerald-500/20 transition-all">
                إنشاء حساب المكتب
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {offices.length === 0 && (
        <div className="text-center py-20 text-zinc-500 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 backdrop-blur-xl">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl">لا توجد مكاتب مسجلة في النظام بعد</p>
        </div>
      )}

      {offices.map((office: any) => {
        // Calculate totals for the office
        const totalSessionsDuration = office.sessions.reduce((acc: number, s: any) => acc + (s.durationInMin || 0), 0);
        const totalHours = Math.floor(totalSessionsDuration / 60);
        const remainingMinutes = totalSessionsDuration % 60;
        
        return (
          <Card key={office.id} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-zinc-800/50 border-b border-zinc-800/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner">
                  <Briefcase className="text-orange-400 w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{office.name}</h2>
                  <p className="text-zinc-400" dir="ltr">@{office.username}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-zinc-950/50 px-4 py-2 rounded-xl border border-zinc-800/50 text-center">
                  <p className="text-xs text-zinc-500 mb-1">إجمالي ساعات العمل</p>
                  <p className="font-bold text-emerald-400 font-mono text-lg">{totalHours}h {remainingMinutes}m</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  إدارة المدفوعات والطلبات
                </h3>
                
                {office.dailyRecords.length === 0 ? (
                  <p className="text-zinc-500 text-sm">لا توجد طلبات مسجلة لهذا المكتب</p>
                ) : (
                  <div className="space-y-4">
                    {office.dailyRecords.map((record: any) => (
                      <div key={record.id} className="bg-zinc-800/30 rounded-2xl border border-zinc-700/30 overflow-hidden">
                        <div className="bg-zinc-800/50 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="font-bold text-zinc-200">
                            {format(new Date(record.date), 'EEEE، d MMMM yyyy', { locale: ar })}
                          </span>
                          <span className="text-sm font-medium bg-zinc-900 px-3 py-1 rounded-full text-zinc-400">
                            إجمالي الطلبات المستلمة: {record.totalOrders}
                          </span>
                        </div>
                        
                        <div className="p-4">
                          {record.employeeWorks.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center">لم يتم توزيع أي طلبات في هذا اليوم</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {record.employeeWorks.map((work: any) => (
                                <div key={work.id} className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl flex flex-col justify-between gap-3 transition-colors hover:border-zinc-700/50">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-zinc-400" />
                                      <span className="font-bold text-zinc-200">{work.employee.name}</span>
                                    </div>
                                    <span className="text-lg font-black text-white bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/50">
                                      {work.ordersCount}
                                    </span>
                                  </div>
                                  
                                  <Button 
                                    onClick={() => handleTogglePayment(work.id, work.paymentStatus)}
                                    variant={work.paymentStatus === "PAID" ? "default" : "outline"}
                                    className={`w-full h-9 text-xs font-bold rounded-lg transition-all ${
                                      work.paymentStatus === "PAID" 
                                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30" 
                                        : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                    }`}
                                  >
                                    {work.paymentStatus === "PAID" ? (
                                      <><CheckCircle2 className="w-4 h-4 ml-1.5" /> تم الدفع للموظف</>
                                    ) : (
                                      <><AlertCircle className="w-4 h-4 ml-1.5" /> غير مدفوع</>
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-800/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  سجل جلسات الدخول للمكتب
                </h3>
                
                {office.sessions.length === 0 ? (
                  <p className="text-zinc-500 text-sm">لا توجد جلسات عمل مسجلة</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="text-zinc-500 border-b border-zinc-800">
                        <tr>
                          <th className="pb-3 px-2 font-medium">تاريخ الجلسة</th>
                          <th className="pb-3 px-2 font-medium">وقت البدء</th>
                          <th className="pb-3 px-2 font-medium">وقت الانتهاء</th>
                          <th className="pb-3 px-2 font-medium">المدة المحتسبة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {office.sessions.map((session: any) => (
                          <tr key={session.id} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="py-3 px-2 text-zinc-300">
                              {format(new Date(session.date), 'yyyy/MM/dd')}
                            </td>
                            <td className="py-3 px-2 text-zinc-400" dir="ltr" style={{textAlign: 'right'}}>
                              {format(new Date(session.startTime), 'hh:mm a')}
                            </td>
                            <td className="py-3 px-2 text-zinc-400" dir="ltr" style={{textAlign: 'right'}}>
                              {session.endTime ? format(new Date(session.endTime), 'hh:mm a') : <span className="text-emerald-400 flex items-center justify-end gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> جارية الآن</span>}
                            </td>
                            <td className="py-3 px-2 font-medium text-white" dir="ltr" style={{textAlign: 'right'}}>
                              {session.durationInMin ? `${Math.floor(session.durationInMin / 60)}h ${session.durationInMin % 60}m` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
