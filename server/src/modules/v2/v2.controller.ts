import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { OptionalUser } from '../../common/decorators/optional-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard'
import { MetaService } from '../../domain/meta.service'
import { SolutionsService } from '../../domain/solutions.service'
import { SprintsService } from '../../domain/sprints.service'
import { SubmissionsService } from '../../domain/submissions.service'
import { UsersService } from '../../domain/users.service'
import type { BasaltSessionUser } from '../../types/session-user'
import { SprintListQueryDto } from './dto/sprint-list.query.dto'
import {
  PatchProfileDto,
  SubmissionDto,
} from './dto/v2.dto'

@ApiTags('v2')
@Controller('v2')
export class V2Controller {
  constructor(
    private readonly meta: MetaService,
    private readonly users: UsersService,
    private readonly sprintsService: SprintsService,
    private readonly submissions: SubmissionsService,
    private readonly solutions: SolutionsService,
  ) {}

  @Get('meta')
  metaRoute() {
    return this.meta.getMeta()
  }

  @Get('me/sprints')
  @UseGuards(AuthGuard)
  mySprints(@CurrentUser() user: BasaltSessionUser) {
    return this.sprintsService.listMySprints(user)
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: BasaltSessionUser) {
    return this.users.getMe(user)
  }

  @Patch('me/profile')
  @UseGuards(AuthGuard)
  patchProfile(@CurrentUser() user: BasaltSessionUser, @Body() body: PatchProfileDto) {
    return this.users.patchMeProfile(user, body)
  }

  @Post('me/notifications/read')
  @UseGuards(AuthGuard)
  readNotifications(@CurrentUser() user: BasaltSessionUser) {
    return this.users.readNotifications(user)
  }

  @Get('sprints')
  sprints(@Query() query: SprintListQueryDto) {
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0
    return this.sprintsService.getSprints({ limit, offset })
  }

  @Get('sprints/:id')
  @UseGuards(OptionalAuthGuard)
  sprintById(@Param('id') id: string, @OptionalUser() user?: BasaltSessionUser) {
    return this.sprintsService.getSprintById(id, user ?? null)
  }

  @Get('sprints/:id/solutions')
  @UseGuards(OptionalAuthGuard)
  sprintSolutions(@Param('id') id: string, @OptionalUser() user?: BasaltSessionUser) {
    return this.sprintsService.getSprintSolutions(id, user ?? null)
  }

  @Get('sprints/:id/submissions/active')
  @UseGuards(AuthGuard)
  myActiveSprintSubmission(@CurrentUser() user: BasaltSessionUser, @Param('id') id: string) {
    return this.submissions.getMyActiveSubmissionForSprint(user, id)
  }

  @Post('sprints/:id/submissions')
  @UseGuards(AuthGuard)
  createSprintSubmission(
    @CurrentUser() user: BasaltSessionUser,
    @Param('id') id: string,
    @Body() body: SubmissionDto,
  ) {
    return this.submissions.createSubmission(user, id, body)
  }

  @Delete('submissions/:submissionId')
  @UseGuards(AuthGuard)
  deleteMySubmission(
    @CurrentUser() user: BasaltSessionUser,
    @Param('submissionId') submissionId: string,
  ) {
    return this.submissions.deleteMySubmission(user, submissionId)
  }

  @Post('submissions')
  @UseGuards(AuthGuard)
  createSubmission(@CurrentUser() user: BasaltSessionUser, @Body() body: SubmissionDto) {
    return this.submissions.createSubmissionForActiveSprint(user, body)
  }

  @Post('sprints/:id/solutions/:solutionId/like')
  @UseGuards(AuthGuard)
  likeSolution(
    @CurrentUser() user: BasaltSessionUser,
    @Param('id') id: string,
    @Param('solutionId') solutionId: string,
  ) {
    return this.solutions.likeSolution(user, id, solutionId)
  }
}
