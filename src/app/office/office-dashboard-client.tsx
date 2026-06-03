"use client";

import { useState } from "react";
import { updateDailyTotal, assignOrderToEmployee, addNewEmployee, startSession, endSession } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveTimer } from "@/components/live-timer";
import { Users, Package, Clock, CheckCircle2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function OfficeDashboardClient({ dailyRecord, employees, activeSession }: any) {
  const [totalOrders, setTotalOrders] = useState(dailyRecord.totalOrders);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [ordersToAssign, setOrdersToAssign] = useState(0);

  const distributedOrders = dailyRecord.employeeWorks.reduce((acc: number, work: any) => acc + work.ordersCount, 0);
  const remainingOrders = totalOrders - distributedOrders;

  const handleUpdateTotal = async () => {
    await updateDailyTotal(totalOrders);
  };

  const handleAssign = async () => {
    if (!selectedEmployee || ordersToAssign <= 0) return;
    await assignOrderToEmployee(selectedEmployee, ordersToAssign);
    setOrdersToAssign(0);
    setSelectedEmployee("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Time Tracking Bento */}
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
                <Button onClick={() => endSession()} variant="destructive" className="h-12 px-6 rounded-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all border border-red-500/50">
                  إنهاء الجلسة
                </Button>
              </>
            ) : (
              <Button onClick={() => startSession()} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all border border-emerald-500/50">
                بدء جلسة عمل جديدة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Order Stats Bento */}
      <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-xl rounded-3xl flex flex-col justify-between">
        <CardHeader>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Package className="text-blue-400 w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            الطلبات اليومية
          </CardTitle>
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
            <Button onClick={handleUpdateTotal} className="h-12 px-6 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl shadow-lg shadow-blue-600/20">
              تحديث
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
            <div className="bg-zinc-800/30 p-4 rounded-2xl border border-zinc-700/30 text-center">
              <p className="text-zinc-400 text-sm mb-1">الموزعة</p>
              <p className="text-3xl font-bold text-emerald-400">{distributedOrders}</p>
            </div>
            <div className="bg-zinc-800/30 p-4 rounded-2xl border border-zinc-700/30 text-center">
              <p className="text-zinc-400 text-sm mb-1">المتبقية</p>
              <p className={`text-3xl font-bold ${remainingOrders > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{remainingOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Assign Orders Bento */}
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
          
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-sm font-medium border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white h-10 px-4 gap-2 transition-colors">
              <UserPlus className="w-4 h-4" /> موظف جديد
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md rounded-2xl shadow-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">إضافة موظف جديد</DialogTitle>
              </DialogHeader>
              <form action={addNewEmployee} className="space-y-5 pt-4">
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

            <Button onClick={handleAssign} disabled={!selectedEmployee || ordersToAssign <= 0 || ordersToAssign > remainingOrders} className="h-12 px-8 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl w-full sm:w-auto shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
              تعيين للموظف
            </Button>
          </div>

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
                        <span className="text-xs text-zinc-500">حالة الدفع: {work.paymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع'}</span>
                      </div>
                    </div>
                    <span className="bg-zinc-900 px-4 py-2 rounded-xl text-emerald-400 font-bold border border-zinc-800/50 shadow-inner">
                      {work.ordersCount}
                    </span>
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
