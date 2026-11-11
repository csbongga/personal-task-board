import { TaskCategory, TaskStatus } from "./types";

export type StepTemplateType =
  | "article"
  | "teaching"
  | "advising"
  | "review"
  | "research"
  | "empty";

export const ARTICLE_TEMPLATE_STEPS: string[] = [
  "เขียนร่างต้นฉบับ",
  "ขอยกเว้น/รับรองจริยธรรม",
  "จัดรูปแบบตามวารสาร",
  "ส่งวารสาร",
  "รอผลพิจารณา",
  "แก้ไขตามผู้ทรง",
  "ตอบรับ/ตีพิมพ์",
];

export const ADVISING_TEMPLATE_STEPS: string[] = [
  "ได้หัวข้อแล้ว",
  "แบบเสนอหัวข้อ",
  "บทที่ 1",
  "บทที่ 2",
  "บทที่ 3",
  "บทที่ 4",
  "บทที่ 5",
  "ภาคผนวก",
];

export const REVIEW_TEMPLATE_STEPS: string[] = [
  "รับบทความ / รออ่าน",
  "อ่านและประเมินบทความ",
  "เขียนความเห็นและข้อเสนอแนะ",
  "ส่งผลประเมินคืนวารสาร",
];

export function generateTeachingSteps(chapterCount: number = 15): string[] {
  const safeCount = Math.max(1, Math.min(50, Math.floor(chapterCount || 15)));
  const chapters = Array.from({ length: safeCount }, (_, i) => `บทที่ ${i + 1}`);
  return [
    ...chapters,
    "ตรวจอ้างอิง",
    "ปรับปรุงภาพรวม",
    "ส่งตรวจ",
  ];
}

export function generateChaptersOnly(chapterCount: number = 15): string[] {
  const safeCount = Math.max(1, Math.min(50, Math.floor(chapterCount || 15)));
  return Array.from({ length: safeCount }, (_, i) => `บทที่ ${i + 1}`);
}

export function getTemplateSteps(
  template: StepTemplateType,
  chapterCount: number = 15
): string[] {
  switch (template) {
    case "article":
      return [...ARTICLE_TEMPLATE_STEPS];
    case "teaching":
      return generateTeachingSteps(chapterCount);
    case "advising":
      return [...ADVISING_TEMPLATE_STEPS];
    case "review":
      return [...REVIEW_TEMPLATE_STEPS];
    case "research":
    case "empty":
    default:
      return [];
  }
}

export interface SeedTaskDefinition {
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  waiting_for: string | null;
  priority: 1 | 2 | 3;
  position: number;
  steps: { title: string; done: boolean }[];
}

export const INITIAL_SEED_TASKS: SeedTaskDefinition[] = [
  {
    title: "บทความ FF69",
    category: "article",
    status: "waiting",
    waiting_for: "รอผู้ทรงพิจารณา",
    priority: 1,
    position: 0,
    steps: [
      { title: "เขียนต้นฉบับ", done: true },
      { title: "ส่งวารสาร", done: true },
      { title: "รอผลพิจารณา", done: false },
      { title: "แก้ไขตามผู้ทรง", done: false },
      { title: "ตอบรับ/ตีพิมพ์", done: false },
    ],
  },
  {
    title: "บทความดวงตา",
    category: "article",
    status: "waiting",
    waiting_for: "รอผู้ทรงพิจารณา",
    priority: 2,
    position: 1,
    steps: [
      { title: "เขียนต้นฉบับ", done: true },
      { title: "ส่งวารสาร", done: true },
      { title: "รอผลพิจารณา", done: false },
      { title: "แก้ไขตามผู้ทรง", done: false },
      { title: "ตอบรับ/ตีพิมพ์", done: false },
    ],
  },
  {
    title: "บทความใบอ้อย",
    category: "article",
    status: "doing",
    waiting_for: null,
    priority: 1,
    position: 0,
    steps: [
      { title: "เขียนร่างต้นฉบับ", done: true },
      { title: "ขอยกเว้นจริยธรรม", done: false },
      { title: "ส่งวารสาร", done: false },
      { title: "รอผลพิจารณา", done: false },
      { title: "แก้ไขตามผู้ทรง", done: false },
    ],
  },
  {
    title: "วิจัย FF69",
    category: "research",
    status: "waiting",
    waiting_for: "รอลายเซ็นหนังสือรับรองการใช้ประโยชน์",
    priority: 1,
    position: 2,
    steps: [
      { title: "ส่งหนังสือรับรองการใช้ประโยชน์ให้เซ็น", done: true },
      { title: "ได้ลายเซ็นกลับมา", done: false },
      { title: "ทำบันทึกขอเบิกงวดที่ 3", done: false },
    ],
  },
  {
    title: "เอกสารคำสอน การเขียนโปรแกรมภาษาระดับสูง",
    category: "teaching",
    status: "doing",
    waiting_for: null,
    priority: 2,
    position: 1,
    steps: [
      { title: "เขียนเนื้อหาครบ", done: true },
      { title: "ปรับอ้างอิง", done: false },
      { title: "ตรวจทานภาพรวม", done: false },
      { title: "ส่งตรวจ", done: false },
    ],
  },
  {
    title: "ตำรา การออกแบบและการเขียนโปรแกรมบนเว็บ (4132303)",
    category: "teaching",
    status: "doing",
    waiting_for: null,
    priority: 1,
    position: 2,
    steps: [
      { title: "บทที่ 1", done: true },
      { title: "บทที่ 2", done: true },
      { title: "บทที่ 3", done: false },
      { title: "บทที่ 4", done: false },
      { title: "บทที่ 5", done: false },
      { title: "บทที่ 6", done: false },
      { title: "บทที่ 7", done: false },
      { title: "บทที่ 8", done: false },
      { title: "บทที่ 9", done: false },
      { title: "บทที่ 10", done: false },
      { title: "บทที่ 11", done: false },
      { title: "บทที่ 12", done: false },
      { title: "บทที่ 13", done: false },
      { title: "บทที่ 14", done: false },
      { title: "บทที่ 15", done: false },
      { title: "ตรวจอ้างอิง", done: false },
      { title: "ปรับปรุงภาพรวม", done: false },
    ],
  },
  {
    title: "เอกสารคำสอน การพัฒนาแอปพลิเคชันเพื่อชุมชน (4134227)",
    category: "teaching",
    status: "polish",
    waiting_for: null,
    priority: 2,
    position: 0,
    steps: [
      { title: "เขียนเนื้อหาครบทุกบท", done: true },
      { title: "ปรับปรุงเนื้อหาให้ดีขึ้น", done: false },
      { title: "ตรวจทานภาพรวม", done: false },
    ],
  },
];
