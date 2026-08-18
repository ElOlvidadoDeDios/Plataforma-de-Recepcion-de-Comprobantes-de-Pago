# WhatsApp Conversations - Visualización de Imágenes

## Descripción
Este módulo permite visualizar las conversaciones de WhatsApp con soporte completo para imágenes almacenadas en S3.

## Características Implementadas

### 1. Componente WhatsAppImage
- **Ubicación**: `src/components/whatsapp_conversations/components/WhatsAppImage.tsx`
- **Función**: Obtener y mostrar imágenes desde S3 usando la API de MongoDB
- **API utilizada**: `/api_mongo_firm_easy/api/get_voucher_pay`

**Características**:
- ✅ Carga asíncrona de URLs de S3
- ✅ Estados de carga y error con UI apropiada
- ✅ Optimización de carga con lazy loading
- ✅ Click para abrir imagen en nueva pestaña
- ✅ Manejo de errores con iconos descriptivos

### 2. Visualización en Chat
El componente `WhatsAppConversations` ahora detecta mensajes de tipo `"image"` y los renderiza usando `WhatsAppImage`.

**Flujo**:
```typescript
if (mensaje.type === 'image') {
  // Mostrar WhatsAppImage con mensaje.body como ruta
} else {
  // Mostrar mensaje de texto normal
}
```

### 3. Cambios de Diseño

#### Colores Actualizados (Verde → Gris/Plomo)
- **Antes**: Fondo verde (`bg-green-500`) con texto blanco
- **Ahora**: Fondo gris/plomo (`bg-gray-400`) con texto negro (`text-gray-900`)

**Elementos actualizados**:
- ✅ Header del sidebar (de `bg-green-600` a `bg-gray-600`)
- ✅ Burbujas de mensajes outbound (de `bg-green-500 text-white` a `bg-gray-400 text-gray-900`)
- ✅ Avatares de usuarios (de `bg-green-600` a `bg-gray-600`)
- ✅ Botones de carga (de `bg-green-600` a `bg-gray-600`)
- ✅ Spinners de carga (de `border-green-600` a `border-gray-600`)
- ✅ Focus de input de búsqueda (de `focus:ring-green-500` a `focus:ring-gray-500`)
- ✅ Estado seleccionado en sidebar (de `bg-green-50 border-l-green-600` a `bg-gray-100 border-l-gray-600`)

## Uso

### Requisitos de Variables de Entorno
```env
VITE_API_BASE_URL_GEODILE=https://tu-api.com
VITE_API_BASE_URL_GEODILE_TOKEN=tu_token_aqui
```

### Estructura de Mensaje con Imagen
```typescript
{
  _id: "mensaje123",
  messageId: "msg_abc",
  number: "51987654321",
  direction: "inbound",
  type: "image",  // ← Importante para detectar imágenes
  body: "VOUCHER_PAGOS/ruta/a/imagen.jpg",  // ← Ruta de S3
  timestamp: 1692384000000,
  createdAt: "2023-08-18T12:00:00.000Z"
}
```

## Ejemplos de Renderizado

### Mensaje de Texto
```tsx
<div className="bg-gray-400 text-gray-900 rounded-lg p-3 shadow">
  <p>Hola, ¿cómo estás?</p>
  <p className="text-xs text-gray-600">Hoy 12:30 PM</p>
</div>
```

### Mensaje con Imagen
```tsx
<div className="bg-gray-400 text-gray-900 rounded-lg p-3 shadow">
  <WhatsAppImage 
    imagePath="VOUCHER_PAGOS/imagen.jpg"
    alt="Imagen Hoy 12:30 PM"
  />
  <p className="text-xs text-gray-600">Hoy 12:30 PM</p>
</div>
```

## Ventajas

1. **Reutilización de Código**: Utiliza la misma API que PaymentImage para obtener URLs de S3
2. **Performance**: Carga lazy y manejo eficiente de errores
3. **UX Mejorada**: Estados de carga claros y posibilidad de abrir imágenes en nueva pestaña
4. **Diseño Coherente**: Colores neutros (gris) que mejoran la legibilidad con texto negro

## Próximas Mejoras
- [ ] Cache de URLs de S3 en localStorage
- [ ] Soporte para otros tipos de medios (video, audio)
- [ ] Galería de imágenes con navegación
- [ ] Descarga de imágenes
