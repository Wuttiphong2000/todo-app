import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/auth.store";

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null, loading: false, error: null });
});

describe("logout", () => {
  it("clears token, user, and localStorage", () => {
    useAuthStore.setState({ token: "tok", user: { id: "1", username: "test" } });
    localStorage.setItem("auth_token", "tok");
    localStorage.setItem("auth_user", JSON.stringify({ id: "1", username: "test" }));

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });
});

describe("hydrate", () => {
  it("does nothing when localStorage is empty", () => {
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("clears state for an expired token", () => {
    // payload: { id:"1", username:"test", exp:1 } — expired in 1970
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
      ".eyJpZCI6IjEiLCJ1c2VybmFtZSI6InRlc3QiLCJleHAiOjF9" +
      ".fakesig";
    localStorage.setItem("auth_token", expiredToken);
    localStorage.setItem("auth_user", JSON.stringify({ id: "1", username: "test" }));

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("restores state for a valid token", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ id: "1", username: "test", exp: futureExp }));
    const validToken = `eyJhbGciOiJIUzI1NiJ9.${payload}.fakesig`;
    const user = { id: "1", username: "test" };
    localStorage.setItem("auth_token", validToken);
    localStorage.setItem("auth_user", JSON.stringify(user));

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().token).toBe(validToken);
    expect(useAuthStore.getState().user).toEqual(user);
  });
});
