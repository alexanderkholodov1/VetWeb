import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateReportDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;
}