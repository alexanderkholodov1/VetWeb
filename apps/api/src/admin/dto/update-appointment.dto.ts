import { IsEnum, IsOptional, IsString } from "class-validator";

enum AppointmentStatusDto {
  REQUESTED = "REQUESTED",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED"
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatusDto)
  status?: AppointmentStatusDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  veterinarianId?: string;
}