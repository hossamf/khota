export type AppRole = "student" | "teacher" | "parent" | "admin";

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string | null;
  grade_id: string | null;
  created_at: string;
}
