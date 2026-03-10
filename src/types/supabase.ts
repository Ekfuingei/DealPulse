export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      deals: {
        Row: {
          id: string;
          title: string;
          company: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          stage: string;
          value: number | null;
          currency: string | null;
          channel: string;
          last_activity_at: string | null;
          source_id: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deals"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      agent_activities: {
        Row: {
          id: string;
          deal_id: string;
          type: string;
          channel: string;
          content: string | null;
          status: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_activities"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_activities"]["Insert"]>;
      };
    };
  };
}
