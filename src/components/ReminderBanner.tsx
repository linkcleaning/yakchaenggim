import { useEffect } from 'react'
import { CalendarClock } from 'lucide-react'
import type { Store } from '../store'
import { daysUntil, dDayLabel, formatDateKo, formatHHMM, upcomingAppointments } from '../store'

const ICON = `${import.meta.env.BASE_URL}icon-192.png`

/** 예약이 가까우면 화면 위에 크게 안내 + (허용 시) 휴대폰 알림 */
export default function ReminderBanner({
  store,
  big,
  onOpen,
}: {
  store: Store
  big: boolean
  onOpen: () => void
}) {
  const { state, actions } = store
  const lead = state.settings.remindDaysBefore
  const soon = upcomingAppointments(state).filter((a) => daysUntil(a.date) <= lead)

  // 휴대폰 알림: 앱이 열려 있는 동안 1분마다 확인 (예약마다 한 번만)
  useEffect(() => {
    const check = async () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      for (const a of upcomingAppointments(state)) {
        if (daysUntil(a.date) > lead || state.notifiedIds.includes(a.id)) continue
        const h = state.hospitals.find((x) => x.id === a.hospitalId)
        const title = `${dDayLabel(a.date)} 병원 예약이 있어요`
        const body = `${formatDateKo(a.date)} ${formatHHMM(a.time)} ${h?.name ?? ''} ${h?.department ?? ''}${
          a.memo ? `\n📝 ${a.memo}` : ''
        }`
        try {
          const reg = await navigator.serviceWorker?.getRegistration()
          if (reg) await reg.showNotification(title, { body, icon: ICON, tag: a.id })
          else new Notification(title, { body, icon: ICON, tag: a.id })
          actions.markNotified(a.id)
        } catch {
          /* 알림 실패 시 화면 배너로만 안내 */
        }
      }
    }
    check()
    const timer = setInterval(check, 60000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.appointments, state.notifiedIds, lead])

  if (soon.length === 0) return null

  return (
    <div className="mb-4 space-y-3">
      {soon.map((a) => {
        const h = state.hospitals.find((x) => x.id === a.hospitalId)
        const today = daysUntil(a.date) === 0
        return (
          <button
            key={a.id}
            onClick={onOpen}
            className={`flex w-full items-center gap-3 rounded-3xl text-left active:scale-[0.98] ${
              today ? 'bg-red-700' : 'bg-amber-500'
            } ${big ? 'border-4 border-black p-5 text-white' : 'p-4 text-white'}`}
          >
            <CalendarClock className={big ? 'h-14 w-14 shrink-0' : 'h-9 w-9 shrink-0'} strokeWidth={2.5} />
            <span>
              <span className={`block font-black leading-tight ${big ? 'text-[30px]' : 'text-xl'}`}>
                {dDayLabel(a.date)} 병원 가는 날!
              </span>
              <span className={`block font-bold ${big ? 'text-2xl' : 'text-lg'}`}>
                {formatHHMM(a.time)} · {h?.name} {h?.department}
              </span>
              {a.memo && <span className={`block ${big ? 'text-2xl' : 'text-base'}`}>📝 {a.memo}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
