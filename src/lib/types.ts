export type ProfileRole = "admin" | "customer";

export interface ReserveProfile {
  id: string;
  email: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface ReserveSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by: string | null;
  created_at: string;
}

export interface ReserveSlotWithBooker extends ReserveSlot {
  booker_email?: string | null;
}
