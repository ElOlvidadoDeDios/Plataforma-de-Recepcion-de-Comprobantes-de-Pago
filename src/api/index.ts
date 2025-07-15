// Re-exportar todo desde userApi, paymentsApi y creditRequestApi
export * from './userApi';
export * from './consultaCuotasApi';
export * from './paymentsApi';
export * from './creditRequestApi';
export * from './creditAttentionApi';
export * from './customerConsultationAPI';

// Exportaciones específicas adicionales
export { fetchCreditAnalysts, fetchAllExternalUsers } from './userApi';
export type { AnalistaByAgencia, AdministradorInfo } from './creditAttentionApi';