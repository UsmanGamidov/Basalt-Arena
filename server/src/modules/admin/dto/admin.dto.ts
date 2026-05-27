import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator'

/** Балл наставника за спринт (0–100). */
export const MENTOR_SCORE_MAX = 100

export class AdminCreateUserDto {
  @IsString()
  @MinLength(2)
  handle!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsOptional()
  @IsString()
  displayName?: string
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  role?: string

  @IsOptional()
  @IsString()
  displayName?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string
}

export class AdminCreateAchievementDefinitionDto {
  @IsString()
  @MinLength(2)
  title!: string

  @IsString()
  @MinLength(2)
  subtitle!: string

  @IsString()
  icon!: string

  @IsOptional()
  @IsString()
  variant?: string
}

export class AdminUpdateAchievementDefinitionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  subtitle?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  variant?: string
}

export class AdminGrantAchievementDto {
  @IsOptional()
  @IsString()
  userId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[]

  @IsOptional()
  @IsString()
  definitionId?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  subtitle?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  variant?: string
}

export class AdminCreateSprintDto {
  @IsString()
  @MinLength(1)
  id!: string

  @IsString()
  tabLabel!: string

  @IsOptional()
  @IsString()
  tabIcon?: string

  @IsString()
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  published?: boolean

  @IsOptional()
  @IsBoolean()
  isMainActive?: boolean

  @IsOptional()
  @IsString()
  completedLabel?: string

  @IsDateString()
  endsAt!: string

  @IsOptional()
  @IsInt()
  @Min(0)
  prizeMoney?: number

  @IsOptional()
  @IsArray()
  tags?: unknown[]

  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  brief?: Record<string, unknown>
}

export class AdminUpdateSprintDto {
  @IsOptional()
  @IsString()
  tabLabel?: string

  @IsOptional()
  @IsString()
  tabIcon?: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  published?: boolean

  @IsOptional()
  @IsBoolean()
  isMainActive?: boolean

  @IsOptional()
  @IsString()
  completedLabel?: string

  @IsOptional()
  @IsDateString()
  endsAt?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  prizeMoney?: number

  @IsOptional()
  @IsArray()
  tags?: unknown[]

  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  brief?: Record<string, unknown>

  @IsOptional()
  @IsBoolean()
  /** Если true и передан `brief`, сохранить `briefJson` целиком без слияния с предыдущим. */
  replaceBrief?: boolean
}

export class AdminCreateSolutionDto {
  @IsString()
  userId!: string

  @IsInt()
  @Min(0)
  @Max(MENTOR_SCORE_MAX)
  mentorScore!: number

  @IsString()
  @IsUrl({ require_tld: false })
  codeUrl!: string

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  demoUrl?: string

  @IsOptional()
  @IsInt()
  rank?: number

  @IsOptional()
  @IsString()
  rankBadge?: string

  @IsOptional()
  @IsBoolean()
  showCrown?: boolean
}

export class AdminSprintParticipantsDto {
  @IsArray()
  @IsString({ each: true })
  userIds!: string[]
}

export class AdminReviewSubmissionDto {
  @IsIn(['approve'])
  action!: 'approve'

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MENTOR_SCORE_MAX)
  mentorScore?: number

  @IsOptional()
  @IsString()
  reviewNote?: string
}

export class AdminUpdateSolutionDto {
  @IsOptional()
  @IsString()
  userId?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MENTOR_SCORE_MAX)
  mentorScore?: number

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  codeUrl?: string

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  demoUrl?: string

  @IsOptional()
  @IsInt()
  rank?: number

  @IsOptional()
  @IsString()
  rankBadge?: string

  @IsOptional()
  @IsBoolean()
  showCrown?: boolean
}
