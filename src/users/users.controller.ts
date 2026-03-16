import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // --- Admin-only CRUD endpoints ---

    @Post()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get a user by ID (Admin only)' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOneById(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update a user (Admin only). If password is sent, mustChangePassword resets to true.' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete a user (Admin only)' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    // --- Password change (any authenticated user) ---

    @Post('change-password')
    @ApiOperation({ summary: 'Change own password (any authenticated user)' })
    changePassword(
        @Req() req: any,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(
            req.user.userId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword,
        );
    }
}
