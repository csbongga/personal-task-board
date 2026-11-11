-- Seed Data for Personal Task Board (งานอาจารย์เปรม)
-- Run this script in the Supabase SQL Editor to populate initial 7 tasks

-- Truncate existing data to start clean
truncate table tasks restart identity cascade;

do $$
declare
  t1_id uuid := gen_random_uuid();
  t2_id uuid := gen_random_uuid();
  t3_id uuid := gen_random_uuid();
  t4_id uuid := gen_random_uuid();
  t5_id uuid := gen_random_uuid();
  t6_id uuid := gen_random_uuid();
  t7_id uuid := gen_random_uuid();
begin
  -- 1. บทความ FF69
  insert into tasks (id, title, category, status, waiting_for, priority, position)
  values (t1_id, 'บทความ FF69', 'article', 'waiting', 'รอผู้ทรงพิจารณา', 1, 0);

  insert into steps (task_id, title, done, done_at, position) values
    (t1_id, 'เขียนต้นฉบับ', true, now(), 0),
    (t1_id, 'ส่งวารสาร', true, now(), 1),
    (t1_id, 'รอผลพิจารณา', false, null, 2),
    (t1_id, 'แก้ไขตามผู้ทรง', false, null, 3),
    (t1_id, 'ตอบรับ/ตีพิมพ์', false, null, 4);

  insert into activity (task_id, message)
  values (t1_id, 'สร้างงานเริ่มต้นตามระบบ');

  -- 2. บทความดวงตา
  insert into tasks (id, title, category, status, waiting_for, priority, position)
  values (t2_id, 'บทความดวงตา', 'article', 'waiting', 'รอผู้ทรงพิจารณา', 2, 1);

  insert into steps (task_id, title, done, done_at, position) values
    (t2_id, 'เขียนต้นฉบับ', true, now(), 0),
    (t2_id, 'ส่งวารสาร', true, now(), 1),
    (t2_id, 'รอผลพิจารณา', false, null, 2),
    (t2_id, 'แก้ไขตามผู้ทรง', false, null, 3),
    (t2_id, 'ตอบรับ/ตีพิมพ์', false, null, 4);

  insert into activity (task_id, message)
  values (t2_id, 'สร้างงานเริ่มต้นตามระบบ');

  -- 3. บทความใบอ้อย
  insert into tasks (id, title, category, status, waiting_for, priority, position)
  values (t3_id, 'บทความใบอ้อย', 'article', 'doing', null, 1, 0);

  insert into steps (task_id, title, done, done_at, position) values
    (t3_id, 'เขียนร่างต้นฉบับ', true, now(), 0),
    (t3_id, 'ขอยกเว้นจริยธรรม', false, null, 1),
    (t3_id, 'ส่งวารสาร', false, null, 2),
    (t3_id, 'รอผลพิจารณา', false, null, 3),
    (t3_id, 'แก้ไขตามผู้ทรง', false, null, 4);

  insert into activity (task_id, message)
  values (t3_id, 'สร้างงานเริ่มต้นตามระบบ');

  -- 4. วิจัย FF69
  insert into tasks (id, title, category, status, waiting_for, priority, position)
  values (t4_id, 'วิจัย FF69', 'research', 'waiting', 'รอลายเซ็นหนังสือรับรองการใช้ประโยชน์', 1, 2);

  insert into steps (task_id, title, done, done_at, position) values
    (t4_id, 'ส่งหนังสือรับรองการใช้ประโยชน์ให้เซ็น', true, now(), 0),
    (t4_id, 'ได้ลายเซ็นกลับมา', false, null, 1),
    (t4_id, 'ทำบันทึกขอเบิกงวดที่ 3', false, null, 2);

  insert into activity (task_id, message)
  values (t4_id, 'สร้างงานเริ่มต้นตามระบบ');

  -- 5. เอกสารคำสอน การเขียนโปรแกรมภาษาระดับสูง
  insert into tasks (id, title, category, status, waiting_for, priority, position)
  values (t5_id, 'เอกสารคำสอน การเขียนโปรแกรมภาษาระดับสูง', 'teaching', 'doing', null, 2, 1);

  insert into steps (task_id, title, done, done_at, position) values
    (t5_id, 'เขียนเนื้อหาครบ', true, now(), 0),
    (t5_id, 'ปรับอ้างอิง', false, null, 1),
    (t5_id, 'ตรวจทานภาพรวม', false, null, 2),
    (t5_id, 'ส่งตรวจ', false, null, 3);

  insert into activity (task_id, message)
  values (t5_id, 'สร้างงานเริ่มต้นตามระบบ');

  -- 6. ตำรา การออกแบบและการเขียนโปรแกรมบนเว็บ (4132303)
  insert into tasks (id, title, category, status, waiting_for, priority, position)
  values (t6_id, 'ตำรา การออกแบบและการเขียนโปรแกรมบนเว็บ (4132303)', 'teaching', 'doing', null, 1, 2);

  insert into steps (task_id, title, done, done_at, position) values
    (t6_id, 'บทที่ 1', true, now(), 0),
    (t6_id, 'บทที่ 2', true, now(), 1),
    (t6_id, 'บทที่ 3', false, null, 2),
    (t6_id, 'บทที่ 4', false, null, 3),
    (t6_id, 'บทที่ 5', false, null, 4),
    (t6_id, 'บทที่ 6', false, null, 5),
    (t6_id, 'บทที่ 7', false, null, 6),
    (t6_id, 'บทที่ 8', false, null, 7),
    (t6_id, 'บทที่ 9', false, null, 8),
    (t6_id, 'บทที่ 10', false, null, 9),
    (t6_id, 'บทที่ 11', false, null, 10),
    (t6_id, 'บทที่ 12', false, null, 11),
    (t6_id, 'บทที่ 13', false, null, 12),
    (t6_id, 'บทที่ 14', false, null, 13),
    (t6_id, 'บทที่ 15', false, null, 14),
    (t6_id, 'ตรวจอ้างอิง', false, null, 15),
    (t6_id, 'ปรับปรุงภาพรวม', false, null, 16);

  insert into activity (task_id, message)
  values (t6_id, 'สร้างงานเริ่มต้นตามระบบ');

  -- 7. เอกสารคำสอน การพัฒนาแอปพลิเคชันเพื่อชุมชน (4134227)
  insert into tasks (id, title, category, status, waiting_for, priority, position)
  values (t7_id, 'เอกสารคำสอน การพัฒนาแอปพลิเคชันเพื่อชุมชน (4134227)', 'teaching', 'polish', null, 2, 0);

  insert into steps (task_id, title, done, done_at, position) values
    (t7_id, 'เขียนเนื้อหาครบทุกบท', true, now(), 0),
    (t7_id, 'ปรับปรุงเนื้อหาให้ดีขึ้น', false, null, 1),
    (t7_id, 'ตรวจทานภาพรวม', false, null, 2);

  insert into activity (task_id, message)
  values (t7_id, 'สร้างงานเริ่มต้นตามระบบ');

end $$;
