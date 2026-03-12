# Guía de Desarrollo - Invenda Backend

## 1. Flujo para crear un nuevo endpoint (módulo)

La arquitectura de NestJS combinada con Prisma hace que agregar nuevos componentes sea un proceso muy metódico:

1. **Actualizar Prisma (`prisma/schema.prisma`)**: Define tu nuevo modelo (tabla) aquí.
   ```prisma
   model Supplier {
     id      String @id @default(uuid())
     name    String
     phone   String
     
     @@map("suppliers")
   }
   ```
2. **Migrar la BD**: Corre `npx prisma migrate dev --name add_suppliers` para actualizar Postgres.
3. **Generar el cliente**: Corre `npx prisma generate` para actualizar los tipos de TypeScript.
4. **Generar Archivos NestJS**: Ejecuta `npx nest g resource suppliers`. Este comando CLI de Nest autogenera el Controller, Service, Module y DTOs creando el esqueleto CRUD.
5. **Definir Validaciones (DTOs)**: En `src/suppliers/dto/create-supplier.dto.ts`, especifica qué campos (body) deben llegar:
   ```typescript
   import { IsString, IsNotEmpty } from 'class-validator';

   export class CreateSupplierDto {
       @IsString()
       @IsNotEmpty()
       name: string;

       @IsString()
       phone: string;
   }
   ```
6. **Escribir Lógica de Negocio (Service)**: En `src/suppliers/suppliers.service.ts`, inyecta el `PrismaService`:
   ```typescript
   @Injectable()
   export class SuppliersService {
     constructor(private prisma: PrismaService) {}

     async create(createSupplierDto: CreateSupplierDto) {
       return this.prisma.supplier.create({ data: createSupplierDto });
     }
   }
   ```
7. **Rutear (Controller)**: Enlázalo todo en `src/suppliers/suppliers.controller.ts`:
   ```typescript
   @Controller('suppliers')
   export class SuppliersController {
     constructor(private readonly suppliersService: SuppliersService) {}

     @Post()
     create(@Body() createSupplierDto: CreateSupplierDto) {
       return this.suppliersService.create(createSupplierDto);
     }
   }
   ```

---

## 2. Preguntas Frecuentes de la Arquitectura

### ¿Por qué se usa un `uuid` en lugar de un auto-incremental (1, 2, 3...)?
- **Aislamiento/Seguridad**: Los números auto-incrementables en las URLs (`/ventas/50`) le revelan a atacantes o competidores el tamaño y ritmo operativo de tus ventas o usuarios. Además de sufrir riesgos de barrido (alguien pidiendo todos tus endpoints del 1 al 10.000). El UUID es incomprensible e inconsecuente.
- **Microservicios y Escalabilidad**: Generar un número auto-incremental en arquitecturas grandes puede causar choques de identidades. Un UUID se garantiza estadísticamente como mundialmente único pase lo que pase.

### ¿Qué pasa si ejecuto `npx prisma generate` otra vez?
- Este comando **NO toca tu base de datos real** (PostgreSQL).
- Lo único que hace es leer tu archivo `schema.prisma` y auto-escribir funciones Typescript (tipado) en tu proyecto (en `generated/prisma/client` o en `node_modules/@prisma/client`). 
- **Migrate vs Generate**: 
  - `npx prisma migrate dev`: Revisa diferencias, arma el SQL y altera las tablas de Postgres reales.
  - `npx prisma generate`: Actualiza tu código para que reconozca los cambios que hiciste, mejorando el "intellisense" del editor. Puedes correrlo cuantas veces quieras inofensivamente.

### ¿Qué es la "g" en `npx nest g resource`?
Es la abreviatura de **Generate**. NestJS incluye un sistema de CLI (Command Line Interface) inmensamente poderoso para evitar el trabajo manual. Con el argumento "resource" se le pide que no solo genere un archivo, sino toda la paquetería unida (Módulo, Controlador, Servicio, DTOs y Entities).

### ¿Qué son los DTOs (Data Transfer Object)?
Son la "Aduana" de la información de tu API. Cuando se hace un Petición HTTP (`POST`, `PATCH`), no podemos confiar en que la información externa sea la correcta.
En un DTO se declara una Clase con propiedades acompañadas de decoradores como `@IsString()` o `@Min(0)`. Si la información del cliente no coincide con los dictámenes de la clase, NestJS automáticamente retorna un error estandarizado `400 Bad Request` antes de que el código defectuoso entre y dañe la base de datos.

### ¿Cómo funciona `src/prisma.service.ts`?
En proyectos grandes, instanciar nuevas conexiones la base de datos a cada rato tumba rápido el servidor. 
`PrismaService` es una clase decorada como "Inyectable" (`@Injectable()`). 
1. Hereda todas las capacidades del ORM de Prisma.
2. Construye un `Pool` de base de datos eficiente (un charco de conexiones abiertas de Postgres reutilizables optimizadas por el paquete nativo `@prisma/adapter-pg`).
3. Alimenta nuestro Servidor, de modo que cada que un módulo (como categorías o ventas) necesite hacer una consulta, utiliza esta conexión maestra previamente abierta sin tener que llamar nuevas conexiones.
