import request from "supertest";
import app from "../app.js";
import { makeToken } from "./helpers.js";

const auth = { Authorization: `Bearer ${makeToken()}` };

describe("Todo routes", () => {
  it("returns 401 without auth", async () => {
    expect((await request(app).get("/api/todos")).status).toBe(401);
  });

  it("returns 400 for missing title on create", async () => {
    const res = await request(app).post("/api/todos").set(auth).send({ priority: "high" });
    expect(res.status).toBe(400);
  });

  let id: string;

  it("creates a todo", async () => {
    const res = await request(app)
      .post("/api/todos")
      .set(auth)
      .send({ title: "Buy groceries", priority: "low" });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Buy groceries");
    id = res.body.data.id;
  });

  it("lists todos", async () => {
    const res = await request(app).get("/api/todos").set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("gets todo by id", async () => {
    const res = await request(app).get(`/api/todos/${id}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it("updates a todo", async () => {
    const res = await request(app)
      .put(`/api/todos/${id}`)
      .set(auth)
      .send({ title: "Buy milk", priority: "high", subtasks: [], tagIds: [] });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Buy milk");
  });

  it("patches todo status", async () => {
    const res = await request(app)
      .patch(`/api/todos/${id}/status`)
      .set(auth)
      .send({ status: "done" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("done");
  });

  it("deletes a todo", async () => {
    expect((await request(app).delete(`/api/todos/${id}`).set(auth)).status).toBe(204);
  });

  it("returns 404 for deleted todo", async () => {
    expect((await request(app).get(`/api/todos/${id}`).set(auth)).status).toBe(404);
  });
});
