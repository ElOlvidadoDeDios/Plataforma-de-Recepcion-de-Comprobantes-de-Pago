// Utilidad para manejar sesiones múltiples en el mismo navegador
export class SessionManager {
  private static sessionId: string | null = null;
  
  // Generar un ID único para la sesión actual
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Obtener o crear el ID de sesión para esta pestaña
  public static getSessionId(): string {
    if (!this.sessionId) {
      // Primero intentar obtener de sessionStorage (específico de la pestaña)
      this.sessionId = sessionStorage.getItem('current_session_id');
      
      if (!this.sessionId) {
        // Si no existe, crear uno nuevo
        this.sessionId = this.generateSessionId();
        sessionStorage.setItem('current_session_id', this.sessionId);
      }
    }
    return this.sessionId;
  }
  
  // Obtener clave única para esta sesión
  private static getSessionKey(key: string): string {
    return `${key}_${this.getSessionId()}`;
  }
  
  // Establecer item en localStorage con clave única de sesión
  public static setItem(key: string, value: string): void {
    const sessionKey = this.getSessionKey(key);
    localStorage.setItem(sessionKey, value);
    
    // También mantener una lista de sesiones activas
    this.addToActiveSessions(key);
  }
  
  // Obtener item del localStorage usando clave única de sesión
  public static getItem(key: string): string | null {
    const sessionKey = this.getSessionKey(key);
    return localStorage.getItem(sessionKey);
  }
  
  // Remover item del localStorage usando clave única de sesión
  public static removeItem(key: string): void {
    const sessionKey = this.getSessionKey(key);
    localStorage.removeItem(sessionKey);
    this.removeFromActiveSessions(key);
  }
  
  // Limpiar solo la sesión actual
  public static clearCurrentSession(): void {
    const sessionId = this.getSessionId();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.endsWith(`_${sessionId}`)) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar sessionStorage también
    sessionStorage.clear();
    this.sessionId = null;
  }
  
  // Agregar sesión a la lista de sesiones activas
  private static addToActiveSessions(key: string): void {
    const activeSessions = this.getActiveSessions(key);
    const sessionId = this.getSessionId();
    
    if (!activeSessions.includes(sessionId)) {
      activeSessions.push(sessionId);
      localStorage.setItem(`active_sessions_${key}`, JSON.stringify(activeSessions));
    }
  }
  
  // Remover sesión de la lista de sesiones activas
  private static removeFromActiveSessions(key: string): void {
    const activeSessions = this.getActiveSessions(key);
    const sessionId = this.getSessionId();
    const index = activeSessions.indexOf(sessionId);
    
    if (index > -1) {
      activeSessions.splice(index, 1);
      localStorage.setItem(`active_sessions_${key}`, JSON.stringify(activeSessions));
    }
  }
  
  // Obtener lista de sesiones activas para una clave
  private static getActiveSessions(key: string): string[] {
    const stored = localStorage.getItem(`active_sessions_${key}`);
    return stored ? JSON.parse(stored) : [];
  }
  
  // Obtener todas las sesiones activas (para debugging)
  public static getAllActiveSessions(): { [key: string]: string[] } {
    const result: { [key: string]: string[] } = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('active_sessions_')) {
        const sessionKey = key.replace('active_sessions_', '');
        result[sessionKey] = this.getActiveSessions(sessionKey);
      }
    });
    
    return result;
  }
  
  // Limpiar sesiones inactivas (opcional, para mantenimiento)
  public static cleanupInactiveSessions(): void {
    const allSessions = this.getAllActiveSessions();
    
    Object.keys(allSessions).forEach(key => {
      const sessions = allSessions[key];
      const validSessions: string[] = [];
      
      sessions.forEach(sessionId => {
        const sessionKey = `${key}_${sessionId}`;
        if (localStorage.getItem(sessionKey)) {
          validSessions.push(sessionId);
        }
      });
      
      localStorage.setItem(`active_sessions_${key}`, JSON.stringify(validSessions));
    });
  }
}