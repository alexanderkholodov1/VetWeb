import { Injectable, NotFoundException } from "@nestjs/common";
import { AppointmentStatus } from "@prisma/client";
import { AppRole } from "src/auth/roles.enum";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { UpsertSupplyDto } from "./dto/upsert-supply.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics() {
    const [users, pets, appointments, reports, donations, supplies] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.pet.count(),
      this.prisma.appointment.count(),
      this.prisma.rescueReport.count(),
      this.prisma.donation.count(),
      this.prisma.supply.count()
    ]);

    return { users, pets, appointments, reports, donations, supplies };
  }

  updateRole(userId: string, role: AppRole) {
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  listPets() {
    return this.prisma.pet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            sector: true
          }
        },
        appointments: {
          orderBy: { scheduledAt: "desc" }
        },
        medicalRecords: {
          orderBy: { createdAt: "desc" },
          include: {
            veterinarian: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async updateAppointment(appointmentId: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      throw new NotFoundException("Cita no encontrada");
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status as AppointmentStatus | undefined,
        notes: dto.notes,
        veterinarianId: dto.veterinarianId
      },
      include: {
        pet: true,
        owner: { select: { fullName: true, email: true } }
      }
    });
  }

  listSupplies() {
    return this.prisma.supply.findMany({ orderBy: { name: "asc" } });
  }

  upsertSupply(dto: UpsertSupplyDto) {
    return this.prisma.supply.upsert({
      where: { name: dto.name },
      create: dto,
      update: { stock: dto.stock, unit: dto.unit }
    });
  }
}