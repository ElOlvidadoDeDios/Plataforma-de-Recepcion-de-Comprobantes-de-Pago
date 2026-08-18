# 📱 Módulo de Conversaciones de WhatsApp

## 📋 Descripción

Este módulo permite visualizar y gestionar el historial completo de conversaciones de WhatsApp con los clientes. Implementa una interfaz tipo WhatsApp Web con scroll infinito y actualización en tiempo real.

---

## 📂 Estructura de Archivos

```
whatsapp_conversations/
├── WhatsAppConversations.tsx      # Componente principal
├── hooks/
│   ├── index.ts                   # Exportaciones de hooks
│   ├── useNumerosActivos.ts       # Hook para lista de números
│   └── useConversacion.ts         # Hook para mensajes con scroll infinito
├── services/                       # (Reservado para servicios futuros)
└── README.md                       # Este archivo
```

---

## 🎯 Características Implementadas

✅ **Lista de Conversaciones Activas**
- Muestra todos los números con conversaciones
- Búsqueda en tiempo real por número
- Indicador visual de conversación seleccionada

✅ **Vista de Chat Individual**
- Diseño tipo WhatsApp Web
- Mensajes entrantes (izquierda) y salientes (derecha)
- Timestamps formateados (Hoy, Ayer, fecha completa)

✅ **Scroll Infinito**
- Carga inicial de 50 mensajes más recientes
- Botón para cargar mensajes anteriores
- Paginación basada en timestamps (más eficiente)

✅ **Estadísticas**
- Total de mensajes
- Mensajes recibidos vs enviados
- Último mensaje

✅ **Control de Permisos**
- Validación con `Permission.WHATSAPP_CONVERSATIONS_VIEW`
- Página de acceso denegado para usuarios sin permisos

---

## 🔌 APIs Utilizadas

### Backend Endpoints:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/mensajes-whatsapp/numeros-activos` | Lista de números con conversaciones |
| GET | `/mensajes-whatsapp/scroll` | Mensajes con scroll infinito |
| GET | `/mensajes-whatsapp/conversacion/:number` | Conversación específica |
| GET | `/mensajes-whatsapp/estadisticas/:number` | Estadísticas de un número |

### Servicio API: `src/api/mensajesWhatsappApi.ts`

Funciones exportadas:
- `getMensajesPorPagina(params)` - Paginación tradicional
- `getMensajesConScroll(params)` - Scroll infinito (recomendado)
- `getConversacion(number, params)` - Conversación específica
- `getNumerosActivos()` - Lista de números
- `getEstadisticasNumero(number)` - Estadísticas

---

## 🪝 Hooks Personalizados

### `useNumerosActivos()`

Obtiene y gestiona la lista de números activos.

```typescript
const { numeros, loading, error, refetch } = useNumerosActivos();
```

**Retorna:**
- `numeros`: Array de strings con los números
- `loading`: Estado de carga
- `error`: Mensaje de error si existe
- `refetch`: Función para recargar

---

### `useEstadisticasNumero(number)`

Obtiene estadísticas de un número específico.

```typescript
const { estadisticas, loading, error, refetch } = useEstadisticasNumero('51926199554');
```

**Retorna:**
- `estadisticas`: Objeto con stats del número
- `loading`: Estado de carga
- `error`: Mensaje de error
- `refetch`: Función para recargar

---

### `useConversacion(number, limit)`

Hook principal para manejar mensajes con scroll infinito.

```typescript
const {
  mensajes,
  loading,
  error,
  hasMore,
  loadMore,
  loadNewer,
  refetch,
  pagination
} = useConversacion('51926199554', 50);
```

**Parámetros:**
- `number`: Número de WhatsApp (null para no cargar)
- `limit`: Cantidad de mensajes por carga (default: 50)

**Retorna:**
- `mensajes`: Array de mensajes
- `loading`: Estado de carga
- `error`: Mensaje de error
- `hasMore`: Booleano si hay más mensajes antiguos
- `loadMore()`: Cargar mensajes más antiguos (scroll hacia arriba)
- `loadNewer()`: Cargar mensajes más nuevos (para actualizar)
- `refetch()`: Recargar todo desde cero
- `pagination`: Info de paginación (total, count, timestamps)

---

## 🎨 Componente Principal

### `WhatsAppConversations.tsx`

```tsx
import WhatsAppConversations from './components/whatsapp_conversations/WhatsAppConversations';

// Uso en router
<Route path="/whatsapp-conversations" element={<WhatsAppConversations />} />
```

**Características del UI:**

