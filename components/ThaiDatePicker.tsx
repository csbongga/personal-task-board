"use client";

import React, { useMemo } from "react";
import { THAI_MONTHS_SHORT, formatThaiDate } from "@/lib/utils";
import { Calendar, X } from "lucide-react";

export interface ThaiDatePickerProps {
  value: string | null | undefined;
  onChange: (isoDate: string | null) => void;
  id?: string;
  className?: string;
}

function getDaysInMonth(yearCE: number, month1To12: number): number {
  return new Date(yearCE, month1To12, 0).getDate();
}

export function ThaiDatePicker({
  value,
  onChange,
  id,
  className = "",
}: ThaiDatePickerProps) {
  const currentYearCE = new Date().getFullYear();

  // Parse ISO YYYY-MM-DD
  const parsed = useMemo(() => {
    if (!value) return null;
    const clean = value.slice(0, 10);
    const parts = clean.split("-");
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return { yearCE: y, month: m, day: d };
  }, [value]);

  const yearOptionsCE = useMemo(() => {
    const start = currentYearCE - 2;
    const end = currentYearCE + 8;
    const list: number[] = [];
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    if (parsed && !list.includes(parsed.yearCE)) {
      list.push(parsed.yearCE);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [currentYearCE, parsed]);

  const maxDays = useMemo(() => {
    const y = parsed?.yearCE || currentYearCE;
    const m = parsed?.month || new Date().getMonth() + 1;
    return getDaysInMonth(y, m);
  }, [parsed, currentYearCE]);

  const emitDate = (yearCE: number, month: number, day: number) => {
    const safeMaxDay = getDaysInMonth(yearCE, month);
    const safeDay = Math.min(Math.max(1, day), safeMaxDay);
    const iso = `${String(yearCE).padStart(4, "0")}-${String(month).padStart(
      2,
      "0"
    )}-${String(safeDay).padStart(2, "0")}`;
    onChange(iso);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange(null);
      return;
    }
    const newDay = parseInt(val, 10);
    const today = new Date();
    const y = parsed?.yearCE ?? today.getFullYear();
    const m = parsed?.month ?? today.getMonth() + 1;
    emitDate(y, m, newDay);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange(null);
      return;
    }
    const newMonth = parseInt(val, 10);
    const today = new Date();
    const y = parsed?.yearCE ?? today.getFullYear();
    const d = parsed?.day ?? today.getDate();
    emitDate(y, newMonth, d);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange(null);
      return;
    }
    const newYearCE = parseInt(val, 10);
    const today = new Date();
    const m = parsed?.month ?? today.getMonth() + 1;
    const d = parsed?.day ?? today.getDate();
    emitDate(newYearCE, m, d);
  };

  return (
    <div id={id} className={`space-y-1.5 ${className}`}>
      <div className="grid grid-cols-[1fr_1.35fr_1.15fr] gap-1.5 items-center">
        {/* วัน */}
        <select
          aria-label="เลือกวัน"
          value={parsed ? String(parsed.day) : ""}
          onChange={handleDayChange}
          className="w-full text-sm px-2.5 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
        >
          <option value="">วัน</option>
          {Array.from({ length: maxDays }, (_, idx) => idx + 1).map((d) => (
            <option key={d} value={String(d)}>
              {d}
            </option>
          ))}
        </select>

        {/* เดือน */}
        <select
          aria-label="เลือกเดือน"
          value={parsed ? String(parsed.month) : ""}
          onChange={handleMonthChange}
          className="w-full text-sm px-2.5 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
        >
          <option value="">เดือน</option>
          {THAI_MONTHS_SHORT.map((label, idx) => (
            <option key={idx + 1} value={String(idx + 1)}>
              {label}
            </option>
          ))}
        </select>

        {/* ปี พ.ศ. */}
        <select
          aria-label="เลือกปี พ.ศ."
          value={parsed ? String(parsed.yearCE) : ""}
          onChange={handleYearChange}
          className="w-full text-sm px-2.5 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] sm:min-h-[38px]"
        >
          <option value="">พ.ศ.</option>
          {yearOptionsCE.map((yCE) => (
            <option key={yCE} value={String(yCE)}>
              {yCE + 543}
            </option>
          ))}
        </select>
      </div>

      {parsed && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>แสดงผล: {formatThaiDate(value)}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-600 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>ล้างวันที่</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ThaiDatePicker;
