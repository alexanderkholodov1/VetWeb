import { IsDateString, IsString } from "class-validator";

export class CreateCampaignDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  location!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}