import { IsString } from "class-validator";

export class CreateMedicalRecordDto {
  @IsString()
  petId!: string;

  @IsString()
  diagnosis!: string;

  @IsString()
  treatment!: string;
}