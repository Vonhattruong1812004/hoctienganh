export type AuthRole = 'HocVien' | 'PhuHuynh' | 'GiaoVien' | 'QuanTriVien';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  roles: AuthRole[];
};

export type JwtPayload = {
  sub: string;
  email: string;
  roles: AuthRole[];
};
