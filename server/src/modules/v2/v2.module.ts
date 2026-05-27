import { Module } from '@nestjs/common'
import { AuthGuard } from '../../common/guards/auth.guard'
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard'
import { V2Controller } from './v2.controller'

@Module({
  controllers: [V2Controller],
  providers: [AuthGuard, OptionalAuthGuard],
})
export class V2Module {}
