"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Abstract Glassmorphism Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />

      <Card className="w-full max-w-md bg-zinc-900/40 border-zinc-800/50 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1 pb-8 pt-8 text-center">
          <div className="mx-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/5">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">تسجيل الدخول</CardTitle>
          <CardDescription className="text-zinc-400 text-sm">
            أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300 font-medium">اسم المستخدم</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="أدخل اسم المستخدم" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-blue-500 focus-visible:ring-offset-zinc-950 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 font-medium">كلمة المرور</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800/50 border-zinc-700/50 text-white h-12 focus-visible:ring-blue-500 focus-visible:ring-offset-zinc-950 transition-all text-left"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm font-medium bg-red-950/30 p-3 rounded-lg border border-red-900/50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-white text-zinc-950 hover:bg-zinc-200 font-bold transition-all duration-300 mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
