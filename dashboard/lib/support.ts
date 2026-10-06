export type TicketStatus = "In Progress" | "Open" | "Resolved";
export type TicketType = "Account" | "Technical" | "Billing" | "Compliance";
export type TicketPriority = "High" | "Medium" | "Low";
export type RequesterType = "user" | "vendor";

export type ConversationMessage = {
  sender: "agent" | "user";
  text: string;
  time: string;
  name?: string;
};

export type SupportTicket = {
  id: string;
  requesterType: RequesterType;
  userName: string;
  userEmail: string;
  userRole: "User" | "Provider";
  avatar: string;
  type: TicketType;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  openedAt: string;
  updatedAt: string;
  issueDetails: string;
  conversation: ConversationMessage[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value ? value : fallback;
}

/** Backend ticket (snake_case, from /platform-admin/support/tickets) -> dashboard ticket. */
export function mapSupportTicket(input: unknown): SupportTicket {
  const record = asRecord(input);
  const requesterType: RequesterType = record.requester_type === "vendor" ? "vendor" : "user";
  const conversation = Array.isArray(record.conversation) ? record.conversation : [];
  return {
    id: asString(record.id),
    requesterType,
    userName: asString(record.user_name, requesterType === "vendor" ? "Service provider" : "Customer"),
    userEmail: asString(record.user_email),
    userRole: requesterType === "vendor" ? "Provider" : "User",
    avatar: asString(record.avatar),
    type: asString(record.type, "Technical") as TicketType,
    subject: asString(record.subject),
    status: asString(record.status, "Open") as TicketStatus,
    priority: asString(record.priority, "Medium") as TicketPriority,
    openedAt: asString(record.opened_at),
    updatedAt: asString(record.updated_at),
    issueDetails: asString(record.issue_details),
    conversation: conversation.map((item) => {
      const row = asRecord(item);
      return {
        sender: row.sender === "agent" ? "agent" : "user",
        text: asString(row.text),
        time: asString(row.time),
        name: asString(row.name),
      };
    }),
  };
}
