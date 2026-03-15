import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Query } from '@nestjs/common';

@ApiTags('sales')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all sales history with pagination and search (by status)' })
    findAll(@Query() paginationDto: PaginationDto) {
        return this.salesService.findAll(paginationDto);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new sale record' })
    create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(createSaleDto);
    }
}
