export const USER_ROLES = {
  STUDENT: 'HocVien',
  PARENT: 'PhuHuynh',
  TEACHER: 'GiaoVien',
  ADMIN: 'QuanTriVien',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
