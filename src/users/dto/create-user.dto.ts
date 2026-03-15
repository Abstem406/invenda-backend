import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

enum Role {
    ADMIN = 'ADMIN',
    CAJERO = 'CAJERO',
}

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsEnum(Role)
    role!: Role;
}
