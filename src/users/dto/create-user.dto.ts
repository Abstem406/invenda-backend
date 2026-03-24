import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

enum Role {
    ADMIN = 'ADMIN',
    CAJERO = 'CAJERO',
}

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty({ message: 'El email es requerido' })
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
