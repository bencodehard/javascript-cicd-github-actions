# simple-users-management-nodeJS 🔧

**คำอธิบายสั้น ๆ:**
โปรเจ็กต์ตัวอย่างระบบจัดการผู้ใช้ด้วย Node.js + TypeScript ใช้ Express, Prisma (Postgres) และ Redis สำหรับ caching พร้อมการยืนยันตัวตนแบบ JWT

---

## คุณสมบัติหลัก ✨
- ลงทะเบียนผู้ใช้ (email/password)
- เข้าสู่ระบบและรับโทเค็น JWT
- ดูข้อมูลผู้ใช้ปัจจุบัน (auth required)
- ดึงผู้ใช้ตาม ID (auth required)
- อัพเดต `firstName` / `lastName`
- Health / DB / Redis checks
- Caching ของ user ใน Redis

---

## เทคโนโลยี 🔧
- Node.js + TypeScript
- Express
- Prisma (Postgres)
- Redis
- bcrypt (hashing)
- jsonwebtoken (JWT)

---

## เตรียมสภาพแวดล้อม & รัน (Development) ��

1. Clone:
```bash
git clone https://github.com/bencodehard/simple-users-management-nodeJS.git
cd simple-users-management-nodeJS
```

2. ติดตั้ง dependencies:
```bash
npm install
```

3. ตั้งค่าไฟล์ `.env` (มีตัวอย่างใน repo: `.env.example`) แล้วปรับค่าตามสภาพแวดล้อมของคุณ

4. สร้าง Prisma client และรัน migrations (ถ้าจำเป็น):
```bash
npx prisma generate
npx prisma migrate dev
```

5. รันแอพ (development):
```bash
npm run dev
```

เปิดที่: `http://localhost:3000` (หรือค่า `PORT` ใน `.env`)

---

## สคริปต์ที่ใช้บ่อย 📋

| คำสั่ง | คำอธิบาย |
|---|---|
| `npm run dev` | รันด้วย `ts-node-dev` (development) |
| `npm run build` | คอมไพล์ TypeScript -> `dist` |
| `npm start` | รันไฟล์ build (`node dist/server.js`) |

---

## ตัวแปรแวดล้อมสำคัญ (.env) ⚙️

| ตัวแปร | คำอธิบาย |
|---|---|
| `PORT` | พอร์ตเซิร์ฟเวอร์ (default 3000) |
| `DATABASE_URL` | Postgres connection string |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_USERNAME` / `REDIS_PASSWORD` / `REDIS_DB` | Redis config |
| `JWT_SECRET` | คีย์ลับสำหรับเซ็น JWT |
| `JWT_EXPIRES_IN` | ตัวอย่าง: `1h` |
| `BCRYPT_SALT_ROUNDS` | ตัวอย่าง: `10` |

> มีตัวอย่าง `.env` ใน repo ให้ดูการตั้งค่า

---

## Endpoints (ตัวอย่าง) 🔍

Base: `http://localhost:3000`

- GET `/health` — ตรวจสถานะ  
- GET `/db-check` — ตรวจ DB connection  
- GET `/cache-check` — ตรวจ Redis

Users (Base `/api/users`):
- POST `/api/users/register`  
  Body: `{ "email": "...", "password": "...", "firstName": "...", "lastName": "..." }`
- POST `/api/users/login`  
  Body: `{ "email": "...", "password": "..." }`
- GET `/api/users/me` *(Auth required)* — Header: `Authorization: Bearer <token>`
- GET `/api/users/:id` *(Auth required)*
- PATCH `/api/users/me` *(Auth required)* Body: e.g. `{ "firstName": "New" }`

---

## ตัวอย่างคำสั่ง curl 📡

ลงทะเบียน:
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'
```

ล็อกอิน:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'
```

ดึงข้อมูลผู้ใช้:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users/me
```

---

## หมายเหตุเกี่ยวกับ TypeScript & bcrypt 📝
ถ้าเจอ error:
> Could not find a declaration file for module 'bcrypt'...

ให้ติดตั้ง typings:
```bash
npm install --save-dev @types/bcrypt
```
หรือสร้าง `src/types/bcrypt.d.ts` แบบ minimal เป็นการแก้ปัญหาชั่วคราว

---

## TLS / ตัวอย่าง certs 🔐
มีโฟลเดอร์ `example_certs/` และค่า `NODE_EXTRA_CA_CERTS` ใน `.env` สำหรับการใช้ CA chain ในสภาพแวดล้อมที่ต้องการ

---

## Contributing ❤️
ยินดีรับ PRs และ issues — เปิด issue ก่อนถ้าต้องการฟีเจอร์หรือพบ bug

---

## License
โปรเจ็กต์ใช้สัญญาอนุญาตตาม `package.json` (ISC)
