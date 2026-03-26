import { Controller, Get, Post, Body, UseGuards, Patch, Param, Query, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaySaleDto } from './dto/pay-sale.dto';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('sales')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all sales history with pagination, search, date and user filters' })
    findAll(@Query() paginationDto: PaginationDto) {
        return this.salesService.findAll(paginationDto);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new sale record' })
    create(@Req() req: any, @Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(createSaleDto, req.user.userId);
    }

    @Patch(':id/pay')
    @ApiOperation({ summary: 'Add a payment to an existing sale (fiado or debiendo)' })
    paySale(@Param('id') id: string, @Body() paySaleDto: PaySaleDto) {
        return this.salesService.paySale(id, paySaleDto);
    }
}
