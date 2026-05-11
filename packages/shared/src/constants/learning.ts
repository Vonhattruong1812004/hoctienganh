export const PASSING_SCORE_DEFAULT = 80;

export const LESSON_STATUS = {
  LOCKED: 'BiKhoa',
  NOT_STARTED: 'ChuaHoc',
  IN_PROGRESS: 'DangHoc',
  COMPLETED: 'HoanThanh',
} as const;

export const QUIZ_ATTEMPT_STATUS = {
  IN_PROGRESS: 'DangLam',
  SUBMITTED: 'DaNop',
  PASSED: 'Dat',
  FAILED: 'KhongDat',
} as const;
