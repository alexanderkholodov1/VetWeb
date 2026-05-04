import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/auth/roles.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { AppRole } from "src/auth/roles.enum";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";
import { CreatePetDto } from "./dto/create-pet.dto";
import { VeterinaryService } from "./veterinary.service";

@Controller("veterinary")
export class VeterinaryController {
  constructor(private readonly veterinaryService: VeterinaryService) {}

  @Post("pets")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.OWNER, AppRole.ADMIN)
  createPet(@CurrentUser() user: { id: string }, @Body() body: CreatePetDto) {
    return this.veterinaryService.createPet(user.id, body);
  }

  @Get("pets")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.OWNER, AppRole.ADMIN)
  listPets(@CurrentUser() user: { id: string }) {
    return this.veterinaryService.listPets(user.id);
  }

  @Post("appointments")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.OWNER, AppRole.ADMIN)
  createAppointment(@CurrentUser() user: { id: string }, @Body() body: CreateAppointmentDto) {
    return this.veterinaryService.createAppointment(user.id, body);
  }

  @Get("agenda")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.VETERINARIAN, AppRole.ADMIN)
  agenda() {
    return this.veterinaryService.listAgenda();
  }

  @Get("veterinarians")
  listVeterinarians() {
    return this.veterinaryService.listVeterinarians();
  }

  @Post("medical-records")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.VETERINARIAN, AppRole.ADMIN)
  createMedicalRecord(@CurrentUser() user: { id: string }, @Body() body: CreateMedicalRecordDto) {
    return this.veterinaryService.createMedicalRecord(user.id, body);
  }
}