import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/auth/roles.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { AppRole } from "src/auth/roles.enum";
import { CreateDonationDto } from "./dto/create-donation.dto";
import { CreateSponsorshipDto } from "./dto/create-sponsorship.dto";
import { DonationsService } from "./donations.service";

@Controller("donations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @Roles(AppRole.DONOR, AppRole.ADMIN)
  createDonation(@CurrentUser() user: { id: string }, @Body() body: CreateDonationDto) {
    return this.donationsService.createDonation(user.id, body);
  }

  @Post("sponsorships")
  @Roles(AppRole.DONOR, AppRole.ADMIN)
  createSponsorship(@CurrentUser() user: { id: string }, @Body() body: CreateSponsorshipDto) {
    return this.donationsService.createSponsorship(user.id, body);
  }

  @Get()
  @Roles(AppRole.ADMIN)
  list() {
    return this.donationsService.listDonations();
  }
}