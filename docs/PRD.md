# Documento de Requerimientos del Producto (PRD) - Invenda

## 1. Introducción

**Invenda** es un Sistema de Gestión de Ventas (Punto de Venta o POS) diseñado para manejar un entorno transaccional multi-moneda complejo. Permite a los comercios administrar inventario, calcular precios dinámicamente según tasas de cambio, y registrar ventas permitiendo pagos fraccionados en distintas divisas de manera simultánea.

## 2. Arquitectura Tecnológica

El sistema está dividido en dos aplicaciones principales que se comunican vía API REST:

- **Frontend (Cliente web):**
  - **Framework:** Next.js 16 (App Router) y React 19.
  - **Estilos:** Tailwind CSS v4, integrando componentes pre-fabricados y accesibles de `shadcn/ui` y Radix UI.
  - **Características:** Interfaz altamente responsiva, soporte para "Dark Mode", animaciones fluidas (tw-animate-css) y manejo de estados complejos para la cesta de compras (carrito).
- **Backend (API Servidor):**
  - **Framework:** NestJS v11 (con TypeScript).
  - **Autenticación:** JWT (JSON Web Tokens) con Passport.
  - **Base de Datos y ORM:** PostgreSQL utilizando Prisma ORM.
  - **Validación:** `class-validator` y `class-transformer` para asegurar la integridad de la información entrante a través de DTOs.

## 3. Roles de Usuario

El sistema soporta principalmente dos roles de usuario para el control de acceso:

- **ADMIN:** Acceso total al sistema. Puede gestionar usuarios, configuración de tasas de cambio, anular ventas, gestionar el inventario completo, etc.
- **CAJERO (Cashier):** Acceso restringido a la operativa de caja. Puede registrar nuevas ventas, buscar productos, aplicar pagos multimoneda, pero tiene limitaciones en la edición estructural del sistema o modificación de tasas bancarias.

## 4. Requerimientos Funcionales Principales

### 4.1. Módulo de Inventario y Productos

- **Gestión de Categorías:** Los productos deben organizarse jerárquicamente por categoría.
- **Gestión de Productos:**
  - Cada producto debe tener un nombre, estado (Activo/Inactivo), control de existencias (stock) y asociación a una categoría.
- **Gestión Compleja de Precios:**
  - Un producto soporta una base de cálculo compleja basada en: **USD Físico, USD Tarjeta, COP (Pesos Colombianos) y VES (Bolívares)**.
  - El sistema permite especificar si los precios en cada moneda son calculados automáticamente usando la tasa de cambio del día, o si tienen valores personalizados (banderas `isCustomUsdTarjeta`, `isCustomCop`, etc.).

### 4.2. Módulo de Parámetros y Tasas de Cambio (Exchange Rates)

- Debe existir un registro general (Singleton en la base de datos) para mantener actualizadas las tasas del día:
  - Tasa BCV (Bolívares).
  - Tasa COP.
  - Tasa COP a USD.
- Al actualizar las tasas globales, los cálculos en las pantallas de venta de los productos que no usan precios "custom" deben reflejar el cambio en tiempo real.

### 4.3. Módulo de Ventas y Caja (Checkout)

- **Carrito de Compras:** Interfaz ágil para añadir productos, modificar su cantidad mediante botones iterativos (tipo _stepper_ `+/-`), e identificar qué precio unitario y total aplica por línea de compra.
- **Flexibilidad Puntos de Venta (Múltiples Monedas):**
  - Un usuario debe poder pagar una sola venta entregando distintas divisas al mismo tiempo, por ejemplo, pagando una parte en "USD Físico", otra parte por transferencia o tarjeta ("USD Tarjeta"), y completando en "VES" o "COP".
- **Estados de Venta:**
  - **Pagado:** El total abonado cubre el costo del carrito.
  - **Fiado / Debiendo (Crédito):** Se permite registrar la venta a nombre de un cliente (`customerName`) especificando las deudas adquiridas. (Excluye la auto-liquidación o auto-pay al marcarse como fiado).
- **Historial de Ventas:** Visualización de ventas pasadas con opciones de filtrado (por fecha o por el usuario/cajero que emitió la factura).

## 5. Requerimientos No Funcionales (Atributos de Calidad)

- **Usabilidad y UX:** La interfaz de pagos debe evitar errores manuales, optando por controles _stepper_ amigables en vez de campos de texto libres en los ajustes de moneda y cantidad. Etiquetado claro (ej. "Bs" en lugar de VES en el UI para adaptarse al contexto de usuarios locales).
- **Seguridad:** Endpoints protegidos mediante Guards de NestJS y verificación de tokens (Access y Refresh tokens con atributos `secure` en cookies). Las contraseñas se almacenan mediante hashes de `bcrypt`.
- **Disponibilidad y Rendimiento:** La compilación con swc/turbopack asegura tiempos de construcción bajos, permitiendo iteración rápida.

## 6. Siguientes Pasos (Roadmap deducido)

- Seguimiento y control de deudores (Historial de pagos fragmentados de clientes "fiados").
- Reportes de cierres de caja detallando consolidación en diferentes monedas a final del turno por cada cajero.
