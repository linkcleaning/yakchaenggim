import { useState } from 'react'
import { Bell, CalendarPlus, MapPin, Pencil, Phone, Plus, Stethoscope, Trash2 } from 'lucide-react'
import type { Appointment, Hospital, Store } from '../store'
import {
  uid,
  dateKey,
  formatDateKo,
  formatHHMM,
  dDayLabel,
  daysUntil,
  upcomingAppointments,
  telLink,
  downloadIcs,
} from '../store'
import { Card, ConfirmDialog, Field, PrimaryButton, Sheet, TextArea } from '../components/ui'

const emptyHospital = (): Hospital => ({ id: uid('h'), name: '', department: '', doctor: '', phone: '', address: '' })

export default function AppointmentPage({ store, big }: { store: Store; big: boolean }) {
  const { state, actions } = store
  const upcoming = upcomingAppointments(state)
  const past = state.appointments
    .filter((a) => !upcoming.includes(a))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
  const hospitalOf = (id: string) => state.hospitals.find((h) => h.id === id)

  const [editHospital, setEditHospital] = useState<Hospital | null>(null)
  const [editAppt, setEditAppt] = useState<Appointment | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ kind: 'h' | 'a'; id: string; label: string } | null>(null)
  const [perm, setPerm] = useState<string>(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

  const newAppointment = () => {
    if (state.hospitals.length === 0) {
      setEditHospital(emptyHospital())
      return
    }
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setEditAppt({ id: uid('a'), hospitalId: state.hospitals[0].id, date: dateKey(nextWeek), time: '10:00', memo: '' })
  }

  const askPermission = async () => {
    if (typeof Notification === 'undefined') return
    const r = await Notification.requestPermission()
    setPerm(r)
  }

  /* ───── 부모님 모드: 큰 글씨로 보기만 ───── */
  if (big) {
    return (
      <div className="space-y-4 pb-4 text-stone-950">
        <h1 className="px-1 text-[30px] font-black">병원 예약</h1>
        {upcoming.length === 0 && (
          <p className="rounded-3xl border-4 border-stone-900 bg-white p-6 text-2xl font-bold">
            다가오는 병원 예약이 없어요.
          </p>
        )}
        {upcoming.map((a) => {
          const h = hospitalOf(a.hospitalId)
          const soon = daysUntil(a.date) <= 1
          return (
            <div
              key={a.id}
              className={`rounded-3xl border-4 p-5 ${soon ? 'border-red-700 bg-red-50' : 'border-stone-900 bg-white'}`}
            >
              <span
                className={`inline-block rounded-full px-4 py-1 text-2xl font-black text-white ${
                  soon ? 'bg-red-700' : 'bg-stone-900'
                }`}
              >
                {dDayLabel(a.date)}
              </span>
              <p className="mt-3 text-[30px] font-black leading-tight">{formatDateKo(a.date)}</p>
              <p className="text-[30px] font-black text-green-800">{formatHHMM(a.time)}</p>
              <p className="mt-2 text-[26px] font-bold">
                {h?.name} {h?.department}
              </p>
              {h?.doctor && <p className="text-2xl">{h.doctor}</p>}
              {a.memo && <p className="mt-2 rounded-xl bg-amber-100 p-3 text-2xl font-bold">📝 {a.memo}</p>}
              {h?.phone && (
                <a
                  href={telLink(h.phone)}
                  className="mt-4 flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-green-700 text-[26px] font-black text-white active:scale-[0.98]"
                >
                  <Phone className="h-9 w-9" /> 병원에 전화
                </a>
              )}
            </div>
          )
        })}

        {state.hospitals.length > 0 && (
          <>
            <h2 className="px-1 pt-2 text-[26px] font-black">다니는 병원</h2>
            {state.hospitals.map((h) => (
              <div key={h.id} className="rounded-3xl border-4 border-stone-900 bg-white p-5">
                <p className="text-[26px] font-black">
                  {h.name} <span className="text-stone-600">{h.department}</span>
                </p>
                {h.address && <p className="mt-1 text-xl">{h.address}</p>}
                {h.phone && (
                  <a
                    href={telLink(h.phone)}
                    className="mt-3 flex min-h-16 items-center justify-center gap-2 rounded-2xl border-4 border-green-700 text-2xl font-black text-green-800"
                  >
                    <Phone className="h-8 w-8" /> {h.phone}
                  </a>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  /* ───── 보호자 모드: 관리 ───── */
  return (
    <div className="space-y-4 pb-4">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">다가오는 예약</h2>
          <button
            onClick={newAppointment}
            className="flex min-h-12 items-center gap-1 rounded-xl bg-green-700 px-4 text-lg font-bold text-white"
          >
            <Plus className="h-5 w-5" /> 예약 추가
          </button>
        </div>
        {upcoming.length === 0 && <p className="text-lg text-stone-500">등록된 예약이 없어요.</p>}
        <ul className="space-y-3">
          {upcoming.map((a) => {
            const h = hospitalOf(a.hospitalId)
            return (
              <li key={a.id} className="rounded-2xl border-2 border-stone-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-stone-900 px-3 py-0.5 text-sm font-bold text-white">
                      {dDayLabel(a.date)}
                    </span>
                    <p className="mt-1 text-xl font-extrabold">
                      {formatDateKo(a.date)} {formatHHMM(a.time)}
                    </p>
                    <p className="text-lg">
                      {h?.name} {h?.department} {h?.doctor}
                    </p>
                    {a.memo && <p className="text-base text-stone-600">📝 {a.memo}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditAppt(a)}
                      aria-label="수정"
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setConfirmDel({ kind: 'a', id: a.id, label: `${formatDateKo(a.date)} 예약` })}
                      aria-label="삭제"
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => downloadIcs(a, h, state.settings.parentName)}
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-green-700 text-lg font-bold text-green-800"
                >
                  <CalendarPlus className="h-5 w-5" /> 휴대폰 캘린더에 추가
                </button>
              </li>
            )
          })}
        </ul>
        {past.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-lg font-bold text-stone-500">지난 예약 보기</summary>
            <ul className="mt-2 space-y-1 text-base text-stone-600">
              {past.map((a) => (
                <li key={a.id}>
                  {formatDateKo(a.date)} · {hospitalOf(a.hospitalId)?.name}
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      {/* 알림 설정 */}
      <Card>
        <h2 className="mb-2 flex items-center gap-2 text-2xl font-extrabold">
          <Bell className="h-6 w-6" /> 예약 알림
        </h2>
        <p className="text-lg text-stone-600">
          예약 <b>{state.settings.remindDaysBefore}일 전</b>부터 앱 첫 화면에 크게 안내하고, 알림을 허용하면 앱을 열 때
          휴대폰 알림도 보내요. 앱을 안 열어도 울리게 하려면 위 &lsquo;휴대폰 캘린더에 추가&rsquo;를 눌러주세요.
        </p>
        {perm === 'granted' ? (
          <p className="mt-3 rounded-xl bg-green-50 p-3 text-lg font-bold text-green-800">✔ 알림이 켜져 있어요</p>
        ) : perm === 'unsupported' ? (
          <p className="mt-3 rounded-xl bg-stone-100 p-3 text-base text-stone-600">
            이 브라우저는 알림을 지원하지 않아요. 아이폰은 홈 화면에 추가한 뒤 열면 알림을 켤 수 있어요.
          </p>
        ) : perm === 'denied' ? (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-base text-red-700">
            알림이 차단돼 있어요. 휴대폰 설정 → 브라우저 → 알림에서 허용해주세요.
          </p>
        ) : (
          <PrimaryButton onClick={askPermission} className="mt-3">
            <Bell className="h-6 w-6" /> 알림 허용하기
          </PrimaryButton>
        )}
      </Card>

      {/* 병원 목록 */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold">
            <Stethoscope className="h-6 w-6" /> 다니는 병원
          </h2>
          <button
            onClick={() => setEditHospital(emptyHospital())}
            className="flex min-h-12 items-center gap-1 rounded-xl bg-stone-900 px-4 text-lg font-bold text-white"
          >
            <Plus className="h-5 w-5" /> 병원 추가
          </button>
        </div>
        {state.hospitals.length === 0 && (
          <p className="text-lg text-stone-500">병원을 먼저 등록하면 예약을 추가할 수 있어요.</p>
        )}
        <ul className="space-y-3">
          {state.hospitals.map((h) => (
            <li key={h.id} className="flex items-start justify-between gap-2 rounded-2xl border-2 border-stone-200 p-4">
              <div className="min-w-0">
                <p className="text-xl font-extrabold">
                  {h.name} <span className="font-bold text-stone-500">{h.department}</span>
                </p>
                {h.doctor && <p className="text-lg">{h.doctor}</p>}
                {h.phone && (
                  <a href={telLink(h.phone)} className="flex items-center gap-1 text-lg font-bold text-green-700">
                    <Phone className="h-4 w-4" /> {h.phone}
                  </a>
                )}
                {h.address && (
                  <p className="flex items-center gap-1 text-base text-stone-600">
                    <MapPin className="h-4 w-4 shrink-0" /> {h.address}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditHospital(h)}
                  aria-label="수정"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setConfirmDel({ kind: 'h', id: h.id, label: h.name })}
                  aria-label="삭제"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {editHospital && (
        <HospitalSheet
          initial={editHospital}
          onClose={() => setEditHospital(null)}
          onSave={(h) => {
            actions.saveHospital(h)
            setEditHospital(null)
          }}
        />
      )}

      {editAppt && (
        <AppointmentSheet
          initial={editAppt}
          hospitals={state.hospitals}
          onClose={() => setEditAppt(null)}
          onSave={(a) => {
            actions.saveAppointment(a)
            setEditAppt(null)
          }}
        />
      )}

      {confirmDel && (
        <ConfirmDialog
          message={
            <>
              &lsquo;{confirmDel.label}&rsquo;
              <br />
              삭제할까요?
              {confirmDel.kind === 'h' && (
                <span className="mt-2 block text-lg text-stone-500">이 병원의 예약도 함께 지워져요.</span>
              )}
            </>
          }
          confirmText="삭제"
          cancelText="취소"
          danger
          onConfirm={() => {
            if (confirmDel.kind === 'h') actions.deleteHospital(confirmDel.id)
            else actions.deleteAppointment(confirmDel.id)
            setConfirmDel(null)
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

function HospitalSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: Hospital
  onClose: () => void
  onSave: (h: Hospital) => void
}) {
  const [h, setH] = useState(initial)
  const set = (k: keyof Hospital) => (v: string) => setH({ ...h, [k]: v })
  return (
    <Sheet title="병원 정보" onClose={onClose}>
      <Field label="병원 이름 *" value={h.name} onChange={set('name')} placeholder="예: 서귀포의료원" />
      <Field label="진료과" value={h.department} onChange={set('department')} placeholder="예: 내과" />
      <Field label="담당 의사" value={h.doctor} onChange={set('doctor')} placeholder="예: 김OO 선생님" />
      <Field label="전화번호" value={h.phone} onChange={set('phone')} type="tel" inputMode="tel" />
      <Field label="주소" value={h.address} onChange={set('address')} />
      <PrimaryButton disabled={!h.name.trim()} onClick={() => onSave({ ...h, name: h.name.trim() })}>
        저장
      </PrimaryButton>
    </Sheet>
  )
}

function AppointmentSheet({
  initial,
  hospitals,
  onClose,
  onSave,
}: {
  initial: Appointment
  hospitals: Hospital[]
  onClose: () => void
  onSave: (a: Appointment) => void
}) {
  const [a, setA] = useState(initial)
  return (
    <Sheet title="병원 예약" onClose={onClose}>
      <label className="mb-4 block">
        <span className="mb-1 block text-lg font-bold text-stone-700">병원</span>
        <select
          value={a.hospitalId}
          onChange={(e) => setA({ ...a, hospitalId: e.target.value })}
          className="h-14 w-full rounded-xl border-2 border-stone-300 bg-white px-3"
        >
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} {h.department}
            </option>
          ))}
        </select>
      </label>
      <Field label="날짜" type="date" value={a.date} onChange={(v) => setA({ ...a, date: v })} />
      <Field label="시간" type="time" value={a.time} onChange={(v) => setA({ ...a, time: v })} />
      <TextArea
        label="메모 (챙길 것)"
        value={a.memo}
        onChange={(v) => setA({ ...a, memo: v })}
        placeholder="예: 아침 금식, 혈압 수첩 챙기기"
      />
      <PrimaryButton disabled={!a.date || !a.time} onClick={() => onSave(a)}>
        저장
      </PrimaryButton>
    </Sheet>
  )
}
