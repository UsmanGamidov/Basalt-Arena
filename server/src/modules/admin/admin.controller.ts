import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { AdminGuard } from '../../common/guards/admin.guard'
import { AdminService } from '../../domain/admin.service'
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

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  users(
    @Query('limit', new DefaultValuePipe(500), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.admin.adminListUsers(
      Number.isFinite(limit) ? limit : 500,
      Number.isFinite(offset) ? offset : 0,
    )
  }

  @Post('users')
  createUser(@Body() body: AdminCreateUserDto, @Req() req: Request) {
    return this.admin.adminCreateUser(body, req.basaltAdmin)
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserDto, @Req() req: Request) {
    return this.admin.adminUpdateUser(id, body, req.basaltAdmin)
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Req() req: Request) {
    const admin = req.basaltAdmin
    if (!admin?.id) throw new UnauthorizedException()
    return this.admin.adminDeleteUser(admin.id, id, admin.handle)
  }

  @Get('achievements/definitions')
  listAchievementDefinitions() {
    return this.admin.adminListAchievementDefinitions()
  }

  @Post('achievements/definitions')
  createAchievementDefinition(@Body() body: AdminCreateAchievementDefinitionDto, @Req() req: Request) {
    return this.admin.adminCreateAchievementDefinition(body, req.basaltAdmin)
  }

  @Delete('achievements/definitions/:id')
  deleteAchievementDefinition(@Param('id') id: string, @Req() req: Request) {
    return this.admin.adminDeleteAchievementDefinition(id, req.basaltAdmin)
  }

  @Patch('achievements/definitions/:id')
  updateAchievementDefinition(
    @Param('id') id: string,
    @Body() body: AdminUpdateAchievementDefinitionDto,
    @Req() req: Request,
  ) {
    return this.admin.adminUpdateAchievementDefinition(id, body, req.basaltAdmin)
  }

  @Post('achievements/grant')
  grantAchievement(@Body() body: AdminGrantAchievementDto, @Req() req: Request) {
    return this.admin.adminGrantAchievement(body, req.basaltAdmin)
  }

  @Get('achievements')
  listAchievements(
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.admin.adminListAchievements(
      Number.isFinite(limit) ? limit : 200,
      Number.isFinite(offset) ? offset : 0,
    )
  }

  @Delete('achievements/:id')
  deleteAchievement(@Param('id') id: string, @Req() req: Request) {
    return this.admin.adminDeleteAchievement(id, req.basaltAdmin)
  }

  @Get('submissions')
  listAllSubmissions(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.admin.adminListAllSubmissions(
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
    return this.admin.adminListLogs(
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
    return this.admin.adminReviewSubmission(submissionId, body, req.basaltAdmin)
  }

  @Get('sprints')
  sprints() {
    return this.admin.adminListSprints()
  }

  @Post('sprints')
  createSprint(@Body() body: AdminCreateSprintDto, @Req() req: Request) {
    return this.admin.adminCreateSprint(body, req.basaltAdmin)
  }

  @Patch('sprints/:id')
  updateSprint(@Param('id') id: string, @Body() body: AdminUpdateSprintDto, @Req() req: Request) {
    return this.admin.adminUpdateSprint(id, body, req.basaltAdmin)
  }

  @Delete('sprints/:id')
  deleteSprint(@Param('id') id: string, @Req() req: Request) {
    return this.admin.adminDeleteSprint(id, req.basaltAdmin)
  }

  @Get('sprints/:id/participants')
  sprintParticipants(@Param('id') id: string) {
    return this.admin.adminListSprintEnrollments(id)
  }

  @Get('sprints/:id/submissions')
  sprintSubmissions(@Param('id') id: string) {
    return this.admin.adminListSprintSubmissions(id)
  }

  @Delete('sprints/:id/submissions/:submissionId')
  deleteSprintSubmission(
    @Param('id') sprintId: string,
    @Param('submissionId') submissionId: string,
    @Req() req: Request,
  ) {
    return this.admin.adminDeleteSubmission(sprintId, submissionId, req.basaltAdmin)
  }

  @Get('sprints/:id')
  sprintDetail(@Param('id') id: string) {
    return this.admin.adminGetSprintById(id)
  }

  @Post('sprints/:id/participants')
  addSprintParticipants(
    @Param('id') id: string,
    @Body() body: AdminSprintParticipantsDto,
    @Req() req: Request,
  ) {
    return this.admin.adminAddSprintEnrollments(id, body.userIds, req.basaltAdmin)
  }

  @Delete('sprints/:id/participants/:userId')
  removeSprintParticipant(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    return this.admin.adminRemoveSprintEnrollment(id, userId, req.basaltAdmin)
  }

  @Post('sprints/:sprintId/solutions')
  createSolution(
    @Param('sprintId') sprintId: string,
    @Body() body: AdminCreateSolutionDto,
    @Req() req: Request,
  ) {
    return this.admin.adminCreateSolution(sprintId, body, { actor: req.basaltAdmin })
  }

  @Patch('solutions/:id')
  updateSolution(@Param('id') id: string, @Body() body: AdminUpdateSolutionDto, @Req() req: Request) {
    return this.admin.adminUpdateSolution(id, body, req.basaltAdmin)
  }

  @Delete('solutions/:id')
  deleteSolution(@Param('id') id: string, @Req() req: Request) {
    return this.admin.adminDeleteSolution(id, req.basaltAdmin)
  }
}
