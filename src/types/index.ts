export type DealStage =
  | "lead"
  | "qualifying"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type Channel = "hubspot" | "whatsapp" | "email" | "messenger" | "instagram";

export interface Deal {
  id: string;
  title: string;
  company?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  stage: DealStage;
  value?: number;
  currency?: string;
  channel: Channel;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
  sourceId?: string; // CRM/WhatsApp ID
  metadata?: Record<string, unknown>;
}

export interface AgentActivity {
  id: string;
  dealId: string;
  type: "research" | "draft" | "approval_sent" | "message_sent" | "logged";
  channel: Channel;
  content?: string;
  status: "pending" | "approved" | "rejected" | "sent";
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineColumn {
  stage: DealStage;
  label: string;
  deals: Deal[];
}
