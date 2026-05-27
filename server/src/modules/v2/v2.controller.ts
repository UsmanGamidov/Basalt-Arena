import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { OptionalUser } from '../../common/decorators/optional-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard'
import { MockDbService } from '../../mock-db.service'
import type { BasaltSessionUser } from '../../types/session-user'
import { SprintListQueryDto } from './dto/sprint-list.query.dto'
import {
  PatchProfileDto,
  SubmissionDto,
} from './dto/v2.dto'

@Controller('v2')
export class V2Controller {
  constructor(private readonly db: MockDbService) {}

  @Get('meta')
  meta() {
    return this.db.getMeta()
  }

  @Get('me/sprints')
  @UseGuards(AuthGuard)
  mySprints(@CurrentUser() user: BasaltSessionUser) {
    return this.db.listMySprints(user)
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: BasaltSessionUser) {
    return this.db.getMe(user)
  }

  @Patch('me/profile')
  @UseGuards(AuthGuard)
  patchProfile(@CurrentUser() user: BasaltSessionUser, @Body() body: PatchProfileDto) {
    return this.db.patchMeProfile(user, body)
  }

  @Post('me/notifications/read')
  @UseGuards(AuthGuard)
  readNotifications(@CurrentUser() user: BasaltSessionUser) {
    return this.db.readNotifications(user)
  }

  @Get('sprints')
  sprints(@Query() query: SprintListQueryDto) {
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0
    return this.db.getSprints({ limit, offset })
  }

  @Get('sprints/:id')
  @UseGuards(OptionalAuthGuard)
  sprintById(@Param('id') id: string, @OptionalUser() user?: BasaltSessionUser) {
    return this.db.getSprintById(id, user ?? null)
  }

  @Get('sprints/:id/solutions')
  @UseGuards(OptionalAuthGuard)
  sprintSolutions(@Param('id') id: string, @OptionalUser() user?: BasaltSessionUser) {
    return this.db.getSprintSolutions(id, user ?? null)
  }

  @Get('sprints/:id/submissions/active')
  @UseGuards(AuthGuard)
  myActiveSprintSubmission(@CurrentUser() user: BasaltSessionUser, @Param('id') id: string) {
    return this.db.getMyActiveSubmissionForSprint(user, id)
  }

  @Post('sprints/:id/submissions')
  @UseGuards(AuthGuard)
  createSprintSubmission(
    @CurrentUser() user: BasaltSessionUser,
    @Param('id') id: string,
    @Body() body: SubmissionDto,
  ) {
    return this.db.createSubmission(user, id, body)
  }

  @Delete('submissions/:submissionId')
  @UseGuards(AuthGuard)
  deleteMySubmission(
    @CurrentUser() user: BasaltSessionUser,
    @Param('submissionId') submissionId: string,
  ) {
    return this.db.deleteMySubmission(user, submissionId)
  }

  @Post('submissions')
  @UseGuards(AuthGuard)
  createSubmission(@CurrentUser() user: BasaltSessionUser, @Body() body: SubmissionDto) {
    return this.db.createSubmissionForActiveSprint(user, body)
  }

  @Post('sprints/:id/solutions/:solutionId/like')
  @UseGuards(AuthGuard)
  likeSolution(
    @CurrentUser() user: BasaltSessionUser,
    @Param('id') id: string,
    @Param('solutionId') solutionId: string,
  ) {
    return this.db.likeSolution(user, id, solutionId)
  }
}