1. **Layout de 2 columnas**
   - Sidebar (33%): Lista de conversaciones
   - Área principal (67%): Chat seleccionado

2. **Sidebar**
   - Header con contador de conversaciones activas
   - Barra de búsqueda en tiempo real
   - Lista scrolleable de números
   - Avatar circular con últimos 2 dígitos
   - Indicador visual de selección

3. **Área de Chat**
   - Header con número y estadísticas
   - Fondo con patrón de WhatsApp
   - Burbujas de mensaje (verde=enviado, blanco=recibido)
   - Botón "Cargar mensajes anteriores"
   - Contador de mensajes cargados

4. **Estado Vacío**
   - Icono de chat
   - Mensaje instructivo
   - Se muestra cuando no hay número seleccionado

---

## 📦 Tipos e Interfaces

### `Mensaje`
```typescript
interface Mensaje {
  _id: string;
  messageId: string;
  number: string;
  direction: 'inbound' | 'outbound';
  type: string;
  body: string;
  timestamp: number;
  createdAt: string;
}
```

### `EstadisticasNumero`
```typescript
interface EstadisticasNumero {
  number: string;
  totalMensajes: number;
  mensajesRecibidos: number;
  mensajesEnviados: number;
  ultimoMensaje: Mensaje | null;
}
```

### `PaginationInfo`
```typescript
interface PaginationInfo {
  total: number;
  count: number;
  limit: number;
  hasMore: boolean;
  oldestTimestamp?: number;
  newestTimestamp?: number;
}
```

---

## 🚀 Cómo Usar

### 1. Configurar Variables de Entorno

```env
# Backend
VITE_API_BASE_URL=http://localhost:3032

# Backend debe tener configurado:
MONGODB_MENSAJES_URI=mongodb://192.168.3.206:27017/mensajes_chat_bot_2
```

### 2. Agregar Permiso al Usuario

Asegúrate de que el permiso `WHATSAPP_CONVERSATIONS_VIEW` esté asignado al usuario.

### 3. Navegar a la Ruta

```
/whatsapp-conversations
```

---

## 🔧 Flujo de Datos

```
Usuario selecciona número
    ↓
useConversacion() se activa
    ↓
getMensajesConScroll() llama al backend
    ↓
Backend consulta MongoDB (mensajes_chat_bot_2.messages)
    ↓
Retorna mensajes más recientes (limit: 50)
    ↓
Se muestran en el chat
    ↓
Usuario scrollea hacia arriba
    ↓
loadMore() carga mensajes anteriores usando beforeTimestamp
    ↓
Se agregan al final del array
```

---

## 🎯 Mejoras Futuras

- [ ] Auto-refresh de mensajes nuevos (polling o websockets)
- [ ] Envío de mensajes desde la plataforma
- [ ] Filtros por fecha/tipo de mensaje
- [ ] Búsqueda de texto dentro de conversaciones
- [ ] Exportar conversaciones a PDF/Excel
- [ ] Plantillas de respuestas rápidas
- [ ] Integración con datos de clientes (DNI, nombre)
- [ ] Notificaciones de mensajes nuevos
- [ ] Marcar conversaciones como leídas/pendientes

---

## 🐛 Troubleshooting

### "No se cargan los números"
- Verifica que el backend esté corriendo
- Revisa el `VITE_API_BASE_URL` en `.env`
- Verifica el token de autenticación

### "Error al cargar mensajes"
- Verifica la configuración de MongoDB en el backend
- Asegúrate de que existe la BD `mensajes_chat_bot_2` con la colección `messages`
- Revisa los logs del backend

### "Acceso Denegado"
- Verifica que el usuario tenga el permiso `WHATSAPP_CONVERSATIONS_VIEW`
- Contacta al administrador para solicitar acceso

---

## 📝 Notas Técnicas

- **Paginación**: Usa timestamps en lugar de páginas para mejor performance
- **Orden de mensajes**: Backend retorna descendente (más recientes primero), frontend los invierte para mostrar arriba
- **Scroll**: Se hace scroll automático al final al seleccionar una conversación
- **Loading states**: Se muestran spinners durante las cargas
- **Error handling**: Todos los errores se manejan y se muestran al usuario

---

## 👥 Contribuir

Para agregar nuevas características:

1. Crear nuevos hooks en `hooks/`
2. Agregar funciones API en `src/api/mensajesWhatsappApi.ts`
3. Actualizar el componente principal según necesidad
4. Documentar cambios en este README

---

✅ **Módulo completamente funcional y listo para usar!**
