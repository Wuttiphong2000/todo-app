# Todo Backend API

REST API สำหรับ Todo App สร้างด้วย Express + TypeScript

## Tech Stack

| Package | หน้าที่ |
|---|---|
| `express` | Web framework |
| `cors` | Cross-Origin Resource Sharing |
| `zod` | Schema validation |
| `nanoid` | ID generation |
| `tsx` | TypeScript runner (dev) |
| `typescript` | Type system |

---

## Setup

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. Copy env
cp .env.example .env

# 3. รัน dev mode
npm run dev

# 4. Build production
npm run build && npm start
```

---

## Project Structure

```
src/
├── app.ts                        # Entry point, Express setup, middlewares
├── types/
│   └── index.ts                  # TypeScript types & interfaces ทั้งหมด
├── services/
│   ├── storage.service.ts        # อ่าน/เขียน db.json (singleton)
│   ├── todo.service.ts           # Business logic ของ todos
│   └── tag.service.ts            # Business logic ของ tags
├── controllers/
│   ├── todo.controller.ts        # HTTP handlers สำหรับ todos
│   └── tag.controller.ts         # HTTP handlers สำหรับ tags
├── routes/
│   ├── todo.routes.ts            # Route definitions + middleware binding
│   └── tag.routes.ts
└── middlewares/
    ├── validate.middleware.ts    # Zod validation factory
    └── error.middleware.ts       # AppError class + global error handler
```

---

## API Reference

### Response Format

ทุก response จะอยู่ใน envelope เดียวกัน:

```json
// Success
{ "success": true, "data": { ... }, "meta": { "total": 10 } }

// Error
{ "success": false, "error": { "code": "TODO_NOT_FOUND", "message": "..." } }
```

---

### Todos

#### `GET /api/todos`
ดึง todos ทั้งหมด พร้อม filter & sort

**Query Params:**
| Param | Type | ตัวอย่าง |
|---|---|---|
| `status` | `pending \| in_progress \| done` | `?status=pending` |
| `priority` | `low \| medium \| high` | `?priority=high` |
| `tagId` | string | `?tagId=abc123` |
| `search` | string | `?search=meeting` |
| `sortBy` | `createdAt \| updatedAt \| dueDate \| priority \| order` | `?sortBy=dueDate` |
| `sortDir` | `asc \| desc` | `?sortDir=asc` |

---

#### `POST /api/todos`
สร้าง todo ใหม่

```json
{
  "title": "Buy groceries",          // required
  "description": "Milk, eggs, ...",  // optional
  "priority": "medium",              // optional, default: "medium"
  "tagIds": ["tag_id_1"],            // optional
  "dueDate": "2024-12-31",           // optional, YYYY-MM-DD
  "subtasks": [                      // optional
    { "title": "Buy milk" }
  ]
}
```

---

#### `GET /api/todos/:id`
ดึง todo เดียวตาม ID

---

#### `PUT /api/todos/:id`
Update todo (ส่งเฉพาะ field ที่ต้องการเปลี่ยน)

```json
{
  "title": "Updated title",
  "priority": "high",
  "dueDate": "2024-12-25"
}
```

---

#### `PATCH /api/todos/:id/status`
เปลี่ยน status เร็วๆ (เหมาะสำหรับ checkbox / kanban drag)

```json
{ "status": "done" }
```
> เมื่อ status เป็น `"done"` จะ set `completedAt` อัตโนมัติ

---

#### `PATCH /api/todos/reorder`
บันทึก order หลัง drag-and-drop

```json
{
  "items": [
    { "id": "todo_1", "order": 0 },
    { "id": "todo_2", "order": 1 }
  ]
}
```

---

#### `DELETE /api/todos/:id`
ลบ todo → returns `204 No Content`

---

### Tags

#### `GET /api/tags`
ดึง tags ทั้งหมด

#### `POST /api/tags`
```json
{ "name": "Work", "color": "#3B82F6" }
```

#### `GET /api/tags/:id`
#### `PUT /api/tags/:id`
```json
{ "name": "Personal", "color": "#10B981" }
```

#### `DELETE /api/tags/:id`
ลบ tag + cascade ลบ tagId ออกจาก todos ทั้งหมดด้วย → `204 No Content`

---

### Utility

#### `GET /health`
Health check

#### `GET /api/export`
Export ข้อมูลทั้งหมดเป็น JSON file (ใช้ restore ข้อมูล)

---

## Data Schema (db.json)

```json
{
  "version": 1,
  "todos": [
    {
      "id": "V1StGXR8_Z5jdHi6B-myT",
      "title": "Buy groceries",
      "description": null,
      "status": "pending",
      "priority": "medium",
      "tagIds": [],
      "subtasks": [],
      "dueDate": "2024-12-31",
      "order": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": null
    }
  ],
  "tags": [
    {
      "id": "abc123",
      "name": "Work",
      "color": "#3B82F6",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Error Codes

| Code | HTTP | ความหมาย |
|---|---|---|
| `VALIDATION_ERROR` | 400 | ข้อมูลที่ส่งมาไม่ถูกต้อง |
| `TODO_NOT_FOUND` | 404 | ไม่พบ todo |
| `TAG_NOT_FOUND` | 404 | ไม่พบ tag |
| `NOT_FOUND` | 404 | Route ไม่มีอยู่ |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |