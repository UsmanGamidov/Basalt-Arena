import { SUBMISSION_STATUS } from '../constants/submission-status'

export function submissionStatusLabel(status: string, forAdmin = false) {
  switch (status) {
    case SUBMISSION_STATUS.PENDING_REVIEW:
      return 'На проверке'
    case SUBMISSION_STATUS.DELETED_BY_USER:
      return forAdmin ? 'Удалено пользователем' : 'Отозвано вами'
    case SUBMISSION_STATUS.APPROVED:
      return 'Принято'
    case 'rejected':
      return 'Удалено админом'
    case SUBMISSION_STATUS.DELETED_BY_ADMIN:
      return 'Удалено админом'
    default:
      return status
  }
}

export function mapSubmissionForUser(r: {
  id: string
  sprintId: string
  repoUrl: string
  demoUrl: string | null
  status: string
  mentorScore: number | null
  reviewNote: string | null
  createdAt: Date
  reviewedAt: Date | null
  sprint?: { title: string; tabLabel: string }
}) {
  const deleted =
    r.status === SUBMISSION_STATUS.DELETED_BY_USER ||
    r.status === SUBMISSION_STATUS.DELETED_BY_ADMIN
  return {
    id: r.id,
    sprintId: r.sprintId,
    sprintTitle: r.sprint?.title,
    tabLabel: r.sprint?.tabLabel,
    repoUrl: r.repoUrl,
    demoUrl: r.demoUrl ?? null,
    status: r.status,
    statusLabel: submissionStatusLabel(r.status),
    isDeleted: deleted,
    mentorScore: r.status === SUBMISSION_STATUS.APPROVED ? r.mentorScore : null,
    reviewNote: r.reviewNote,
    submittedAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    canDelete: r.status === SUBMISSION_STATUS.PENDING_REVIEW,
  }
}

export function mapSubmissionForAdmin(r: {
  id: string
  sprintId: string
  userId: string
  repoUrl: string
  demoUrl: string | null
  status: string
  mentorScore: number | null
  reviewNote: string | null
  createdAt: Date
  reviewedAt: Date | null
  user?: { handle: string; email: string }
  sprint?: { title: string; tabLabel: string }
}) {
  return {
    id: r.id,
    sprintId: r.sprintId,
    sprintTitle: r.sprint?.title,
    sprintTabLabel: r.sprint?.tabLabel,
    userId: r.userId,
    handle: r.user?.handle,
    email: r.user?.email,
    repoUrl: r.repoUrl,
    demoUrl: r.demoUrl,
    status: r.status,
    statusLabel: submissionStatusLabel(r.status, true),
    mentorScore: r.mentorScore,
    reviewNote: r.reviewNote,
    submittedAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    canReview:
      r.status === SUBMISSION_STATUS.PENDING_REVIEW ||
      r.status === SUBMISSION_STATUS.DELETED_BY_USER,
  }
}
