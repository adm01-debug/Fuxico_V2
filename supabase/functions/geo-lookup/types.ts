/**
 * Geo Lookup Types
 */
export interface GeoRequest { ip: string; }
export interface GeoData { ip: string; country: string; countryCode: string; region: string; city: string; latitude: number; longitude: number; timezone: string; isp?: string; }
export interface GeoResponse { success: boolean; data?: GeoData; error?: string; }
