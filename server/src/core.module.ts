import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { MockDbService } from './mock-db.service'

const jwtSecret =
  process.env.JWT_SECRET && process.env.JWT_SECRET.trim()
    ? process.env.JWT_SECRET
    : process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('JWT_SECRET is required in production')
        })()
      : 'basalt-local-dev-jwt'

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [MockDbService],
  exports: [MockDbService],
})
export class CoreModule {}
