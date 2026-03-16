import {
    Controller,
    Post,
    UseGuards,
    Req,
    Res,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: LoginDto })
    @ApiOperation({ summary: 'Login and get auth cookies' })
    async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        // req.user is appended by LocalStrategy
        const tokens = await this.authService.login(req.user);

        // Set Access Token
        res.cookie('access_token', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Set Refresh Token
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
            message: 'Login successful',
            user: req.user,
            mustChangePassword: (req.user as any)?.mustChangePassword ?? false,
        };
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiCookieAuth()
    @ApiOperation({ summary: 'Refresh auth cookies' })
    async refresh(
        @Req() req: Request & { user: any },
        @Res({ passthrough: true }) res: Response,
    ) {
        // JwtRefreshStrategy appends the user payload and the extracted refresh token
        const userId = req.user.sub;
        const incomingRefreshToken = req.user.refreshToken;

        const tokens = await this.authService.refreshTokens(
            userId,
            incomingRefreshToken,
        );

        // Set new Access Token
        res.cookie('access_token', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Set new Refresh Token
        res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { message: 'Tokens refreshed successfully' };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout and clear cookies without requiring valid JWT' })
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        // Intentar borrar refresh token de la BD usando el token de la cookie
        const token = req.cookies?.['access_token'];
        if (token) {
            await this.authService.resilientLogout(token);
        }

        // Clear access_token cookie
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        // Clear refresh_token cookie
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return { message: 'Logout successful, session destroyed' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiCookieAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@Req() req: Request & { user: any }) {
        return req.user;
    }
}
