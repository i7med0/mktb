"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateDailyTotal, assignOrderToEmployee, addNewEmployee, startSession, endSession, editAssignedWork, deleteAssignedWork, editEmployee, deleteEmployee } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveTimer } from "@/components/live-timer";
import { Users, Package, Clock, CheckCircle2, UserPlus, CalendarDays, Edit, Trash2, Search, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function OfficeDashboardClient({ dailyRecord, employees, activeSession, monthlyStats, targetDateStr }: any) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [totalOrders, setTotalOrders] = useState(dailyRecord.totalOrders);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [ordersToAssign, setOrdersToAssign] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    setTotalOrders(dailyRecord.totalOrders);
  }, [dailyRecord.totalOrders]);

  // حسابات يومية
  const distributedOrders = dailyRecord.employeeWorks.reduce((acc: number, work: any) => acc + work.ordersCount, 0);
  const remainingOrders = totalOrders - distributedOrders;
  const assignedEmployeeCount = dailyRecord.employeeWorks.length;
  const isFullyDistributed = totalOrders > 0 && remainingOrders === 0;
  const isOverDistributed = remainingOrders < 0;

  // فرز وبحث في قائمة الموظفين
  const filteredEmployees = useMemo(() =>
    employees.filter((emp: any) =>
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.username.toLowerCase().includes(employeeSearch.toLowerCase())
    ), [employees, employeeSearch]);

  // --- Handlers with loading state ---
  const handleUpdateTotal = () => {
    startTransition(async () => {
      try {
        await updateDailyTotal(totalOrders, targetDateStr);
        toast("تم تحديث العدد الإجمالي بنجاح", "success");
      } catch {
        toast("حدث خطأ أثناء التحديث", "error");
      }
    });
  };

  const handleAssign = () => {
    if (!selectedEmployee || ordersToAssign <= 0) return;
    startTransition(async () => {
      try {
        await assignOrderToEmployee(selectedEmployee, ordersToAssign, targetDateStr);
        setOrdersToAssign(0);
        setSelectedEmployee("");
        toast("تم توزيع الطلبات بنجاح", "success");
        // إشعار إضافي إذا انتهى الرصيد بعد التوزيع
        if (remainingOrders - ordersToAssign === 0) {
          toast("🎉 تم توزيع جميع الطلبات!", "success");
        }
      } catch {
        toast("حدث خطأ أثناء توزيع الطلبات", "error");
      }
    });
  };

  const handleDeleteAssignedWork = (workId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التوزيع؟")) return;
    startTransition(async () => {
      try {
        await deleteAssignedWork(workId);
        toast("تم الحذف بنجاح", "success");
      } catch {
        toast("حدث خطأ أثناء الحذف", "error");
      }
    });
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (!window.confirm("هل أنت متأكد من أرشفة (إيقاف) هذا الموظف؟ لن يتمكن من الدخول مجدداً لكن سجلاته ستبقى محفوظة.")) return;
    startTransition(async () => {
      try {
        await deleteEmployee(employeeId);
        toast("تمت أرشفة الموظف بنجاح", "success");
      } catch {
        toast("حدث خطأ أثناء الأرشفة", "error");
      }
    });
  };

  const handleStartSession = () => {
    startTransition(async () => {
      try {
        await startSession();
        toast("تم بدء الجلسة بنجاح", "success");
      } catch {
        toast("حدث خطأ أثناء بدء الجلسة", "error");
      }
    });
  };

  const handleEndSession = () => {
    startTransition(async () => {
      try {
        await endSession();
        toast("تم إنهاء الجلسة بنجاح", "success");
      } catch {
        toast("حدث خطأ أثناء إنهاء الجلسة", "error");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* تبديل اليوم / الأمس */}
      <div className="md:col-span-3 flex justify-center mb-2">
        <div className="bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/80 flex items-center gap-1 shadow-lg backdrop-blur-xl">
          <button 
            onClick={() => router.push("/office")}
            className={`px-8 py-3 rounded-xl font-bold transition-all text-sm ${!targetDateStr || targetDateStr !== "yesterday" ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
          >
            بيانات اليوم
          </button>
          <button 
            onClick={() => router.push("/office?date=yesterday")}
            className={`px-8 py-3 rounded-xl font-bold transition-all text-sm ${targetDateStr === "yesterday" ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
          >
            بيانات الأمس
          </button>
        </div>
      </div>

      {/* بطاقة تتبع الوقت */}
      <Card className="md:col-span-3 bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700/50 shadow-inner">
              <Clock className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">تتبع وقت العمل</h2>
              <p className="text-zinc-400 mt-1">يتم احتساب أجور المكتب بناءً على ساعات العمل الفعلية</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {activeSession ? (
              <>
                <LiveTimer startTimeStr={new Date(activeSession.startTime).toISOString()} />
                <Button onClick={handleEndSession} disabled={isPending} variant="destructive" className="h-12 px-6 rounded-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all border border-red-500/50 disabled:opacity-50">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "إنهاء الجلسة"}
                </Button>
              </>
            ) : (
              <Button onClick={handleStartSession} disabled={isPending} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all border border-emerald-500/50 disabled:opacity-50">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
                بدء جلسة عمل جديدة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ ملخص التوزيع اليومي الواضح */}
      <Card className={`md:col-span-3 border backdrop-blur-xl shadow-xl rounded-3xl transition-all ${
        isOverDistributed
          ? "bg-red-950/30 border-red-500/50"
          : isFullyDistributed
          ? "bg-emerald-950/30 border-emerald-500/50"
          : "bg-zinc-900/40 border-zinc-800/50"
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {isFullyDistributed && !isOverDistributed && (
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
              )}
              {isOverDistributed && (
                <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              )}
              {!isFullyDistributed && !isOverDistributed && (
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Package className="w-8 h-8 text-blue-400" />
                </div>
              )}
              <div>
                {isFullyDistributed && <p className="text-2xl font-black text-emerald-400">✅ تم توزيع جميع الطلبات!</p>}
                {isOverDistributed && <p className="text-2xl font-black text-red-400">⚠️ تجاوز الرصيد المسموح!</p>}
                {!isFullyDistributed && !isOverDistributed && (
                  <p className="text-2xl font-black text-white">
                    وُزِّع <span className="text-emerald-400">{distributedOrders}</span> من أصل <span className="text-blue-400">{totalOrders}</span> طلب
                  </p>
                )}
                <p className="text-zinc-400 mt-1">على {assignedEmployeeCount} موظف</p>
              </div>
            </div>

            <div className="flex gap-6 text-center">
              <div className="bg-zinc-900/60 rounded-2xl px-6 py-4 border border-zinc-800/60">
                <p className="text-zinc-400 text-sm">الموزّعة</p>
                <p className="text-3xl font-black text-emerald-400">{distributedOrders}</p>
              </div>
              <div className={`rounded-2xl px-6 py-4 border ${
                remainingOrders < 0
                  ? "bg-red-900/30 border-red-500/40"
                  : remainingOrders === 0
                  ? "bg-zinc-900/60 border-zinc-800/60"
                  : "bg-amber-900/20 border-amber-500/30"
              }`}>
                <p className="text-zinc-400 text-sm">المتبقية</p>
                <p className={`text-3xl font-black ${remainingOrders < 0 ? "text-red-400" : remainingOrders === 0 ? "text-zinc-500" : "text-amber-400"}`}>
                  {Math.abs(remainingOrders)}
                </p>
              </div>
            </div>
          </div>

          {/* شريط التقدم */}
          {totalOrders > 0 && (
            <div className="mt-4">
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isOverDistributed ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-emerald-400"}`}
                  style={{ width: `${Math.min((distributedOrders / totalOrders) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إحصائيات الشهر */}
      <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-xl rounded-3xl flex flex-col justify-between">
        <CardHeader>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <CalendarDays className="text-indigo-400 w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">إحصائيات الشهر</CardTitle>
          <CardDescription className="text-zinc-400">إجمالي الساعات المنجزة هذا الشهر</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-black text-indigo-400 mb-2">
            {monthlyStats?.totalHours || 0}<span className="text-2xl text-zinc-500 font-medium">h</span> {monthlyStats?.remainingMinutes || 0}<span className="text-2xl text-zinc-500 font-medium">m</span>
          </div>
        </CardContent>
      </Card>

      {/* بطاقة الطلبات اليومية */}
      <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-xl rounded-3xl flex flex-col justify-between">
        <CardHeader>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Package className="text-blue-400 w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">الطلبات اليومية</CardTitle>
          <CardDescription className="text-zinc-400">إجمالي الطلبات المستلمة اليوم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
              {totalOrders}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={totalOrders}
              onChange={(e) => setTotalOrders(Number(e.target.value))}
              className="bg-zinc-800/50 border-zinc-700 h-12 text-xl font-bold focus-visible:ring-blue-500 text-center rounded-xl"
            />
            <Button onClick={handleUpdateTotal} disabled={isPending} className="h-12 px-6 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "تحديث"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* بطاقة التوزيع */}
      <Card className="md:col-span-2 bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-xl rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50 mb-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <CheckCircle2 className="text-purple-400 w-5 h-5" />
              </div>
              توزيع الطلبات
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-2">قم بتعيين الطلبات المنجزة لكل موظف على حدة</CardDescription>
          </div>

          <div className="flex gap-2">
            {/* زر إضافة موظف جديد */}
            <Dialog>
              <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-sm font-medium border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white h-10 px-4 gap-2 transition-colors">
                <UserPlus className="w-4 h-4" /> موظف جديد
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md rounded-2xl shadow-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">إضافة موظف جديد</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                  try {
                    await addNewEmployee(formData);
                    toast("تمت إضافة الموظف بنجاح", "success");
                  } catch {
                    toast("حدث خطأ أثناء الإضافة", "error");
                  }
                }} className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">الاسم الكامل</Label>
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
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-12 mt-4">
                    إنشاء الحساب
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* زر إدارة الموظفين مع بحث */}
            <Dialog>
              <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-sm font-medium border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white h-10 px-4 gap-2 transition-colors">
                <Users className="w-4 h-4" /> إدارة الموظفين
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-xl rounded-2xl shadow-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">إدارة الموظفين</DialogTitle>
                </DialogHeader>

                {/* 🔍 بحث الموظفين */}
                <div className="relative mt-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="ابحث بالاسم أو اسم المستخدم..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 pr-10 h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-3 pt-2 max-h-[55vh] overflow-y-auto pr-1">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-center text-zinc-500 py-6">لا توجد نتائج</p>
                  ) : (
                    filteredEmployees.map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                        <div>
                          <p className="font-bold text-white">{emp.name}</p>
                          <p className="text-sm text-zinc-500" dir="ltr">@{emp.username}</p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger className="p-2 text-zinc-400 hover:text-blue-400 bg-zinc-800 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md rounded-2xl shadow-2xl" dir="rtl">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold">تعديل بيانات الموظف</DialogTitle>
                              </DialogHeader>
                              <form action={async (formData) => {
                                try {
                                  await editEmployee(emp.id, formData);
                                  toast("تم تعديل بيانات الموظف بنجاح", "success");
                                } catch {
                                  toast("حدث خطأ أثناء التعديل", "error");
                                }
                              }} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label className="text-zinc-300">الاسم الكامل</Label>
                                  <Input name="name" defaultValue={emp.name} className="bg-zinc-900 border-zinc-700" required />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-zinc-300">اسم المستخدم</Label>
                                  <Input name="username" defaultValue={emp.username} className="bg-zinc-900 border-zinc-700 text-left" dir="ltr" required />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-zinc-300">كلمة المرور الجديدة (اختياري)</Label>
                                  <Input name="password" type="password" className="bg-zinc-900 border-zinc-700 text-left" dir="ltr" />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-12">
                                  حفظ التعديلات
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <button onClick={() => handleDeleteEmployee(emp.id)} disabled={isPending} className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-800 rounded-lg transition-colors disabled:opacity-50">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end bg-zinc-800/20 p-6 rounded-2xl border border-zinc-800/50">
            <div className="space-y-2 flex-1 w-full">
              <Label className="text-zinc-300">اختر الموظف</Label>
              <select
                className="w-full h-12 rounded-xl bg-zinc-900/80 border border-zinc-700 text-white px-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">-- يرجى اختيار الموظف --</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.name} (@{emp.username})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 w-full sm:w-32">
              <Label className="text-zinc-300">عدد الطلبات</Label>
              <Input
                type="number"
                value={ordersToAssign || ""}
                onChange={(e) => setOrdersToAssign(Number(e.target.value))}
                className="bg-zinc-900/80 border-zinc-700 h-12 focus-visible:ring-purple-500 text-center font-bold text-lg rounded-xl"
              />
            </div>

            <Button
              onClick={handleAssign}
              disabled={!selectedEmployee || ordersToAssign <= 0 || ordersToAssign > remainingOrders || isPending}
              className="h-12 px-8 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl w-full sm:w-auto shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "تعيين للموظف"}
            </Button>
          </div>

          {/* ✅ إشعار اكتمال التوزيع داخل البطاقة */}
          {isFullyDistributed && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 font-bold">تم توزيع جميع الطلبات بنجاح على الموظفين!</p>
            </div>
          )}

          {isOverDistributed && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="text-red-300 font-bold">تحذير: تم توزيع أكثر من العدد الإجمالي للطلبات! الفرق: {Math.abs(remainingOrders)}</p>
            </div>
          )}

          {/* قائمة التوزيعات */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-medium text-zinc-400">سجل إنجازات الموظفين (اليوم):</h3>
            {dailyRecord.employeeWorks.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 bg-zinc-800/10 rounded-2xl border border-zinc-800/30 border-dashed">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                لم يتم تعيين أي طلبات اليوم
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dailyRecord.employeeWorks.map((work: any) => (
                  <div key={work.id} className="flex justify-between items-center bg-zinc-800/30 p-4 rounded-2xl border border-zinc-700/30 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                        <Users className="w-5 h-5 text-zinc-300" />
                      </div>
                      <div>
                        <span className="block font-bold text-zinc-200">{work.employee.name}</span>
                        <span className="text-xs text-zinc-500">حالة الدفع: {work.paymentStatus === 'PAID' ? 'مدفوع ✓' : 'غير مدفوع'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger className="text-zinc-500 hover:text-blue-400 transition">
                            <Edit className="w-4 h-4" />
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-sm rounded-2xl shadow-2xl" dir="rtl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">تعديل التوزيع</DialogTitle>
                            </DialogHeader>
                            <form action={async (formData) => {
                              try {
                                await editAssignedWork(work.id, Number(formData.get("count")));
                                toast("تم تحديث العدد بنجاح", "success");
                              } catch {
                                toast("حدث خطأ أثناء التحديث", "error");
                              }
                            }} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label className="text-zinc-300">العدد الجديد</Label>
                                <Input name="count" type="number" defaultValue={work.ordersCount} className="bg-zinc-900 border-zinc-700 text-center text-lg font-bold" required />
                              </div>
                              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-12">
                                تحديث العدد
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <button onClick={() => handleDeleteAssignedWork(work.id)} disabled={isPending} className="text-zinc-500 hover:text-rose-400 transition mr-2 disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <span className="bg-zinc-900 px-4 py-2 rounded-xl text-emerald-400 font-bold border border-zinc-800/50 shadow-inner mr-2">
                          {work.ordersCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
