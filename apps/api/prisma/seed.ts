import { AppointmentStatus, DonationKind, Prisma, PrismaClient, RescueStatus, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const defaultPassword = "VetWeb123!";

type SeedUserInput = {
  email: string;
  fullName: string;
  role: Role;
  sector: string;
  phone?: string;
};

async function upsertUser(input: SeedUserInput, passwordHash: string) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      fullName: input.fullName,
      passwordHash,
      role: input.role,
      sector: input.sector,
      phone: input.phone
    },
    create: {
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      role: input.role,
      sector: input.sector,
      phone: input.phone
    }
  });
}

async function ensurePet(ownerId: string, data: Prisma.PetUncheckedCreateInput) {
  const existing = await prisma.pet.findFirst({ where: { ownerId, name: data.name } });
  if (existing) {
    return prisma.pet.update({
      where: { id: existing.id },
      data: {
        species: data.species,
        breed: data.breed,
        age: data.age,
        notes: data.notes
      }
    });
  }

  return prisma.pet.create({ data });
}

async function ensureCampaign(createdById: string, data: Prisma.CampaignUncheckedCreateInput) {
  const existing = await prisma.campaign.findFirst({ where: { title: data.title } });
  if (existing) {
    return prisma.campaign.update({
      where: { id: existing.id },
      data: {
        description: data.description,
        location: data.location,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        createdById
      }
    });
  }

  return prisma.campaign.create({ data: { ...data, createdById } });
}

async function ensureAppointment(data: Prisma.AppointmentUncheckedCreateInput) {
  const existing = await prisma.appointment.findFirst({
    where: {
      ownerId: data.ownerId,
      petId: data.petId,
      scheduledAt: data.scheduledAt as Date,
      reason: data.reason
    }
  });

  if (existing) {
    return prisma.appointment.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        veterinarianId: data.veterinarianId,
        notes: data.notes
      }
    });
  }

  return prisma.appointment.create({ data });
}

async function ensureMedicalRecord(data: Prisma.MedicalRecordUncheckedCreateInput) {
  const existing = await prisma.medicalRecord.findFirst({
    where: {
      petId: data.petId,
      veterinarianId: data.veterinarianId,
      diagnosis: data.diagnosis
    }
  });

  if (existing) {
    return prisma.medicalRecord.update({
      where: { id: existing.id },
      data: { treatment: data.treatment }
    });
  }

  return prisma.medicalRecord.create({ data });
}

async function ensureRescueReport(data: Prisma.RescueReportUncheckedCreateInput) {
  const existing = await prisma.rescueReport.findFirst({
    where: {
      reporterId: data.reporterId,
      description: data.description
    }
  });

  if (existing) {
    return prisma.rescueReport.update({
      where: { id: existing.id },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        photoUrl: data.photoUrl,
        status: data.status
      }
    });
  }

  return prisma.rescueReport.create({ data });
}

async function ensureDonation(data: Prisma.DonationUncheckedCreateInput) {
  const existing = await prisma.donation.findFirst({
    where: {
      donorId: data.donorId,
      message: data.message ?? undefined
    }
  });

  if (existing) {
    return prisma.donation.update({
      where: { id: existing.id },
      data: {
        amount: data.amount,
        kind: data.kind
      }
    });
  }

  return prisma.donation.create({ data });
}

async function ensureSponsorship(data: Prisma.SponsorshipUncheckedCreateInput) {
  const existing = await prisma.sponsorship.findFirst({
    where: {
      sponsorId: data.sponsorId,
      animalName: data.animalName
    }
  });

  if (existing) {
    return prisma.sponsorship.update({
      where: { id: existing.id },
      data: {
        monthlyFee: data.monthlyFee,
        notes: data.notes
      }
    });
  }

  return prisma.sponsorship.create({ data });
}

