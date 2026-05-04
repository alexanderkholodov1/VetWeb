import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { RescueModule } from "./rescue/rescue.module";
import { VeterinaryModule } from "./veterinary/veterinary.module";
import { DonationsModule } from "./donations/donations.module";
import { CommunityModule } from "./community/community.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RescueModule,
    VeterinaryModule,
    DonationsModule,
    CommunityModule,
    AdminModule
  ]
})
export class AppModule {}