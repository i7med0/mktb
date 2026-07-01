"use client";

import { togglePaymentStatus, addNewOffice, editOffice, deleteOffice } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Clock, CheckCircle2, AlertCircle, CreditCard, Users, Briefcase, Plus, ShieldCheck, Edit, Trash2, Calendar, Download, Package, BarChart2, History } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export default function SuperAdminDashboardClient({ offices, globalRecords, targetMonth, targetYear, employeeStats, auditLogs }: any) {
  const router = useRouter();
  const { toast } = useToast();

  const handleTogglePayment = async (workId: string, currentStatus: string) => {
    try {
      await togglePaymentStatus(workId, currentStatus);
      toast("تم تغيير حالة الدفع بنجاح", "success");
    } catch (error) {
      toast("حدث خطأ أثناء تغيير الحالة", "error");
    }
  };

  const handleDeleteOffice = async (officeId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المكتب نهائياً؟ سيتم حذف جميع الموظفين وسجلات العمل الخاصة به.")) {
      try {
        await deleteOffice(officeId);
        toast("تم حذف المكتب بنجاح", "success");
      } catch (error) {
        toast("حدث خطأ أثناء حذف المكتب", "error");
      }
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      const [y, m] = value.split("-");
      router.push(`/super-admin?year=${y}&month=${m}`);
    } else {
      router.push(`/super-admin`);
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "التاريخ,عدد الطلبات الكلي,اسم الموظف,عدد طلبات الموظف,حالة الدفع\n";
    
    globalRecords.forEach((record: any) => {
      const date = format(new Date(record.date), 'yyyy-MM-dd');
      record.employeeWorks.forEach((work: any) => {
        const empName = work.employee.name;
        const count = work.ordersCount;
        const status = work.paymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع';
        csvContent += `${date},${record.totalOrders},"${empName}",${count},"${status}"\n`;
      });
      if (record.employeeWorks.length === 0) {
        csvContent += `${date},${record.totalOrders},لا يوجد,0,-\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_الشهر_${targetYear}_${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global Stats
  const totalOffices = offices.length;
  const totalOrders = globalRecords.reduce((s: number, dr: any) => s + dr.totalOrders, 0);
  const totalMinutes = offices.reduce((sum: number, o: any) => sum + o.sessions.reduce((s: number, session: any) => s + (session.durationInMin || 0), 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  // Group sessions by day for the timeline view
  const timeline: Record<string, { date: Date, sessions: any[], totalDurationInMin: number }> = {};
  offices.forEach((office: any) => {
    if (office.sessions) {
      office.sessions.forEach((session: any) => {
        const dateStr = format(new Date(session.date), 'yyyy-MM-dd');
        if (!timeline[dateStr]) {
          timeline[dateStr] = { date: new Date(session.date), sessions: [], totalDurationInMin: 0 };
        }
        timeline[dateStr].sessions.push({ ...session, officeName: office.name });
        if (session.durationInMin) {
          timeline[dateStr].totalDurationInMin += session.durationInMin;
        }
      });
    }
  });
  const dailyTimeline = Object.values(timeline).sort((a, b) => b.date.getTime() - a.date.getTime());
  dailyTimeline.forEach(day => {
    day.sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  });

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
            <form action={async (formData) => {
              try {
                await addNewOffice(formData);
                toast("تمت إضافة المكتب بنجاح", "success");
              } catch (error) {
                toast("حدث خطأ أثناء الإضافة", "error");
              }
            }} className="space-y-5 pt-4">
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

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Calendar className="text-zinc-400 w-5 h-5" />
          <Label className="text-zinc-300">تصفية حسب الشهر:</Label>
          <select 
            className="bg-zinc-800 border border-zinc-700 text-white h-10 px-4 rounded-xl outline-none"
            defaultValue={`${targetYear}-${targetMonth}`}
            onChange={handleFilterChange}
          >
            <option value="">كل الأوقات (الافتراضي)</option>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const m = d.getMonth() + 1;
              const y = d.getFullYear();
              return <option key={`${y}-${m}`} value={`${y}-${m}`}>{format(d, 'MMMM yyyy', { locale: ar })}</option>
            })}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2 font-bold h-10 px-4 sm:px-6 transition-colors">
              <Clock className="w-4 h-4" /> تفاصيل دوام المكاتب
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-3xl rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  تفاصيل دوام المكاتب - {format(new Date(targetYear, targetMonth - 1), 'MMMM yyyy', { locale: ar })}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {dailyTimeline.length > 0 ? dailyTimeline.map((day, index) => (
                  <div key={index} className="bg-zinc-900/40 rounded-2xl p-4 sm:p-6 border border-zinc-800/50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {format(day.date, 'dd MMMM yyyy', { locale: ar })}
                      </h3>
                      <span className="bg-zinc-950/50 text-zinc-300 text-sm font-bold px-3 py-1.5 rounded-xl border border-zinc-800/80 shadow-sm">
                        إجمالي: <span className="text-emerald-400 font-mono ml-1" dir="ltr">{Math.floor(day.totalDurationInMin / 60)}h {day.totalDurationInMin % 60}m</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800/50">
                          <tr>
                            <th className="px-4 py-3 whitespace-nowrap">المكتب</th>
                            <th className="px-4 py-3 whitespace-nowrap">وقت الدخول</th>
                            <th className="px-4 py-3 whitespace-nowrap">وقت الخروج</th>
                            <th className="px-4 py-3 whitespace-nowrap">المدة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.sessions.map((session: any) => (
                            <tr key={session.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap font-bold text-white flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-zinc-500" />
                                {session.officeName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-blue-400" dir="ltr">{format(new Date(session.startTime), 'hh:mm a')}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-rose-400" dir="ltr">
                                {session.endTime ? format(new Date(session.endTime), 'hh:mm a') : <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-xs">مستمر...</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-zinc-300">
                                {session.durationInMin ? (
                                  <span className="font-mono bg-zinc-800 px-2 py-1 rounded">
                                    {Math.floor(session.durationInMin / 60)}h {session.durationInMin % 60}m
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-6 bg-zinc-950/30 rounded-xl border border-zinc-800/30 text-zinc-500">
                    لا توجد جلسات عمل مسجلة في الشهر المحدد.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 font-bold h-10 px-4 sm:px-6">
            <Download className="w-4 h-4" /> تصدير التقرير
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
          <p className="text-zinc-400 mb-2">إجمالي المكاتب</p>
          <p className="text-4xl font-black text-white">{totalOffices}</p>
        </div>
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
          <p className="text-zinc-400 mb-2">إجمالي الطلبات (للشهر المحدد)</p>
          <p className="text-4xl font-black text-blue-400">{totalOrders}</p>
        </div>
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 flex flex-col items-center justify-center text-center">
          <p className="text-zinc-400 mb-2">إجمالي الساعات (للشهر)</p>
          <p className="text-4xl font-black text-emerald-400">{totalHours} <span className="text-xl text-zinc-500">ساعة</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* المكاتب */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            المكاتب المسجلة
          </h2>
          
          {offices.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>لا توجد مكاتب مسجلة</p>
            </div>
          ) : (
            offices.map((office: any) => {
              const totalSessionsDuration = office.sessions.reduce((acc: number, s: any) => acc + (s.durationInMin || 0), 0);
              const officeHours = Math.floor(totalSessionsDuration / 60);
              const officeMinutes = totalSessionsDuration % 60;
              
              return (
                <Card key={office.id} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl rounded-3xl overflow-hidden mb-6">
                  <div className="bg-zinc-800/50 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Briefcase className="text-orange-400 w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{office.name}</h2>
                        <p className="text-zinc-400 text-sm" dir="ltr">@{office.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger className="text-zinc-400 hover:text-blue-400 transition-colors bg-zinc-950 hover:bg-zinc-800 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-center">
                          <Edit className="w-4 h-4" />
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md rounded-2xl shadow-2xl" dir="rtl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">تعديل مكتب</DialogTitle>
                          </DialogHeader>
                          <form action={async (formData) => {
                            try {
                              await editOffice(office.id, formData);
                              toast("تم التعديل بنجاح", "success");
                            } catch {
                              toast("حدث خطأ", "error");
                            }
                          }} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label className="text-zinc-300">اسم المكتب</Label>
                              <Input name="name" defaultValue={office.name} className="bg-zinc-900 border-zinc-700" required />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-zinc-300">اسم المستخدم</Label>
                              <Input name="username" defaultValue={office.username} className="bg-zinc-900 border-zinc-700 text-left" required dir="ltr" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-zinc-300">كلمة المرور الجديدة (اختياري)</Label>
                              <Input name="password" type="password" className="bg-zinc-900 border-zinc-700 text-left" dir="ltr" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-zinc-300">عناوين IP المسموحة</Label>
                              <Input name="allowedIps" defaultValue={office.allowedIps?.join(', ')} className="bg-zinc-900 border-zinc-700 text-left" dir="ltr" />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">حفظ التعديلات</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <button onClick={() => handleDeleteOffice(office.id)} className="text-zinc-400 hover:text-rose-400 transition-colors bg-zinc-950 hover:bg-zinc-800 p-2.5 rounded-xl border border-zinc-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-950/30 flex justify-between">
                    <p className="text-zinc-400 text-sm">إجمالي الساعات: <strong className="text-emerald-400 font-mono">{officeHours}h {officeMinutes}m</strong></p>
                    <p className="text-zinc-400 text-sm">الجلسات: <strong className="text-white font-mono">{office.sessions.length}</strong></p>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* السجلات اليومية المجمعة */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            السجلات اليومية المشتركة
          </h2>
          
          {globalRecords.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>لا توجد سجلات يومية</p>
            </div>
          ) : (
            globalRecords.map((record: any) => (
              <Card key={record.id} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl rounded-3xl overflow-hidden mb-6">
                <CardHeader className="bg-zinc-900/50 border-b border-zinc-800/50 p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                      <Clock className="w-5 h-5 text-blue-400" />
                      {format(new Date(record.date), 'dd MMMM yyyy', { locale: ar })}
                    </CardTitle>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">المستلمة: {record.totalOrders}</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">الموزعة: {record.employeeWorks.reduce((sum: number, work: any) => sum + work.ordersCount, 0)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {record.employeeWorks.length > 0 ? (
                    <table className="w-full text-sm text-right">
                      <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800/50">
                        <tr>
                          <th className="px-6 py-3">الموظف</th>
                          <th className="px-6 py-3">العدد</th>
                          <th className="px-6 py-3 text-center">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.employeeWorks.map((work: any) => (
                          <tr key={work.id} className="border-b border-zinc-800/30">
                            <td className="px-6 py-3 font-medium text-white">{work.employee.name}</td>
                            <td className="px-6 py-3"><span className="bg-zinc-800 px-2 py-1 rounded">{work.ordersCount}</span></td>
                            <td className="px-6 py-3 text-center">
                              <Button
                                onClick={() => handleTogglePayment(work.id, work.paymentStatus)}
                                variant={work.paymentStatus === "PAID" ? "default" : "outline"}
                                size="sm"
                                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                                  work.paymentStatus === "PAID" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "text-zinc-400 border-zinc-700"
                                }`}
                              >
                                {work.paymentStatus === "PAID" ? "مدفوع" : "غير مدفوع"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-zinc-500">لا يوجد توزيعات للموظفين في هذا اليوم</div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
      {/* قسم مقارنة الموظفين - Bar Chart بسيط */}
      {employeeStats && employeeStats.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-blue-400" />
            </div>
            إنجازات الموظفين - {format(new Date(targetYear, targetMonth - 1), 'MMMM yyyy', { locale: ar })}
          </h2>
          <div className="space-y-4">
            {employeeStats.map((emp: any, index: number) => {
              const maxOrders = employeeStats[0].totalOrders;
              const pct = maxOrders > 0 ? (emp.totalOrders / maxOrders) * 100 : 0;
              const colors = ['from-blue-500 to-blue-400', 'from-emerald-500 to-emerald-400', 'from-purple-500 to-purple-400', 'from-amber-500 to-amber-400', 'from-rose-500 to-rose-400'];
              const color = colors[index % colors.length];
              return (
                <div key={emp.id} className="flex items-center gap-4">
                  <div className="w-32 text-right">
                    <p className="text-zinc-200 font-bold text-sm truncate">{emp.name}</p>
                    <p className="text-zinc-500 text-xs">{emp.unpaidOrders > 0 ? `${emp.unpaidOrders} غير مدفوع` : "مدفوع بالكامل ✓"}</p>
                  </div>
                  <div className="flex-1 h-10 bg-zinc-800 rounded-xl overflow-hidden relative">
                    <div
                      className={`h-full bg-gradient-to-r ${color} rounded-xl transition-all duration-700 flex items-center justify-end pr-3`}
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-white font-black text-sm">{emp.totalOrders}</span>
                    </div>
                  </div>
                  <div className="w-20 text-left">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${emp.unpaidOrders > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {emp.paidOrders}/{emp.totalOrders}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* سجل التدقيق */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            سجل التدقيق (آخر 30 عملية)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="pb-3 px-3">الوقت</th>
                  <th className="pb-3 px-3">المستخدم</th>
                  <th className="pb-3 px-3">العملية</th>
                  <th className="pb-3 px-3">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 px-3 text-zinc-500 text-xs whitespace-nowrap" dir="ltr">
                      {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm')}
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-bold text-zinc-200">{log.actorName}</p>
                        <p className="text-zinc-500 text-xs">{log.actorRole === 'OFFICE' ? 'مكتب' : 'إدارة عليا'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        log.action === 'ASSIGN' ? 'bg-blue-500/10 text-blue-400' :
                        log.action === 'EDIT_WORK' ? 'bg-amber-500/10 text-amber-400' :
                        log.action === 'DELETE_WORK' ? 'bg-red-500/10 text-red-400' :
                        log.action === 'TOGGLE_PAYMENT' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {log.action === 'ASSIGN' ? 'توزيع' :
                         log.action === 'EDIT_WORK' ? 'تعديل' :
                         log.action === 'DELETE_WORK' ? 'حذف' :
                         log.action === 'TOGGLE_PAYMENT' ? 'دفع' : log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
