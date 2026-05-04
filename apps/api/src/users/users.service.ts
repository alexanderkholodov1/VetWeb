import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        sector: true,
        createdAt: true
      }
    });
  }
}