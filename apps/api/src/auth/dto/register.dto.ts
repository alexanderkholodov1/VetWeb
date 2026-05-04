import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { AppRole } from "../roles.enum";

export class RegisterDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsEnum(AppRole)
  role!: AppRole;

  @IsOptional()
  @IsString()
  sector?: string;
}