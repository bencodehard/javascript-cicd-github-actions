# ---------- Base stage (common deps) ----------
FROM node:20-alpine AS base

# สร้างกลุ่มและ user แบบ system (ไม่ใช่ root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# ติดตั้ง dependencies (ใช้ root ติดตั้งให้เสร็จก่อนค่อย chown ทีหลัง)
COPY package*.json ./
RUN npm ci

# คัดลอกไฟล์ที่ใช้ build/test
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY jest.config.* ./ || true
COPY example_certs ./example_certs

# ให้สิทธิ์ owner เป็น appuser (จะใช้ใน stage ถัดไป)
RUN chown -R appuser:appgroup /app

# ---------- Build stage ----------
FROM base AS build

ENV NODE_ENV=production

# build โดยใช้ user ปกติ (ลดสิทธิ์)
USER appuser

RUN npm run build

# ---------- Test stage ----------
FROM base AS test

ENV NODE_ENV=test

# ใช้ user ปกติ
USER appuser

# ถ้าอยากให้ใช้ .env ตอน test และไม่ได้ block จาก .dockerignore
COPY .env .env

RUN npm test

# ---------- Runtime (Deploy) stage ----------
FROM node:20-alpine AS runtime

# สร้าง user/group เดียวกับใน base เพื่อให้ UID/GID ตรงกัน
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production
# ถ้ามีใช้ TLS กับ Postgres
ENV NODE_EXTRA_CA_CERTS=/app/example_certs/ca.crt

# ติดตั้งเฉพาะ production deps (ทำตอนยังเป็น root)
COPY package*.json ./
RUN npm ci --omit=dev

# คัดลอกไฟล์ build ที่ compile แล้ว
COPY --from=build /app/dist ./dist
COPY --from=base /app/example_certs ./example_certs

# ตั้ง permission ให้ appuser
RUN chown -R appuser:appgroup /app

# เปลี่ยนมาใช้ user สิทธิ์น้อย
USER appuser

EXPOSE 3000

# optional: สามารถคิดต่อไปถึงการ read-only rootfs ตอน docker run เช่น --read-only
CMD ["node", "dist/server.js"]