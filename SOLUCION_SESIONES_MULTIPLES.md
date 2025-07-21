# Solución para Manejo de Sesiones Múltiples

## Problema Identificado

El sistema tenía un problema con el manejo de sesiones múltiples en el mismo navegador. Cuando un usuario iniciaba sesión con varias cuentas en diferentes pestañas del mismo navegador, al actualizar la página solo quedaba activa la última cuenta que había iniciado sesión.

### Causa del Problema

1. **localStorage compartido**: Todas las pestañas del mismo navegador comparten el mismo `localStorage`
2. **Sobreescritura de datos**: Cada nuevo login ejecutaba `localStorage.clear()` borrando todas las sesiones anteriores
3. **Claves fijas**: Se usaban las mismas claves (`token`, `user`) para todas las sesiones

## Solución Implementada

### 1. SessionManager - Gestión de Sesiones por Pestaña

Se creó una clase `SessionManager` en `src/utils/sessionManager.ts` que:

- **Genera ID único por pestaña**: Cada pestaña/sesión tiene un identificador único
- **Usa sessionStorage**: Para almacenar el ID de sesión específico de cada pestaña
- **Claves únicas en localStorage**: Combina las claves originales con el ID de sesión

#### Características del SessionManager:

```typescript
// Genera claves únicas como: token_session_1642234567890_abc123456
SessionManager.setItem('token', tokenValue);
SessionManager.getItem('token'); // Obtiene el token de la sesión actual
SessionManager.clearCurrentSession(); // Solo limpia la sesión actual
```

### 2. Archivos Modificados

#### Contexto de Autenticación
- **`src/contexts/AuthContext.tsx`**: Actualizado para usar SessionManager en lugar de localStorage directo

#### Componente de Login
- **`src/components/Login.tsx`**: 
  - Reemplazado `localStorage.clear()` con `SessionManager.clearCurrentSession()`
  - Usa SessionManager para guardar el token

#### APIs Actualizadas
- **`src/api/paymentsApi.ts`**: Función `getToken()` usa SessionManager
- **`src/api/userApi.ts`**: Funciones de token y manejo de errores 403
- **`src/api/creditAttentionApi.ts`**: Interceptor de requests
- **`src/api/consultaCuotasApi.ts`**: Headers de autorización
- **`src/api/creditRequestApi.ts`**: Función `getToken()`
- **`src/api/desembolsosApi.ts`**: Headers de autorización

### 3. Beneficios de la Solución

#### ✅ Sesiones Independientes
- Cada pestaña mantiene su propia sesión
- No hay interferencia entre diferentes cuentas
- Las actualizaciones de página mantienen la sesión correcta

#### ✅ Compatibilidad
- No rompe funcionalidad existente
- Transparente para el usuario final
- Mantiene la misma experiencia de usuario

#### ✅ Limpieza Automática
- Sesiones se limpian automáticamente al cerrar pestañas
- Función opcional de limpieza de sesiones inactivas

### 4. Cómo Funciona

1. **Primera vez**: SessionManager genera un ID único para la pestaña
2. **Almacenamiento**: Los datos se guardan con claves únicas (`token_sessionId`, `user_sessionId`)
3. **Recuperación**: Solo se acceden a los datos de la sesión actual
4. **Limpieza**: Al cerrar pestaña, sessionStorage se limpia automáticamente

### 5. Mantenimiento

#### Verificar Sesiones Activas (Debug)
```typescript
// En consola del navegador para debugging
SessionManager.getAllActiveSessions();
```

#### Limpiar Sesiones Inactivas
```typescript
// Opcional, para mantenimiento
SessionManager.cleanupInactiveSessions();
```

## Resultado

✅ **Problema Solucionado**: Ahora es posible tener múltiples sesiones activas en el mismo navegador sin que se interfieran entre sí.

✅ **Experiencia Mejorada**: Los usuarios pueden trabajar con diferentes cuentas simultáneamente en pestañas separadas.

✅ **Estabilidad**: No más pérdida de sesión al actualizar páginas.