import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSponsorshipDto {
  @IsString()
  animalName!: string;

  @IsNumber()
  @Min(1)
  monthlyFee!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}