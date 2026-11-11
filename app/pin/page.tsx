"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { verifyPinAction } from "@/app/actions";

export default function PinPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("กรุณากรอกรหัส PIN");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await verifyPinAction(pin.trim());
      // Handle both boolean and { success: boolean, error?: string } return formats
      const isSuccess =
        res === true || (typeof res === "object" && res !== null && "success" in res && (res as { success: boolean }).success);

      if (isSuccess) {
        router.push("/");
        router.refresh();
      } else {
        const errorMsg =
          typeof res === "object" && res !== null && "error" in res && (res as { error?: string }).error
            ? (res as { error?: string }).error
            : "รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
        setError(errorMsg || "รหัส PIN ไม่ถูกต้อง");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการตรวจสอบ PIN";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              งานอาจารย์เปรม
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              ระบบติดตามความคืบหน้างานบทความ ตำรา และงานวิจัย
            </p>
            <div className="mt-4 flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <KeyRound className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              กรุณากรอกรหัส PIN เพื่อเข้าใช้งาน
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="pin-input"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                รหัส PIN
              </label>
              <div className="relative mt-1.5">
                <input
                  id="pin-input"
                  type="password"
                  autoFocus
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••"
                  disabled={loading}
                  className="block w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-xl tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-offset-slate-900"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            ระบบรักษาความปลอดภัยเฉพาะบุคคล
          </p>
        </div>
      </div>
    </div>
  );
}
