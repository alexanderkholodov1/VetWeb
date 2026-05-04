import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/auth/roles.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { AppRole } from "src/auth/roles.enum";
import { CreateReportDto } from "./dto/create-report.dto";
import { RescueService } from "./rescue.service";

@Controller("rescue")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RescueController {
  constructor(private readonly rescueService: RescueService) {}

  @Post("reports")
  @Roles(AppRole.CITIZEN, AppRole.VOLUNTEER, AppRole.ADMIN)
  create(@CurrentUser() user: { id: string }, @Body() body: CreateReportDto) {
    return this.rescueService.create(user.id, body);
  }

  @Get("reports")
  @Roles(AppRole.CITIZEN, AppRole.VOLUNTEER, AppRole.ADMIN)
  list() {
    return this.rescueService.list();
  }
}