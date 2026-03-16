import {
    Injectable,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Fields to exclude from user responses
const userSelectFields = {
    id: true,
    email: true,
    name: true,
    role: true,
    mustChangePassword: true,
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // --- Internal methods (used by AuthService) ---

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async updateRefreshToken(
        id: string,
        refreshToken: string | null,
    ): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { refreshToken },
        });
    }

    // --- CRUD methods (Admin only) ---

    async create(createUserDto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });
        if (existing) {
            throw new ConflictException('A user with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        return this.prisma.user.create({
            data: {
                email: createUserDto.email,
                password: hashedPassword,
                name: createUserDto.name,
                role: createUserDto.role as any,
                mustChangePassword: true, // Force password change on first login
            },
            select: userSelectFields,
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: userSelectFields,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: userSelectFields,
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        await this.findOneById(id); // Ensure user exists

        const data: any = {};
        if (updateUserDto.email) data.email = updateUserDto.email;
        if (updateUserDto.name !== undefined) data.name = updateUserDto.name;
        if (updateUserDto.role) data.role = updateUserDto.role;
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(updateUserDto.password, 10);
            data.mustChangePassword = true; // Force password change when admin resets password
        }

        return this.prisma.user.update({
            where: { id },
            data,
            select: userSelectFields,
        });
    }

    async remove(id: string) {
        await this.findOneById(id); // Ensure user exists
        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted successfully' };
    }

    // --- Password change (any authenticated user) ---

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const passwordValid = await bcrypt.compare(
            currentPassword,
            user.password,
        );
        if (!passwordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false, // User has changed their password
            },
        });

        return { message: 'Password changed successfully' };
    }
}
