/**
 * Статусы, при которых участник не может отправить новую посылку в тот же спринт.
 * `deleted_by_user` сюда НЕ входит: отзыв своей отправки освобождает участника для повторной подачи.
 */
export const SUBMISSION_BLOCKING_STATUSES = [
  'pending_review',
  'approved',
] as const

export type SubmissionBlockingStatus = (typeof SUBMISSION_BLOCKING_STATUSES)[number]

export const SUBMISSION_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  DELETED_BY_USER: 'deleted_by_user',
  DELETED_BY_ADMIN: 'deleted_by_admin',
} as const
