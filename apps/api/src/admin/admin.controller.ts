import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Roles } from "src/auth/roles.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { AppRole } from "src/auth/roles.enum";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { UpsertSupplyDto } from "./dto/upsert-supply.dto";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("metrics")
  metrics() {
    return this.adminService.metrics();
  }

  @Patch("users/:id/role")
  updateRole(@Param("id") userId: string, @Body("role") role: AppRole) {
    return this.adminService.updateRole(userId, role);
  }

  @Get("supplies")
  listSupplies() {
    return this.adminService.listSupplies();
  }

  @Get("pets")
  listPets() {
    return this.adminService.listPets();
  }

  @Patch("appointments/:id")
  updateAppointment(@Param("id") appointmentId: string, @Body() body: UpdateAppointmentDto) {
    return this.adminService.updateAppointment(appointmentId, body);
  }

  @Post("supplies")
  upsertSupply(@Body() body: UpsertSupplyDto) {
    return this.adminService.upsertSupply(body);
  }
}