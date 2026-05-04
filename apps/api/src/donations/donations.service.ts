import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateDonationDto } from "./dto/create-donation.dto";
import { CreateSponsorshipDto } from "./dto/create-sponsorship.dto";

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  createDonation(donorId: string, dto: CreateDonationDto) {
    return this.prisma.donation.create({
      data: {
        donorId,
        amount: dto.amount,
        kind: dto.kind as any,
        message: dto.message
      }
    });
  }

  createSponsorship(sponsorId: string, dto: CreateSponsorshipDto) {
    return this.prisma.sponsorship.create({ data: { sponsorId, ...dto } });
  }

  listDonations() {
    return this.prisma.donation.findMany({ orderBy: { createdAt: "desc" }, include: { donor: { select: { fullName: true } } } });
  }
}