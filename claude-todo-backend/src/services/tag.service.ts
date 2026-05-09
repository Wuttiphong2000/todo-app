import { nanoid } from "nanoid";
import { storageService } from "./storage.service.js";
import type { Tag, CreateTagDto, UpdateTagDto } from "../types/index.js";
 
class TagService {
  findAll(): Tag[] {
    return storageService.getDb().tags;
  }
 
  findById(id: string): Tag | undefined {
    return storageService.getDb().tags.find((t) => t.id === id);
  }
 
  create(dto: CreateTagDto): Tag {
    const db = storageService.getDb();
 
    const tag: Tag = {
      id: nanoid(),
      name: dto.name,
      color: dto.color,
      createdAt: new Date().toISOString(),
    };
 
    db.tags.push(tag);
    storageService.save(db);
    return tag;
  }
 
  update(id: string, dto: UpdateTagDto): Tag | undefined {
    const db = storageService.getDb();
    const index = db.tags.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
 
    db.tags[index] = { ...db.tags[index], ...dto };
    storageService.save(db);
    return db.tags[index];
  }
 
  delete(id: string): boolean {
    const db = storageService.getDb();
    const before = db.tags.length;
 
    db.tags = db.tags.filter((t) => t.id !== id);
 
    // cascade: ลบ tagId ออกจาก todos ทุกตัวด้วย
    db.todos = db.todos.map((todo) => ({
      ...todo,
      tagIds: todo.tagIds.filter((tid) => tid !== id),
    }));
 
    if (db.tags.length === before) return false;
    storageService.save(db);
    return true;
  }
}
 
export const tagService = new TagService();
 