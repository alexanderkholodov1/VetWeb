import { IsDateString, IsString } from "class-validator";

export class CreateAppointmentDto {
  @IsString()
  petId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  reason!: string;
}