# Todo Frontend

React + Vite + TypeScript + TailwindCSS

## Tech Stack

| Package | หน้าที่ |
|---|---|
| `react` + `react-dom` | UI Framework |
| `react-router-dom` v6 | Client-side routing |
| `zustand` | Global state management |
| `axios` | HTTP client |
| `tailwindcss` | Utility-first CSS |
| `nanoid` | ID generation (subtasks) |
| `vite` | Build tool |

---

## Setup

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. รัน dev (ต้องรัน backend ที่ port 3000 ก่อน)
npm run dev

# 3. Build production
npm run build
```

> Vite proxy `/api/*` → `http://localhost:3000` อัตโนมัติ ไม่ต้องกังวล CORS ในช่วง dev

---

## Project Structure

```
src/
├── main.tsx                  # Entry point
├── App.tsx                   # Router + AppShell
├── index.css                 # Tailwind directives + global styles
│
├── types/
│   └── index.ts              # TypeScript types (mirrors backend)
│
├── api/
│   ├── client.ts             # Axios instance + interceptors
│   ├── todo.api.ts           # Todo CRUD API calls
│   └── tag.api.ts            # Tag API calls
│
├── store/
│   └── todo.store.ts         # Zustand store (todos + tags)
│
├── hooks/
│   └── useLocalSync.ts       # Sync store ↔ localStorage
│
├── components/
│   ├── Navbar.tsx            # Top navigation
│   ├── TodoCard.tsx          # Todo list item (inline status toggle)
│   ├── TodoForm.tsx          # Shared form (Add + Edit)
│   ├── FilterBar.tsx         # Search + Filter controls
│   └── ConfirmDialog.tsx     # Delete confirmation modal
│
├── pages/
│   ├── HomePage.tsx          # / — Todo list + stats
│   ├── AddTodoPage.tsx       # /add — สร้าง todo ใหม่
│   └── EditTodoPage.tsx      # /edit/:id — แก้ไข todo
│
└── utils/
    └── index.ts              # Helpers, constants, cn()
```

---

## Pages

| Path | Component | หน้าที่ |
|---|---|---|
| `/` | HomePage | แสดง todo list พร้อม filter/search/stats |
| `/add` | AddTodoPage | Form สร้าง todo ใหม่ |
| `/edit/:id` | EditTodoPage | Form แก้ไข todo + ปุ่มลบ |

---

## Color Palette (Dark Theme)

| Token | Hex | ใช้สำหรับ |
|---|---|---|
| `surface-950` | `#0d0f14` | Darkest background |
| `surface-900` | `#13161d` | Page background |
| `surface-800` | `#1a1e28` | Card background |
| `surface-700` | `#222738` | Input / elevated |
| `accent` | `#e8a045` | Primary action, checkbox |
| Priority High | `#e05a5a` | Red badge |
| Priority Medium | `#e8a045` | Amber badge |
| Priority Low | `#6b7bab` | Blue badge |

---

## Features

- ✅ **Optimistic updates** — UI update ทันทีก่อน API response
- ✅ **localStorage cache** — ทำงานได้แม้ offline ชั่วคราว
- ✅ **Delete confirmation** — modal ยืนยันก่อนลบทุกครั้ง
- ✅ **Filter & Search** — filter ตาม status, priority, ค้นหาด้วย text
- ✅ **Tags** — สร้าง tag + เลือก color ได้ inline
- ✅ **Subtasks** — เพิ่ม/ลบ subtask ใน form
- ✅ **Due date** — แสดง overdue warning อัตโนมัติ
- ✅ **Responsive** — ใช้งานได้ทั้ง mobile/desktop