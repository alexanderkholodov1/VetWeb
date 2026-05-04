import { IsInt, IsString, Min } from "class-validator";

export class UpsertSupplyDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsString()
  unit!: string;
}