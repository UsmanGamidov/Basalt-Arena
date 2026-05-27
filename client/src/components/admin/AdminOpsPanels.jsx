import { AdminAccessPanel } from './AdminAccessPanel.jsx'
import { AdminAchievementsPanel } from './AdminAchievementsPanel.jsx'
import { AdminSprintSolutionsPanel } from './AdminSprintSolutionsPanel.jsx'
import { AdminSubmissionsPanel } from './AdminSubmissionsPanel.jsx'
import { AdminLogsPanel } from './AdminLogsPanel.jsx'

export function AdminOpsPanels({
  section,
  achievements,
  access,
  solutions,
  submissions,
  logs,
}) {
  return (
    <div className="flex flex-col gap-6 xl:gap-8">
      {section === 'achievements' ? (
        <AdminAchievementsPanel
          definitions={achievements.definitions}
          achievements={achievements.issued}
          definitionsLoading={achievements.definitionsLoading}
          onCreateDefinition={achievements.onCreateDefinition}
          createBusy={achievements.createBusy}
          newTitle={achievements.newTitle}
          setNewTitle={achievements.setNewTitle}
          newSubtitle={achievements.newSubtitle}
          setNewSubtitle={achievements.setNewSubtitle}
          newIcon={achievements.newIcon}
          setNewIcon={achievements.setNewIcon}
          newVariant={achievements.newVariant}
          setNewVariant={achievements.setNewVariant}
          updateDefinitionBusyId={achievements.updateDefinitionBusyId}
          onUpdateDefinition={achievements.onUpdateDefinition}
          onDeleteDefinition={achievements.onDeleteDefinition}
          users={achievements.users}
          grantDefinitionId={achievements.grantDefinitionId}
          setGrantDefinitionId={achievements.setGrantDefinitionId}
          grantUserSearch={achievements.grantUserSearch}
          setGrantUserSearch={achievements.setGrantUserSearch}
          grantSelectedUserIds={achievements.grantSelectedUserIds}
          onToggleGrantUser={achievements.onToggleGrantUser}
          onSelectAllGrantUsers={achievements.onSelectAllGrantUsers}
          onClearGrantUsers={achievements.onClearGrantUsers}
          onGrant={achievements.onGrant}
          grantBusy={achievements.grantBusy}
          onRevokeAchievement={achievements.onRevokeAchievement}
          revokeAchievementBusyId={achievements.revokeAchievementBusyId}
        />
      ) : null}

      {section === 'access' ? (
        <AdminAccessPanel
          sprints={access.sprints}
          accessSprintId={access.accessSprintId}
          onAccessSprintChange={access.onAccessSprintChange}
          users={access.users}
          participants={access.participants}
          participantsLoading={access.participantsLoading}
          selectedUserIds={access.selectedUserIds}
          onToggleUserSelected={access.onToggleUserSelected}
          onSelectAll={access.onSelectAll}
          onResetSelection={access.onResetSelection}
          onSave={access.onSave}
          saveBusy={access.saveBusy}
          searchQuery={access.searchQuery}
          onSearchQueryChange={access.onSearchQueryChange}
        />
      ) : null}

      {section === 'solutions' ? (
        <AdminSprintSolutionsPanel
          sprints={solutions.sprints}
          users={solutions.users}
          solutionsSprintId={solutions.sprintId}
          onSolutionsSprintChange={solutions.onSprintChange}
          detailLoading={solutions.detailLoading}
          solutions={solutions.rows}
          solutionsSearchQuery={solutions.searchQuery}
          onSolutionsSearchChange={solutions.onSearchQueryChange}
          solutionDrafts={solutions.drafts}
          setSolutionDrafts={solutions.setDrafts}
          solUserId={solutions.solUserId}
          onSolUserIdChange={solutions.onSolUserIdChange}
          solMentor={solutions.solMentor}
          onSolMentorChange={solutions.onSolMentorChange}
          solCodeUrl={solutions.solCodeUrl}
          onSolCodeUrlChange={solutions.onSolCodeUrlChange}
          solDemoUrl={solutions.solDemoUrl}
          onSolDemoUrlChange={solutions.onSolDemoUrlChange}
          solBusy={solutions.solBusy}
          onAddSolution={solutions.onAddSolution}
          onDeleteSolution={solutions.onDeleteSolution}
          onSaveDirty={solutions.onSaveDirty}
          saveBusy={solutions.saveBusy}
          dirtyCount={solutions.dirtyCount}
          statusText={solutions.statusText}
        />
      ) : null}

      {section === 'submissions' ? (
        <AdminSubmissionsPanel
          sprints={submissions.sprints}
          sprintFilter={submissions.sprintFilter}
          onSprintFilterChange={submissions.onSprintFilterChange}
          searchQuery={submissions.searchQuery}
          onSearchQueryChange={submissions.onSearchQueryChange}
          statusFilter={submissions.statusFilter}
          onStatusFilterChange={submissions.onStatusFilterChange}
          statusOptions={submissions.statusOptions}
          rows={submissions.rows}
          loading={submissions.loading}
          statusClassFn={submissions.statusClassFn}
          reviewBusyId={submissions.reviewBusyId}
          onReview={submissions.onReview}
          onDelete={submissions.onDelete}
          dateSortDir={submissions.dateSortDir}
          onToggleDateSort={submissions.onToggleDateSort}
          pagination={submissions.pagination}
        />
      ) : null}

      {section === 'logs' ? (
        <AdminLogsPanel
          query={logs.query}
          onQueryChange={logs.onQueryChange}
          rows={logs.rows}
          loading={logs.loading}
          pagination={logs.pagination}
        />
      ) : null}
    </div>
  )
}
