import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

enum DonationKindDto {
  ONE_TIME = "ONE_TIME",
  MONTHLY = "MONTHLY"
}

export class CreateDonationDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(DonationKindDto)
  kind!: DonationKindDto;

  @IsOptional()
  @IsString()
  message?: string;
}