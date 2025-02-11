# Documentación de la Plataforma de Pagos

## Descripción General
Esta es una plataforma moderna de pagos construida con React, TypeScript y Vite que proporciona procesamiento de pagos, gestión de solicitudes de crédito e interacciones con bots. La plataforma cuenta con autenticación de usuarios, control de acceso basado en roles y actualizaciones en tiempo real a través de WebSocket.

## Stack Tecnológico
- **Framework Frontend**: React 18 con TypeScript
- **Herramienta de Construcción**: Vite
- **Estilos**: Tailwind CSS con componentes Shadcn UI
- **Gestión de Estado**: React Context API
- **Comunicación en Tiempo Real**: Socket.IO
- **Cliente HTTP**: Axios
- **Enrutamiento**: React Router v7
- **Manejo de Fechas**: date-fns
- **Componentes UI**: Primitivos de Radix UI
- **Animaciones**: Framer Motion
- **Notificaciones**: React Hot Toast

## Características Principales

### Autenticación y Autorización
- Registro e inicio de sesión de usuarios
- Flujo de recuperación de contraseña
- Verificación de correo electrónico
- Control de acceso basado en roles
- Rutas protegidas para diferentes niveles de usuario

### Procesamiento de Pagos
- Envío y seguimiento de pagos
- Carga y vista previa de imágenes de pago
- Lista de pagos con capacidades de filtrado
- Actualizaciones de estado en tiempo real

### Gestión de Solicitudes de Crédito
- Envío de solicitudes de crédito
- Seguimiento y actualización de estado
- Listado y filtrado de solicitudes
- Gestión basada en roles

### Interacciones con Bots
- Manejo de interacciones automatizadas
- Interfaz de comunicación con bots
- Actualizaciones de estado en tiempo real

### Gestión de Usuarios
- Gestión de perfiles de usuario
- Asignación de roles
- Listado y filtrado de usuarios
- Configuración de cuenta

## Estructura del Proyecto

### Directorios Principales
```
src/
├── api/              # Capa de integración de API
├── components/       # Componentes React
├── contexts/         # Proveedores de contexto React
├── hooks/           # Hooks personalizados de React
├── types/           # Definiciones de tipos TypeScript
└── utils/           # Funciones de utilidad
```

### Componentes Clave
- `Layout.tsx`: Diseño principal de la aplicación
- `ProtectedRoute.tsx`: Envoltorio de protección de rutas
- `NonBasicUserRoute.tsx`: Protección de rutas específica por rol
- `PaymentsPage.tsx`: Interfaz de gestión de pagos
- `CreditRequestsPage.tsx`: Manejo de solicitudes de crédito
- `BotInteractionsPage.tsx`: Interfaz de comunicación con bots
- `UserManagementPage.tsx`: Administración de usuarios

### Proveedores de Contexto
- `AuthContext.tsx`: Estado y métodos de autenticación
- `SocketContext.tsx`: Gestión de conexión WebSocket

### Hooks Personalizados
- `useAuth.ts`: Utilidades de autenticación
- `useCreditRequests.ts`: Operaciones de solicitudes de crédito
- `usePayments.ts`: Gestión de pagos
- `useSocket.ts`: Interacción WebSocket

## Comenzando

### Prerrequisitos
- Node.js 18 o superior
- Gestor de paquetes NPM o Yarn

### Instalación
1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

### Configuración de Entorno
Crear archivo `.env` con las variables requeridas:
```
VITE_API_URL=tu_url_api
VITE_SOCKET_URL=tu_url_socket
```

### Desarrollo
Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

### Construcción para Producción
Construir la aplicación:
```bash
npm run build
```

Vista previa de la construcción de producción:
```bash
npm run preview
```

## Procesos Principales

### Flujo de Autenticación
1. Registro de usuario (`Register.tsx`)
2. Verificación de correo electrónico (`VerifyEmail.tsx`)
3. Completar perfil (`CompleteRegister.tsx`)
4. Inicio de sesión (`Login.tsx`)
5. Recuperación de contraseña si es necesario (`ForgotPassword.tsx`, `ResetPassword.tsx`)

### Proceso de Envío de Pago
1. Usuario inicia envío de pago
2. Detalles de pago y carga de imagen
3. Validación del servidor
4. Actualizaciones de estado en tiempo real a través de WebSocket
5. Confirmación de pago

### Flujo de Solicitud de Crédito
1. Usuario envía solicitud de crédito
2. Revisión por personal autorizado
3. Actualizaciones de estado vía WebSocket
4. Aprobación/rechazo de solicitud
5. Notificación al usuario

### Proceso de Interacción con Bots
1. Usuario inicia interacción con bot
2. Procesamiento de mensajes
3. Manejo de respuestas en tiempo real
4. Seguimiento de estado
5. Gestión del historial de interacciones

## Características de Seguridad
- Rutas protegidas con acceso basado en roles
- Autenticación por token JWT
- Recuperación segura de contraseña
- Verificación de correo electrónico
- Validación y sanitización de entrada