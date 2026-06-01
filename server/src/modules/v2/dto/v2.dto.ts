import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateNested } from 'class-validator'

export class ProfileFormDto {
  @ApiPropertyOptional({ example: 'fighter01' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  username?: string

  @ApiPropertyOptional({ example: 'fighter01@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ example: '@fighter01' })
  @IsOptional()
  @IsString()
  telegram?: string

  @ApiPropertyOptional({ example: 'octocat', description: 'GitHub username (or full profile URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  github?: string

  @ApiPropertyOptional({ example: 'JavaScript, React' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  skillsLabel?: string

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  about?: string
}

export class PatchProfileDto {
  @ApiPropertyOptional({ type: ProfileFormDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileFormDto)
  form?: ProfileFormDto
}

export class SubmissionDto {
  @ApiProperty({ example: 'https://github.com/org/repo' })
  @IsString()
  @MinLength(8)
  @IsUrl({ require_tld: false }, { message: 'repoUrl должен быть ссылкой' })
  repoUrl!: string

  @ApiPropertyOptional({ example: 'https://demo.example.com' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'demoUrl должен быть ссылкой' })
  demoUrl?: string
}
