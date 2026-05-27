import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator'

export class PatchProfileDto {
  @IsOptional()
  form?: Record<string, string>
}

export class SubmissionDto {
  @IsString()
  @MinLength(8)
  @IsUrl({ require_tld: false }, { message: 'repoUrl должен быть ссылкой' })
  repoUrl!: string

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'demoUrl должен быть ссылкой' })
  demoUrl?: string
}
