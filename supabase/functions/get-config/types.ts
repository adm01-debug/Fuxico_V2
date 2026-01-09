/**
 * Get Config Types
 */
export interface ConfigRequest { userId?: string; keys?: string[]; }
export interface AppConfig { trackingEnabled: boolean; notificationsEnabled: boolean; defaultLanguage: string; timezone: string; features: Record<string, boolean>; }
export interface ConfigResponse { success: boolean; data?: AppConfig; error?: string; }
