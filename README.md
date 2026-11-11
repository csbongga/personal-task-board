# 📋 ระบบกระดานติดตามงานอาจารย์เปรม (Personal Task Board)

ระบบกระดานจัดการภาระงานสำหรับอาจารย์มหาวิทยาลัย (บทความวิชาการ/วิจัย, หนังสือ/ตำรา/เอกสารคำสอน, งานวิจัยทุน) ออกแบบมาให้ใช้งานง่าย รวดเร็ว รองรับทั้งหน้าจอคอมพิวเตอร์และมือถือ พร้อมระบบจัดเก็บข้อมูลแบบ Dual Storage (เชื่อมต่อ **Supabase Database** อัตโนมัติ หรือใช้งานผ่าน **Local Offline Store** ทันทีโดยไม่ต้องตั้งค่าฐานข้อมูล)

---

## 🚀 ฟีเจอร์เด่น (Key Features)

1. **Kanban Board ครบวงจร**: จัดการคอลัมน์ตามสถานะ 5 ขั้น:
   - ⚪ **ยังไม่เริ่ม (To Do)**
   - 🔵 **กำลังทำ (Doing)**
   - 🟢 **ปรับปรุง (Polish)**
   - 🟡 **รอผล (Waiting)** — ระบุชื่อผู้รอผล/หน่วยงานที่รอได้ชัดเจน
   - 🟢 **เสร็จแล้ว (Done)**
2. **ระบบขั้นตอนย่อย (Sub-steps Checklist & Progress)**:
   - ติ๊กบันทึกความคืบหน้ารายขั้นตอน พร้อม Timestamp วันที่ติ๊กเสร็จ
   - มีเทมเพลตมาตรฐานสำหรับบทความวิชาการ และสร้างบทอัตโนมัติสำหรับตำรา (เช่น บทที่ 1 ถึง 15)
   - ปรบมือแสดงความยินดี (Confetti) เมื่อทำขั้นตอนครบ 100%
3. **บันทึกประวัติการกระทำ (Activity Log)**:
   - บันทึกประวัติการเปลี่ยนแปลงอัตโนมัติ เช่น การย้ายสถานะ, การเพิ่ม/แก้ไขขั้นตอน, การติ๊กสำเร็จ
4. **ความปลอดภัยสูง (Pin Protection & RLS)**:
   - รองรับการตั้งรหัสผ่าน PIN 4-6 หลักผ่าน `ACCESS_PIN`
   - ตารางใน Supabase เปิด **Row Level Security (RLS)** 100% ไม่อนุญาตให้ Anonymous Client ฝั่งเว็บเข้าถึงโดยตรง โดยการเข้าถึงทำผ่าน Server-side Next.js ด้วย `service_role` เท่านั้น
5. **โหมดสลับฐานข้อมูลอัตโนมัติ (Zero-Config Dual Storage)**:
   - หากตั้งค่า Supabase ระบบจะเชื่อมต่อไปยัง Cloud Database
   - หากยังไม่ได้ตั้งค่า Supabase ระบบจะใช้ Local Store (`.data/local-db.json` / In-Memory) พร้อมข้อมูลเริ่มต้น 7 งานทันที ทำให้เปิดโปรเจกต์ขึ้นมาแล้วพร้อมใช้งานได้ทันที

---

## 📁 โครงสร้างโปรเจกต์

```text
├── app/
│   ├── actions.ts             # Server Actions (CRUD Tasks, Steps, Activity, PIN verification)
│   ├── layout.tsx             # Root layout พร้อมธีมและฟอนต์
│   ├── page.tsx               # หน้ากระดานงานหลัก (Board UI)
│   ├── pin/                   # หน้าจอกรอกรหัส PIN
│   └── globals.css            # สไตล์ Tailwind CSS
├── lib/
│   ├── local-store.ts         # ระบบบันทึกข้อมูล Local Database (Fallback)
│   ├── templates.ts           # เทมเพลตขั้นตอนและชุดข้อมูลตั้งต้น (7 งาน)
│   ├── types.ts               # Data Contracts & Type Definitions
│   ├── utils.ts               # ฟังก์ชันแปลงวันที่ภาษาไทยและ Utility ทั่วไป
│   └── supabase/
│       └── server.ts          # Supabase Admin Client (Service Role / Server Only)
├── supabase/
│   ├── schema.sql             # SQL สร้าง Tables, Indexes, Triggers, RLS
│   └── seed.sql               # SQL นำเข้าข้อมูลเริ่มต้น 7 งานของอาจารย์เปรม
├── middleware.ts              # Route Guard สำหรับตรวจสอบรหัสผ่าน PIN
├── .env.example               # ตัวอย่างการตั้งค่าตัวแปรสภาพแวดล้อม
└── README.md                  # คู่มือการติดตั้งและใช้งานระบบ
```

---

## 🛠️ วิธีติดตั้งและใช้งานในเครื่อง (Local Development)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่าสภาพแวดล้อม (.env.local)

คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`:

```bash
cp .env.example .env.local
```

แก้ไขค่าใน `.env.local`:

```env
# ตั้งรหัส PIN สำหรับเข้าใช้งาน (หากปล่อยว่างไว้ ระบบจะไม่ถามรหัสผ่าน)
ACCESS_PIN=1234

# ข้อมูล Supabase (หากยังไม่ใส่ ระบบจะใช้ Local Offline Store อัตโนมัติ)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 3. รันโปรเจกต์ในโหมด Development

