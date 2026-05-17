// Hardcoded users — no registration. Passwords stored as bcrypt hashes (rounds=12).
export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
}

export const USERS: AppUser[] = [
  {
    id: "nxmpexng",
    username: "nxmpexng",
    passwordHash: "$2b$12$8.HjLTIJ3dE6chOrDuYGluMeNrkrTZG/cGVnHzSwduk/kye/sl9f6",
  },
  {
    id: "wskt",
    username: "wskt",
    passwordHash: "$2b$12$gZ4S13g0rEqwAWV0svzMPOikZ3U66J1YauJuKgQIxY61BLiP.qFEe",
  },
];

export const JWT_SECRET =
  process.env.JWT_SECRET ?? "doable_app_jwt_secret_2026_change_in_prod";

export const JWT_EXPIRES_IN = "30d";
