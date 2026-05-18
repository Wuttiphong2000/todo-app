import jwt from "jsonwebtoken";
import { USERS } from "../config/users.js";

export const testUser = USERS[0];

export function makeToken(user = testUser) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
}
