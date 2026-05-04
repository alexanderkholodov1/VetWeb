import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";
import { AppRole } from "./roles.enum";

const SELF_REGISTRABLE_ROLES = [AppRole.CITIZEN, AppRole.OWNER, AppRole.VOLUNTEER, AppRole.DONOR];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(input: RegisterDto) {
    if (!SELF_REGISTRABLE_ROLES.includes(input.role)) {
      throw new BadRequestException("Rol no permitido para auto-registro");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new BadRequestException("El correo ya está registrado");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        role: input.role,
        sector: input.sector
      }
    });

    return this.issueAuth(user.id, user.email, user.role);
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    return this.issueAuth(user.id, user.email, user.role);
  }

  private issueAuth(id: string, email: string, role: string) {
    const token = this.jwtService.sign({ sub: id, email, role });
    return {
      accessToken: token,
      user: { id, email, role }
    };
  }
}