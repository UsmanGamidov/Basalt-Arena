import { AppFooter } from '../components/layout/AppFooter.jsx'
import { AppHeader } from '../components/layout/AppHeader.jsx'
import { PageTitleRow } from '../components/main/PageTitleRow.jsx'
import { SprintTimer } from '../components/main/SprintTimer.jsx'
import { SubmissionTerminal } from '../components/main/SubmissionTerminal.jsx'
import { TaskDescriptionCard } from '../components/main/TaskDescriptionCard.jsx'
import { UserStatsCard } from '../components/main/UserStatsCard.jsx'
import { useAuth } from '../auth/useAuth.js'

const defaultStats = { position: 3, leaderboardSize: 10, points: 90 }

export function MainScreen() {
  const { user, activeSprint, stats } = useAuth()
  const statsSafe = stats ?? defaultStats

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col bg-aztec">
      <AppHeader />
      <main className="flex-1 px-0 pt-[73px]">
        <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
          <div className="flex flex-col gap-8">
            {activeSprint ? (
              <>
                <PageTitleRow title={activeSprint.title} systemActive={activeSprint.systemActive} />

                <SprintTimer endAt={activeSprint.endsAt} />

                <div className="grid grid-cols-1 gap-6 md:gap-8 xl:grid-cols-[minmax(0,1fr)_418px] xl:items-start">
                  <TaskDescriptionCard />

                  <aside className="flex flex-col gap-6">
                    <SubmissionTerminal />
                    <UserStatsCard
                      position={statsSafe.position}
                      ofTotal={statsSafe.leaderboardSize}
                      points={statsSafe.points}
                    />
                  </aside>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-plantation bg-timber/40 px-6 py-16 text-center">
                <p className="font-mono text-sm leading-relaxed text-half-baked">
                  У вас сейчас нет активного спринта. Когда наставник назначит задание, здесь появится
                  таймер и материалы — данные придут с сервера через тот же API, что и сейчас (мок).
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
