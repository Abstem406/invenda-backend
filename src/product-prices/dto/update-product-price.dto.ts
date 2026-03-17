import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductPriceDto } from './create-product-price.dto';

// Inherits all fields except productId, all optional
export class UpdateProductPriceDto extends PartialType(
    OmitType(CreateProductPriceDto, ['productId'] as const),
) { }
