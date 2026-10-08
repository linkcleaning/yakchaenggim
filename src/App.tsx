import { useState } from 'react'
import { Hospital, House, LayoutDashboard, Phone, Settings as SettingsIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAppStore } from './store'
import type { Mode } from './store'
import ParentPage from './pages/ParentPage'
import GuardianPage from './pages/GuardianPage'
import AppointmentPage from './pages/AppointmentPage'
import EmergencyPage from './pages/EmergencyPage'
import SettingsPage from './pages/SettingsPage'
import ReminderBanner from './components/ReminderBanner'
import InstallBanner from './components/InstallBanner'

type Tab = 'home' | 'hospital' | 'emergency' | 'settings'

const TABS: Record<Mode, { id: Tab; label: string; icon: LucideIcon }[]> = {
  parent: [
    { id: 'home', label: '오늘 약', icon: House },
    { id: 'hospital', label: '병원', icon: Hospital },
    { id: 'emergency', label: '비상 전화', icon: Phone },
  ],
  guardian: [
    { id: 'home', label: '대시보드', icon: LayoutDashboard },
    { id: 'hospital', label: '병원·예약', icon: Hospital },
    { id: 'emergency', label: '비상연락망', icon: Phone },
    { id: 'settings', label: '설정', icon: SettingsIcon },
  ],
}

export default function App() {
  const store = useAppStore()
  const { state, actions } = store
  const [tab, setTab] = useState<Tab>('home')
  const big = state.mode === 'parent'

  const switchMode = (m: Mode) => {
    actions.setMode(m)
    setTab('home')
    window.scrollTo(0, 0)
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-stone-100 print:hidden">
      {/* 상단: 모드 전환 */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xl font-black text-green-800">💊 약챙김</p>
          <p className="text-base font-bold text-stone-500">{big ? '부모님 화면' : '보호자 화면'}</p>
        </div>
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-200 p-1">
          {(['parent', 'guardian'] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={state.mode === m}
              onClick={() => switchMode(m)}
              className={`min-h-14 rounded-xl text-xl font-extrabold transition ${
                state.mode === m ? 'bg-stone-900 text-white shadow' : 'text-stone-600'
              }`}
            >
              {m === 'parent' ? '👵 부모님' : '👨‍👩‍👧 보호자'}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 pb-32 pt-4">
        {!state.installDismissed && tab === 'home' && <InstallBanner onDismiss={actions.dismissInstall} />}
        {tab !== 'hospital' && <ReminderBanner store={store} big={big} onOpen={() => setTab('hospital')} />}

        {tab === 'home' && (big ? <ParentPage store={store} /> : <GuardianPage store={store} />)}
        {tab === 'hospital' && <AppointmentPage store={store} big={big} />}
        {tab === 'emergency' && <EmergencyPage store={store} big={big} />}
        {tab === 'settings' && !big && <SettingsPage store={store} />}
      </main>

      {/* 하단 메뉴: 손가락으로 누르기 쉬운 큰 버튼 */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-stone-200 bg-white">
        <div className={`mx-auto grid max-w-lg ${big ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {TABS[state.mode].map(({ id, label, icon: Icon }) => {
            const on = tab === id
            const sos = id === 'emergency' && big
            const color = sos ? 'text-red-700' : on ? 'text-green-800' : 'text-stone-500'
            const pill = on ? (sos ? 'bg-red-100' : 'bg-green-100') : ''
            return (
              <button
                key={id}
                onClick={() => {
                  setTab(id)
                  window.scrollTo(0, 0)
                }}
                className={`flex flex-col items-center justify-center gap-1 ${big ? 'min-h-24' : 'min-h-16'} ${color}`}
              >
                <span
                  className={`flex items-center justify-center rounded-2xl px-4 py-1 ${pill}`}
                >
                  <Icon className={big ? 'h-9 w-9' : 'h-6 w-6'} strokeWidth={2.5} />
                </span>
                <span className={`font-extrabold ${big ? 'text-xl' : 'text-sm'}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
