import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  createCampaign(userId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        createdById: userId
      }
    });
  }

  listCampaigns() {
    return this.prisma.campaign.findMany({ orderBy: { startsAt: "asc" }, include: { registrations: true } });
  }

  async register(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new NotFoundException("Campaña no encontrada");
    }

    const existing = await this.prisma.campaignRegistration.findUnique({
      where: { campaignId_userId: { campaignId, userId } }
    });

    if (existing) {
      throw new ConflictException("Ya estás inscrito en esta campaña");
    }

    return this.prisma.campaignRegistration.create({ data: { campaignId, userId } });
  }
}