```bash
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่: [http://localhost:3000](http://localhost:3000)

> **หมายเหตุ:** ในการรันครั้งแรก หากยังไม่ได้ตั้งค่า Supabase ระบบจะสร้างไฟล์ `.data/local-db.json` และใส่ข้อมูล 7 งานเริ่มต้นของอาจารย์เปรมให้โดยอัตโนมัติ!

---

## 🗄️ การติดตั้งฐานข้อมูล Supabase (ฟรี)

หากต้องการบันทึกข้อมูลขึ้น Cloud ของ Supabase ให้ทำตามขั้นตอนดังนี้:

### ขั้นตอนที่ 1: สร้างโปรเจกต์ Supabase
1. เข้าไปที่ [supabase.com](https://supabase.com) แล้วเข้าสู่ระบบ (หรือสมัครสมาชิกฟรี)
2. กด **New Project**
3. ตั้งชื่อโปรเจกต์ เช่น `personal-task-board`
4. ตั้ง Database Password และเลือก Region ที่ใกล้ประเทศไทย (เช่น `Singapore (ap-southeast-1)`)
5. กด **Create new project** แล้วรอระบบจัดเตรียมฐานข้อมูลประมาณ 1-2 นาที

### ขั้นตอนที่ 2: รันคำสั่ง Schema & Seed
1. ในเมนูด้านซ้ายของ Supabase Dashboard ให้คลิกที่ไอคอน **SQL Editor**
2. คลิกปุ่ม **New query**
3. เปิดไฟล์ `supabase/schema.sql` ในโปรเจกต์ คัดลอกเนื้อหาทั้งหมดมาวางใน SQL Editor แล้วกดปุ่ม **Run**
   - คำสั่งนี้จะสร้างตาราง `tasks`, `steps`, `activity`, Indexes, Triggers และเปิดใช้งาน Row Level Security (RLS)
4. (ตัวเลือก) นำเข้าข้อมูลเริ่มต้น: คลิกสร้าง Query ใหม่อีกอัน นำเนื้อหาจากไฟล์ `supabase/seed.sql` มาวาง แล้วกดปุ่ม **Run**
   - คำสั่งนี้จะนำเข้าข้อมูลเริ่มต้น 7 งานของอาจารย์เปรม

### ขั้นตอนที่ 3: รับ API Keys มาใส่ในโปรเจกต์
1. ใน Supabase Dashboard ให้ไปที่เมนู **Project Settings** (ไอคอนฟันเฟืองด้านล่างซ้าย) → **API**
2. คัดลอกค่าต่อไปนี้:
   - **Project URL** นำไปใส่ใน `SUPABASE_URL` ในไฟล์ `.env.local`
   - ใต้หัวข้อ **Project API keys** ให้มองหาคีย์ชื่อ `service_role` (secret) แล้วกด **Reveal** จากนั้นคัดลอกนำไปใส่ใน `SUPABASE_SERVICE_ROLE_KEY` ในไฟล์ `.env.local`

> ⚠️ **ข้อควรระวังด้านความปลอดภัย**: อย่าเปิดเผย `SUPABASE_SERVICE_ROLE_KEY` ต่อสาธารณะ และห้ามใส่ prefix `NEXT_PUBLIC_` โดยเด็ดขาด เนื่องจากระบบถูกออกแบบให้รันผ่าน Server Actions ฝั่งเซิร์ฟเวอร์เท่านั้น

---

## 🚢 การ Deploy ขึ้น Vercel (Production)

### 1. นำโค้ดขึ้น GitHub
```bash
git add .
git commit -m "feat: complete personal task board with supabase and pin auth"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### 2. นำขึ้น Vercel
1. เข้าสู่ระบบ [vercel.com](https://vercel.com) แล้วกด **Add New...** → **Project**
2. เลือก Import repository จาก GitHub ที่เพิ่ง Push ขึ้นไป
3. ในส่วน **Environment Variables** ให้กรอกตัวแปรสภาพแวดล้อมดังนี้:
   - `SUPABASE_URL` = URL ของ Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key ของ Supabase
   - `ACCESS_PIN` = รหัส PIN ที่ต้องการ (เช่น `6123`)
4. กดปุ่ม **Deploy** แล้วรอระบบสร้างเว็บเสร็จสิ้น (ประมาณ 1 นาที)
5. เข้าใช้งานผ่านโดเมน `.vercel.app` ได้ทันที

---

## 🧪 การทดสอบระบบ (Verification Checklist)

- [x] **Local Store Fallback**: เมื่อไม่มี Supabase URL ใน `.env.local` ระบบยังทำงานได้ปกติ 100% พร้อมแสดงผล 7 งานเริ่มต้นทันที
- [x] **Supabase Admin Integration**: รองรับการอ่านและบันทึกลง Supabase ผ่าน Service Role Key พร้อม Auto-seed เมื่อตารางว่าง
- [x] **PIN Middleware**: ป้องกันหน้ากระดานด้วยรหัสผ่าน PIN หากยังไม่ได้ Login จะถูก Redirect ไปหน้า `/pin` อัตโนมัติ
- [x] **Sub-steps & Checklists**: ติ๊กขั้นตอนย่อยแล้วคำนวณ Progress Bar และสถานะ All Steps Done อย่างแม่นยำ
- [x] **Activity Logging**: บันทึกกิจกรรมการเปลี่ยนแปลงงานทุกขั้นตอน

---

พัฒนาโดยทีมวิศวกรรมระบบ เพื่อความสะดวกและคล่องตัวสูงสุดในการทำงานของอาจารย์เปรม 🎯
