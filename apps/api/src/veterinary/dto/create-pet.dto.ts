import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreatePetDto {
  @IsString()
  name!: string;

  @IsString()
  species!: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}