import { Body, Controller, Headers, Post, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { AuthService } from '../../auth/auth.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private extractBearerToken(authHeader?: string) {
    const raw = String(authHeader ?? '').trim()
    if (!raw) return undefined
    const m = raw.match(/^Bearer\s+(.+)$/i)
    if (!m?.[1]) return undefined
    return m[1].trim() || undefined
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    const res = await this.auth.login(body.loginOrEmail, body.password, body.remember !== false)
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    }
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    const res = await this.auth.refresh(body.refreshToken)
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    }
  }

  @ApiBearerAuth()
  @Post('logout')
  async logout(
    @Headers('authorization') authHeader?: string,
    @Body() body?: { refreshToken?: string },
  ) {
    const accessToken = this.extractBearerToken(authHeader)
    return this.auth.logout(accessToken, body?.refreshToken)
  }

  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post('register')
  async register(@Body() body: RegisterDto, @Headers('x-dev-register-key') devKey?: string) {
    const expected = String(process.env.BASALT_DEV_REGISTER_KEY ?? '').trim()
    if (!expected) {
      throw new UnauthorizedException('Саморегистрация отключена')
    }
    if (devKey !== expected) {
      throw new UnauthorizedException('Регистрация доступна только разработчику')
    }
    const res = await this.auth.register(body)
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    }
  }
}