async function main() {
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const adminPasswordHash = await bcrypt.hash("Admin12345!", 10);

  const [admin, owner, veterinarian, citizen, volunteer, donor] = await Promise.all([
    upsertUser({ email: "admin@vetweb.local", fullName: "Administrador VetWeb", role: Role.ADMIN, sector: "Pillaro", phone: "0990000001" }, adminPasswordHash),
    upsertUser({ email: "owner@vetweb.local", fullName: "Lucia Andrade", role: Role.OWNER, sector: "San Miguelito", phone: "0990000002" }, passwordHash),
    upsertUser({ email: "vet@vetweb.local", fullName: "Dra. Camila Perez", role: Role.VETERINARIAN, sector: "Centro", phone: "0990000003" }, passwordHash),
    upsertUser({ email: "citizen@vetweb.local", fullName: "Marco Tipan", role: Role.CITIZEN, sector: "Los Pinos", phone: "0990000004" }, passwordHash),
    upsertUser({ email: "volunteer@vetweb.local", fullName: "Daniela Chiluisa", role: Role.VOLUNTEER, sector: "La Merced", phone: "0990000005" }, passwordHash),
    upsertUser({ email: "donor@vetweb.local", fullName: "Esteban Mena", role: Role.DONOR, sector: "Pillaro Norte", phone: "0990000006" }, passwordHash)
  ]);

  await prisma.veterinarianProfile.upsert({
    where: { userId: veterinarian.id },
    update: {
      specialty: "Medicina general y rescate",
      biography: "Atencion primaria, esterilizacion y seguimiento de animales rescatados.",
      schedule: "Lun-Vie 08:00-17:00",
      isAvailable: true
    },
    create: {
      userId: veterinarian.id,
      specialty: "Medicina general y rescate",
      biography: "Atencion primaria, esterilizacion y seguimiento de animales rescatados.",
      schedule: "Lun-Vie 08:00-17:00",
      isAvailable: true
    }
  });

  const luna = await ensurePet(owner.id, {
    ownerId: owner.id,
    name: "Luna",
    species: "Canino",
    breed: "Mestiza",
    age: 4,
    notes: "Esterilizada y con vacunas al dia"
  });

  const simba = await ensurePet(owner.id, {
    ownerId: owner.id,
    name: "Simba",
    species: "Felino",
    breed: "Comun europeo",
    age: 2,
    notes: "Requiere seguimiento dermatologico"
  });

  await ensureAppointment({
    ownerId: owner.id,
    petId: luna.id,
    veterinarianId: veterinarian.id,
    scheduledAt: new Date("2026-05-15T14:30:00.000Z"),
    reason: "Control anual y refuerzo de vacunas",
    status: AppointmentStatus.CONFIRMED,
    notes: "Llegar 15 minutos antes"
  });

  await ensureAppointment({
    ownerId: owner.id,
    petId: simba.id,
    veterinarianId: veterinarian.id,
    scheduledAt: new Date("2026-05-18T16:00:00.000Z"),
    reason: "Revision de piel y caida de pelo",
    status: AppointmentStatus.REQUESTED,
    notes: "Traer examenes previos si existen"
  });

  await ensureMedicalRecord({
    petId: luna.id,
    veterinarianId: veterinarian.id,
    diagnosis: "Paciente estable, calendario de vacunacion completo",
    treatment: "Mantener desparasitacion trimestral y control en 12 meses"
  });

  const campaign = await ensureCampaign(admin.id, {
    title: "Jornada de adopcion y vacunacion",
    description: "Campana comunitaria con adopciones responsables, valoracion clinica y vacunacion preventiva.",
    location: "Parque Central de Pillaro",
    startsAt: new Date("2026-05-24T15:00:00.000Z"),
    endsAt: new Date("2026-05-24T20:00:00.000Z"),
    createdById: admin.id
  });

  await prisma.campaignRegistration.upsert({
    where: { campaignId_userId: { campaignId: campaign.id, userId: volunteer.id } },
    update: {},
    create: { campaignId: campaign.id, userId: volunteer.id }
  });

  await prisma.campaignRegistration.upsert({
    where: { campaignId_userId: { campaignId: campaign.id, userId: citizen.id } },
    update: {},
    create: { campaignId: campaign.id, userId: citizen.id }
  });

  await ensureRescueReport({
    description: "Cachorro encontrado cerca del mercado sin collar y con cojera leve",
    photoUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
    latitude: -1.171321,
    longitude: -78.546421,
    status: RescueStatus.IN_REVIEW,
    reporterId: citizen.id
  });

  await ensureDonation({
    donorId: donor.id,
    amount: new Prisma.Decimal("75.00"),
    kind: DonationKind.ONE_TIME,
    message: "Semilla: aporte para fondo quirurgico"
  });

  await ensureSponsorship({
    sponsorId: donor.id,
    animalName: "Niebla",
    monthlyFee: new Prisma.Decimal("30.00"),
    notes: "Apadrinamiento para alimento y chequeos basicos"
  });

  await prisma.supply.upsert({
    where: { name: "Vacuna antirrabica" },
    update: { stock: 24, unit: "dosis" },
    create: { name: "Vacuna antirrabica", stock: 24, unit: "dosis" }
  });

  await prisma.supply.upsert({
    where: { name: "Alimento balanceado" },
    update: { stock: 18, unit: "sacos" },
    create: { name: "Alimento balanceado", stock: 18, unit: "sacos" }
  });

  console.log("Seed completado: admin, usuarios demo, veterinario, mascotas, campana, donacion y suministros.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });