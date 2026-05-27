import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsOptional()
  @IsString()
  loginOrEmail?: string

  @IsOptional()
  /** Любая строка: фронт может слать логин в этом поле (не только email). */
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  login?: string

  @IsString()
  @MinLength(4)
  password!: string

  @IsOptional()
  @IsBoolean()
  remember?: boolean
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  handle!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string
}
