import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/auth/roles.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { AppRole } from "src/auth/roles.enum";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { CommunityService } from "./community.service";

@Controller("community")
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post("campaigns")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  createCampaign(@CurrentUser() user: { id: string }, @Body() body: CreateCampaignDto) {
    return this.communityService.createCampaign(user.id, body);
  }

  @Get("campaigns")
  listCampaigns() {
    return this.communityService.listCampaigns();
  }

  @Post("campaigns/:id/register")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.CITIZEN, AppRole.OWNER, AppRole.VOLUNTEER, AppRole.ADMIN)
  register(@Param("id") campaignId: string, @CurrentUser() user: { id: string }) {
    return this.communityService.register(campaignId, user.id);
  }
}