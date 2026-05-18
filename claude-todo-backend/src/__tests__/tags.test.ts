import request from "supertest";
import app from "../app.js";
import { makeToken } from "./helpers.js";

const auth = { Authorization: `Bearer ${makeToken()}` };

describe("Tag routes", () => {
  it("returns 401 without auth", async () => {
    expect((await request(app).get("/api/tags")).status).toBe(401);
  });

  let id: string;

  it("creates a tag", async () => {
    const res = await request(app)
      .post("/api/tags")
      .set(auth)
      .send({ name: "work", color: "#6366f1" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("work");
    id = res.body.data.id;
  });

  it("lists tags", async () => {
    const res = await request(app).get("/api/tags").set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("updates a tag", async () => {
    const res = await request(app)
      .put(`/api/tags/${id}`)
      .set(auth)
      .send({ name: "personal", color: "#10b981" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("personal");
  });

  it("prevents duplicate tag name for same user", async () => {
    await request(app).post("/api/tags").set(auth).send({ name: "unique", color: "#ffffff" });
    const res = await request(app)
      .post("/api/tags")
      .set(auth)
      .send({ name: "unique", color: "#000000" });
    expect(res.status).toBe(409);
  });

  it("deletes a tag", async () => {
    expect((await request(app).delete(`/api/tags/${id}`).set(auth)).status).toBe(204);
  });
});
