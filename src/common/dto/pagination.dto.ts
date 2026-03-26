import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @ApiPropertyOptional({ description: 'Número de página (1 por defecto)', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Cantidad de elementos por página (10 por defecto)', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Término de búsqueda opcional' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Fecha de inicio para filtrar (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Fecha final para filtrar (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateTo?: string;

    @ApiPropertyOptional({ description: 'ID del usuario para filtrar ventas por cajero' })
    @IsOptional()
    @IsString()
    userId?: string;
}
