import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../generated/prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, refreshToken, ...result } = user; // result includes role
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };

        // Generate both tokens
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
            expiresIn: '15m',
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
            expiresIn: '7d',
        });

        // Hash the refresh token before saving it to the database
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

        return {
            accessToken,
            refreshToken,
        };
    }

    async refreshTokens(userId: string, incomingRefreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access Denied');
        }

        // Verify the incoming refresh token against the hashed token in the db
        const refreshTokenMatches = await bcrypt.compare(
            incomingRefreshToken,
            user.refreshToken,
        );
        if (!refreshTokenMatches) {
            throw new UnauthorizedException('Access Denied');
        }

        // If valid, generate new tokens
        const payload = { email: user.email, sub: user.id, role: user.role };
        const newAccessToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
            expiresIn: '15m',
        });
        const newRefreshToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
            expiresIn: '7d',
        });

        // Hash and save the new refresh token
        const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    async resilientLogout(accessToken: string | undefined) {
        if (!accessToken) return;
        try {
            const payload = await this.jwtService.verifyAsync(accessToken, {
                secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
            });
            if (payload && payload.sub) {
                await this.usersService.updateRefreshToken(payload.sub, null);
            }
        } catch (e) {
            // Ignorar errores de verificación de token
        }
    }
}
