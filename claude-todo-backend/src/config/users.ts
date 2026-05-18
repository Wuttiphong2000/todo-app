// Hardcoded users — no registration. Passwords stored as bcrypt hashes (rounds=12).
export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
}

export const USERS: AppUser[] = [
  {
    id: "VKzQn9mXpR2",
    username: "nxmpexng",
    passwordHash: "$2b$12$8.HjLTIJ3dE6chOrDuYGluMeNrkrTZG/cGVnHzSwduk/kye/sl9f6",
  },
  {
    id: "Hs7wLdTfYc4",
    username: "wskt",
    passwordHash: "$2b$12$gZ4S13g0rEqwAWV0svzMPOikZ3U66J1YauJuKgQIxY61BLiP.qFEe",
  },
];

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
export const JWT_SECRET = process.env.JWT_SECRET;

export const JWT_EXPIRES_IN = "30d";
