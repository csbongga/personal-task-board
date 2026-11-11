import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export const THAI_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/**
 * แปลงวันที่ ISO (เช่น "2026-12-15") เป็นรูปแบบไทยสั้น "15 ธ.ค. 69"
 */
export function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const clean = dateStr.slice(0, 10);
    const parts = clean.split("-");
    if (parts.length === 3) {
      const yearCE = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (
        !isNaN(yearCE) &&
        !isNaN(monthIdx) &&
        monthIdx >= 0 &&
        monthIdx < 12 &&
        !isNaN(day)
      ) {
        const yearBE = yearCE + 543;
        const shortYearBE = String(yearBE).slice(-2);
        return `${day} ${THAI_MONTHS_SHORT[monthIdx]} ${shortYearBE}`;
      }
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = THAI_MONTHS_SHORT[date.getMonth()];
    const shortYearBE = String(date.getFullYear() + 543).slice(-2);
    return `${day} ${month} ${shortYearBE}`;
  } catch {
    return dateStr;
  }
}

export function formatThaiDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = THAI_MONTHS_SHORT[date.getMonth()];
    const shortYearBE = String(date.getFullYear() + 543).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${shortYearBE} ${hours}:${mins} น.`;
  } catch {
    return dateStr;
  }
}

export function getDueDateStatus(
  dueDateStr: string | null | undefined,
  status?: string
): "overdue" | "soon" | "normal" | null {
  if (!dueDateStr || status === "done") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clean = dueDateStr.slice(0, 10);
  const parts = clean.split("-");
  let due: Date;
  if (parts.length === 3) {
    due = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
  } else {
    due = new Date(dueDateStr);
  }
  due.setHours(0, 0, 0, 0);
  if (isNaN(due.getTime())) return null;

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "soon";
  return "normal";
}
