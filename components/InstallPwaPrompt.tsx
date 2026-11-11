"use client";

import React, { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  X,
  CheckCircle2,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Keep a module-level reference in case the event fires before component re-renders
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Register Service Worker for PWA installability
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore service worker registration errors in dev
      });
    }

    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      const standaloneMatch =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setIsStandalone(standaloneMatch);
    };
    checkStandalone();

    // Detect iOS (iPhone / iPad / iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    // Check if banner was dismissed in this session
    try {
      if (sessionStorage.getItem("pwa_banner_dismissed") === "1") {
        setBannerDismissed(true);
      }
    } catch {
      // Ignore storage error
    }

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setGuideOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (promptToUse) {
      try {
        await promptToUse.prompt();
        const choiceResult = await promptToUse.userChoice;
        if (choiceResult.outcome === "accepted") {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
        }
        return;
      } catch {
        // Fallback to guide dialog if prompt fails
      }
    }
    setGuideOpen(true);
  }, [deferredPrompt]);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem("pwa_banner_dismissed", "1");
    } catch {
      // Ignore
    }
  };

  if (!mounted || isStandalone) {
    return null;
  }

  return (
    <>
      {/* ปุ่มกดติดตั้งในแถบด้านบน (แสดงเฉพาะบนมือถือ/แท็บเล็ตเมื่อยังไม่ได้ติดตั้ง) */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="md:hidden inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300 text-xs font-semibold shadow-sm transition active:scale-95"
        aria-label="ติดตั้งแอปลงหน้าจอมือถือ"
        title="ติดตั้งเป็นไอคอนแอปบนมือถือ"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>ติดตั้งแอป</span>
      </button>

      {/* แบนเนอร์เชิญชวนติดตั้งด้านล่างหน้าจอมือถือ (กดปิดได้) */}
      {!bannerDismissed && (
        <div className="md:hidden fixed bottom-20 inset-x-3 z-30 rounded-2xl border border-blue-200/90 bg-white/95 dark:border-blue-800/80 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="งานอาจารย์เปรม"
              className="w-11 h-11 rounded-xl shrink-0 shadow-sm border border-slate-200/60 dark:border-slate-700"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                ติดตั้ง &quot;งานอาจารย์เปรม&quot; ลงมือถือ
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                เพิ่มเป็นไอคอนบนหน้าจอโฮม เปิดได้ทันทีเหมือนแอปจริง
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                กดติดตั้ง
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                aria-label="ปิดแบนเนอร์ติดตั้งแอป"
                className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* หน้าต่างแนะนำวิธีติดตั้งเป็นไอคอนบนมือถือ (กรณี iOS Safari หรือเบราว์เซอร์ที่ต้องกดผ่านเมนู) */}
      <Dialog.Root open={guideOpen} onOpenChange={setGuideOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl outline-none space-y-4 animate-in fade-in-50 zoom-in-95 duration-200"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/icon-192.png"
                  alt="งานอาจารย์เปรม"
                  className="w-11 h-11 rounded-xl shadow-sm border border-slate-200/70 dark:border-slate-700"
                />
                <div>
                  <Dialog.Title className="text-base font-bold text-slate-900 dark:text-white">
                    ติดตั้งเป็นไอคอนบนมือถือ
                  </Dialog.Title>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    เปิดใช้งานเต็มจอได้ทันทีเหมือนแอปทั่วไป
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="ปิดหน้าต่าง"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white -mr-1 -mt-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>สำหรับ iPhone / iPad (Safari หรือ Chrome):</span>
                </p>
                <ol className="space-y-2.5 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="flex-1">
                      กดปุ่ม{" "}
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <Share className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        แชร์ (Share)
                      </span>{" "}
                      ที่แถบด้านล่างหรือมุมขวาบนของเบราว์เซอร์
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="flex-1">
                      เลื่อนลงมาแล้วกดเลือก{" "}
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <PlusSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="flex-1">
                      กดปุ่ม{" "}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        &quot;เพิ่ม&quot; (Add)
                      </span>{" "}
                      ที่มุมขวาบน เป็นอันเสร็จเรียบร้อย!
                    </div>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>วิธีเพิ่มเป็นไอคอนแอปบนหน้าจอมือถือ:</span>
                </p>
                <ol className="space-y-2.5 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="flex-1">
                      กดปุ่มเมนู{" "}
                      <span className="inline-flex items-center gap-0.5 font-semibold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <MoreVertical className="w-3.5 h-3.5" /> (จุด 3 จุด)
                      </span>{" "}
                      ที่มุมขวาบนของเบราว์เซอร์ (หรือปุ่มแชร์{" "}
                      <Share className="inline w-3.5 h-3.5" /> บน iPhone)
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="flex-1">
                      เลือกเมนู{" "}
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        ติดตั้งแอป (Install app)
                      </span>{" "}
                      หรือ{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        &quot;เพิ่มลงในหน้าจอหลัก&quot;
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="flex-1">
                      กดยืนยัน{" "}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        &quot;ติดตั้ง&quot;
                      </span>{" "}
                      ไอคอนเว็บจะไปอยู่ที่หน้าจอโฮมทันทีครับ
                    </div>
                  </li>
                </ol>
              </div>
            )}

            <div className="pt-1 flex justify-end">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>เข้าใจแล้ว</span>
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export default InstallPwaPrompt;
