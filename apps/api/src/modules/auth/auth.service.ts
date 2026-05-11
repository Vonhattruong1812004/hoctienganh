import { UnauthorizedException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthRole, AuthUser } from './auth.types';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

type RawUser = {
  maNguoiDung: string;
  hoTen: string;
  email: string;
  matKhau: string;
  trangThai: string;
  roles: AuthRole[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.findUserByEmail(dto.email);

    if (!user || user.trangThai !== 'HoatDong') {
      throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa.');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.matKhau);
    if (!isValidPassword) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    const payload = {
      sub: user.maNguoiDung,
      email: user.email,
      roles: user.roles,
    };
    const accessTokenExpiresIn = (
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m'
    ) as JwtSignOptions['expiresIn'];

    return {
      accessToken: await this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret',
        expiresIn: accessTokenExpiresIn,
      }),
      user: {
        id: user.maNguoiDung,
        fullName: user.hoTen,
        email: user.email,
        roles: user.roles,
      } satisfies AuthUser,
    };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.findUserById(userId);

    if (!user || user.trangThai !== 'HoatDong') {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa.');
    }

    return {
      id: user.maNguoiDung,
      fullName: user.hoTen,
      email: user.email,
      roles: user.roles,
    };
  }

  private async findUserByEmail(email: string) {
    const users = await this.prisma.$queryRaw<RawUser[]>`
      SELECT
        nd."maNguoiDung",
        nd."hoTen",
        nd.email,
        nd."matKhau",
        nd."trangThai",
        COALESCE(array_agg(vt."tenVaiTro") FILTER (WHERE vt."tenVaiTro" IS NOT NULL), '{}') AS roles
      FROM nguoidung nd
      LEFT JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
      LEFT JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
      WHERE nd.email = ${email}
      GROUP BY nd."maNguoiDung"
      LIMIT 1
    `;
    return users[0];
  }

  private async findUserById(userId: string) {
    const users = await this.prisma.$queryRaw<RawUser[]>`
      SELECT
        nd."maNguoiDung",
        nd."hoTen",
        nd.email,
        nd."matKhau",
        nd."trangThai",
        COALESCE(array_agg(vt."tenVaiTro") FILTER (WHERE vt."tenVaiTro" IS NOT NULL), '{}') AS roles
      FROM nguoidung nd
      LEFT JOIN nguoidung_vaitro ndvt ON ndvt."maNguoiDung" = nd."maNguoiDung"
      LEFT JOIN vaitro vt ON vt."maVaiTro" = ndvt."maVaiTro"
      WHERE nd."maNguoiDung" = ${userId}::uuid
      GROUP BY nd."maNguoiDung"
      LIMIT 1
    `;
    return users[0];
  }
}
