import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common'
import { MockDbService } from '../../mock-db.service'
import { LoginDto, RegisterDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly db: MockDbService) {}

  private extractBearerToken(authHeader?: string) {
    const raw = String(authHeader ?? '').trim()
    if (!raw) return undefined
    const m = raw.match(/^Bearer\s+(.+)$/i)
    if (!m?.[1]) return undefined
    const token = m[1].trim()
    return token || undefined
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const loginOrEmail = body.loginOrEmail ?? body.email ?? body.login
    if (!loginOrEmail) {
      throw new UnauthorizedException('Укажите логин или email')
    }
    const res = await this.db.login(loginOrEmail, body.password, body.remember !== false)
    return {
      accessToken: res.token,
      user: res.user,
    }
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader?: string) {
    const token = this.extractBearerToken(authHeader)
    return this.db.logout(token)
  }

  @Post('register')
  async register(@Body() body: RegisterDto, @Headers('x-dev-register-key') devKey?: string) {
    const expected = String(process.env.BASALT_DEV_REGISTER_KEY ?? '').trim()
    if (!expected) {
      throw new UnauthorizedException('Саморегистрация отключена')
    }
    if (devKey !== expected) {
      throw new UnauthorizedException('Регистрация доступна только разработчику')
    }
    const res = await this.db.register(body)
    return { accessToken: res.token, user: res.user }
  }
}
