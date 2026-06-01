import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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
import { USER_ROLES } from '../../../common/constants/user-role'

/** Балл наставника за спринт (0–100). */
export const MENTOR_SCORE_MAX = 100

export class AdminCreateUserDto {
  @ApiProperty({ example: 'fighter01' })
  @IsString()
  @MinLength(2)
  handle!: string

  @ApiProperty({ example: 'fighter01@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @IsIn(USER_ROLES)
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
  @ApiProperty({ example: 'S-12' })
  @IsString()
  @MinLength(1)
  id!: string

  @ApiProperty()
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

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Не используется: подпись строится из endsAt на сервере',
  })
  @IsOptional()
  @IsString()
  completedLabel?: string

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  endsAt!: string

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  prizeMoney?: number

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: unknown[]

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown>

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
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

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  completedLabel?: string

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endsAt?: string

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  prizeMoney?: number

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: unknown[]

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown>

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  brief?: Record<string, unknown>

  @ApiPropertyOptional()
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
  @ApiProperty({ enum: ['approve'] })
  @IsIn(['approve'])
  action!: 'approve'

  @ApiProperty({ minimum: 0, maximum: MENTOR_SCORE_MAX })
  @IsInt()
  @Min(0)
  @Max(MENTOR_SCORE_MAX)
  mentorScore!: number

  @ApiPropertyOptional()
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
