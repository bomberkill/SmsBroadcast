export type FieldType =
  | "text"
  | "phoneNumber"
  | "email"
  | "number"
  | "date"
  | "select";

export type UserTier = 'free' | 'premium' | 'pro';

/**
 * Defines a single field inside a ContactSchema
 */
export interface SchemaField {
  id: string;                    // Internal immutable ID
  name: string;                  // Human-friendly display label
  type: FieldType;
  options?: string[];            // Only for select
  isPrimaryPhone?: boolean;      // Used for SMS sending
  isDisplayName?: boolean;       // Used as main display name
  isRequired?: boolean;          // Field must be filled
}

/**
 * Defines a template for contacts.
 */
export interface ContactSchema {
  id: string;
  name: string;
  fields: SchemaField[];
  createdAt: string;
  synced?: boolean;
}

/**
 * Internal representation of a Contact.
 * Data keys are based on SchemaField.id
 */
export interface Contact {
  id: string;                             // Unique contact ID
  contactSchemaId: string;                // Link to the schema
  data: Record<string, any>;              // {"fld_1": "John", "fld_2": "650000000"}
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

/**
 * ContactList now stores only IDs of contacts
 */
export interface ContactList {
  id: string;
  name: string;
  contactSchemaId: string;                // All contacts follow this schema
  contactIds: string[];                   // Only IDs, not full objects
  createdAt: string;
  synced?: boolean;
}

/**
 * Groups also reference contacts by ID
 */
export interface Group {
  id: string;
  groupName: string;
  contactListId: string;                  // Each group belongs to a list
  memberIds: string[];                    // IDs of contacts
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface MessageRecipient {
  phoneNumber: string;
  status: "pending" | "sent" | "failed" | "delivered" | "scheduled";
  timestamp?: string; // When the status changed
  errorCode?: string; // Android-specific error reason
  personalizedMessage?: string; // The actual message sent (with placeholders replaced)
}

export interface Message {
  id: string;
  groupId: string;
  message: string;
  timestamp: string;
  scheduledAt?: string; // ISO timestamp for scheduled delivery
  subscriptionId?: number | null; // Selected SIM for this message
  // Global status derived from recipients
  status: "sending" | "sent" | "partial" | "failed" | "scheduled";
  type: "SMS" | "WHATSAPP" | "EMAIL";
  recipients: MessageRecipient[];
  senderId?: string;
  synced?: boolean;
}

export interface SubscriptionSnapshot {
  tier: "free" | "premium" | "pro";
  expiresAt: string;
  signature: string;
}

export interface User {
  id: string;
  email?: string;
  displayName: string;
  createdAt: string;
  lastSyncAt: string | null;
  isGuest: boolean;
  deviceId: string;
}