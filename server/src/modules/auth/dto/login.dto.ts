import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email или @handle' })
  @IsString()
  @MinLength(1)
  loginOrEmail!: string

  @ApiProperty({ minLength: 4 })
  @IsString()
  @MinLength(4)
  password!: string

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  remember?: boolean
}

export class RegisterDto {
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
}
