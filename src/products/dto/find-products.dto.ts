import { IsOptional, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindProductsDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filtrar productos que tienen un precio asignado (true/false)' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    hasPrice?: boolean;
}
