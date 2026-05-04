import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateReportDto } from "./dto/create-report.dto";

@Injectable()
export class RescueService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateReportDto) {
    return this.prisma.rescueReport.create({
      data: {
        description: dto.description,
        photoUrl: dto.photoUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        reporterId: userId
      }
    });
  }

  list() {
    return this.prisma.rescueReport.findMany({
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { fullName: true, role: true } } }
    });
  }
}