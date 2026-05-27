import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AdminGuard } from '../../common/guards/admin.guard'
import { MockDbService } from '../../mock-db.service'
import {
  AdminCreateSolutionDto,
  AdminCreateSprintDto,
  AdminCreateUserDto,
  AdminCreateAchievementDefinitionDto,
  AdminUpdateAchievementDefinitionDto,
  AdminGrantAchievementDto,
  AdminReviewSubmissionDto,
  AdminSprintParticipantsDto,
  AdminUpdateSolutionDto,
  AdminUpdateSprintDto,
  AdminUpdateUserDto,
} from './dto/admin.dto'

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly db: MockDbService) {}

  @Get('users')
  users() {
    return this.db.adminListUsers()
  }

  @Post('users')
  createUser(@Body() body: AdminCreateUserDto, @Req() req: Request) {
    return this.db.adminCreateUser(body, req.basaltAdmin)
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserDto, @Req() req: Request) {
    return this.db.adminUpdateUser(id, body, req.basaltAdmin)
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Req() req: Request) {
    const admin = req.basaltAdmin
    if (!admin?.id) throw new UnauthorizedException()
    return this.db.adminDeleteUser(admin.id, id, admin.handle)
  }

  @Get('achievements/definitions')
  listAchievementDefinitions() {
    return this.db.adminListAchievementDefinitions()
  }

  @Post('achievements/definitions')
  createAchievementDefinition(@Body() body: AdminCreateAchievementDefinitionDto, @Req() req: Request) {
    return this.db.adminCreateAchievementDefinition(body, req.basaltAdmin)
  }

  @Delete('achievements/definitions/:id')
  deleteAchievementDefinition(@Param('id') id: string, @Req() req: Request) {
    return this.db.adminDeleteAchievementDefinition(id, req.basaltAdmin)
  }

  @Patch('achievements/definitions/:id')
  updateAchievementDefinition(
    @Param('id') id: string,
    @Body() body: AdminUpdateAchievementDefinitionDto,
    @Req() req: Request,
  ) {
    return this.db.adminUpdateAchievementDefinition(id, body, req.basaltAdmin)
  }

  @Post('achievements/grant')
  grantAchievement(@Body() body: AdminGrantAchievementDto, @Req() req: Request) {
    return this.db.adminGrantAchievement(body, req.basaltAdmin)
  }

  @Get('achievements')
  listAchievements() {
    return this.db.adminListAchievements()
  }

  @Delete('achievements/:id')
  deleteAchievement(@Param('id') id: string, @Req() req: Request) {
    return this.db.adminDeleteAchievement(id, req.basaltAdmin)
  }

  @Get('submissions')
  listAllSubmissions(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.db.adminListAllSubmissions(
      Number.isFinite(limit) ? limit : 100,
      Number.isFinite(offset) ? offset : 0,
      q,
      status,
      sort,
    )
  }

  @Get('logs')
  listLogs(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('q') q?: string,
  ) {
    return this.db.adminListLogs(
      Number.isFinite(limit) ? limit : 100,
      Number.isFinite(offset) ? offset : 0,
      q,
    )
  }

  @Post('submissions/:submissionId/review')
  reviewSubmission(
    @Param('submissionId') submissionId: string,
    @Body() body: AdminReviewSubmissionDto,
    @Req() req: Request,
  ) {
    return this.db.adminReviewSubmission(submissionId, body, req.basaltAdmin)
  }

  @Get('sprints')
  sprints() {
    return this.db.adminListSprints()
  }

  @Post('sprints')
  createSprint(@Body() body: AdminCreateSprintDto, @Req() req: Request) {
    return this.db.adminCreateSprint(body, req.basaltAdmin)
  }

  @Patch('sprints/:id')
  updateSprint(@Param('id') id: string, @Body() body: AdminUpdateSprintDto, @Req() req: Request) {
    return this.db.adminUpdateSprint(id, body, req.basaltAdmin)
  }

  @Delete('sprints/:id')
  deleteSprint(@Param('id') id: string, @Req() req: Request) {
    return this.db.adminDeleteSprint(id, req.basaltAdmin)
  }

  @Get('sprints/:id/participants')
  sprintParticipants(@Param('id') id: string) {
    return this.db.adminListSprintEnrollments(id)
  }

  @Get('sprints/:id/submissions')
  sprintSubmissions(@Param('id') id: string) {
    return this.db.adminListSprintSubmissions(id)
  }

  @Delete('sprints/:id/submissions/:submissionId')
  deleteSprintSubmission(
    @Param('id') sprintId: string,
    @Param('submissionId') submissionId: string,
    @Req() req: Request,
  ) {
    return this.db.adminDeleteSubmission(sprintId, submissionId, req.basaltAdmin)
  }

  @Get('sprints/:id')
  sprintDetail(@Param('id') id: string) {
    return this.db.adminGetSprintById(id)
  }

  @Post('sprints/:id/participants')
  addSprintParticipants(
    @Param('id') id: string,
    @Body() body: AdminSprintParticipantsDto,
    @Req() req: Request,
  ) {
    return this.db.adminAddSprintEnrollments(id, body.userIds, req.basaltAdmin)
  }

  @Delete('sprints/:id/participants/:userId')
  removeSprintParticipant(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    return this.db.adminRemoveSprintEnrollment(id, userId, req.basaltAdmin)
  }

  @Post('sprints/:sprintId/solutions')
  createSolution(
    @Param('sprintId') sprintId: string,
    @Body() body: AdminCreateSolutionDto,
    @Req() req: Request,
  ) {
    return this.db.adminCreateSolution(sprintId, body, { actor: req.basaltAdmin })
  }

  @Patch('solutions/:id')
  updateSolution(@Param('id') id: string, @Body() body: AdminUpdateSolutionDto, @Req() req: Request) {
    return this.db.adminUpdateSolution(id, body, req.basaltAdmin)
  }

  @Delete('solutions/:id')
  deleteSolution(@Param('id') id: string, @Req() req: Request) {
    return this.db.adminDeleteSolution(id, req.basaltAdmin)
  }
}
