import { Module } from '@nestjs/common'
import { AdminGuard } from '../../common/guards/admin.guard'
import { AdminController } from './admin.controller'

@Module({
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
