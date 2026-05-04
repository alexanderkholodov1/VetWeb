import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePetDto } from "./dto/create-pet.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";

@Injectable()
export class VeterinaryService {
  constructor(private readonly prisma: PrismaService) {}

  createPet(ownerId: string, dto: CreatePetDto) {
    return this.prisma.pet.create({ data: { ...dto, ownerId } });
  }

  listPets(ownerId: string) {
    return this.prisma.pet.findMany({ where: { ownerId }, include: { medicalRecords: true, appointments: true } });
  }

  async createAppointment(ownerId: string, dto: CreateAppointmentDto) {
    const pet = await this.prisma.pet.findFirst({ where: { id: dto.petId, ownerId } });
    if (!pet) {
      throw new NotFoundException("Mascota no encontrada para el usuario actual");
    }

    return this.prisma.appointment.create({
      data: {
        ownerId,
        petId: dto.petId,
        scheduledAt: new Date(dto.scheduledAt),
        reason: dto.reason
      }
    });
  }

  listAgenda() {
    return this.prisma.appointment.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { pet: true, owner: { select: { fullName: true } } }
    });
  }

  listVeterinarians() {
    return this.prisma.veterinarianProfile.findMany({
      where: { isAvailable: true },
      include: { user: { select: { id: true, fullName: true, sector: true, avatarUrl: true } } },
      orderBy: { user: { fullName: "asc" } }
    });
  }

  createMedicalRecord(veterinarianId: string, dto: CreateMedicalRecordDto) {
    return this.prisma.medicalRecord.create({ data: { ...dto, veterinarianId } });
  }
}