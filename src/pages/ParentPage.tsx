import { useState } from 'react'
import { Check, HeartPulse, MessageCircle, Moon, Sun, Sunrise } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Store, Slot, Condition } from '../store'
import {
  SLOTS,
  CONDITION_LABEL,
  CONDITION_EMOJI,
  dateKey,
  formatDateKo,
  formatTime,
  smsLink,
  buildStatusMessage,
} from '../store'
import { ConfirmDialog } from '../components/ui'

const SLOT_ICON: Record<Slot, LucideIcon> = { morning: Sunrise, lunch: Sun, dinner: Moon }

const CONDITION_STYLE: Record<Condition, { on: string; off: string }> = {
  good: { on: 'bg-green-700 text-white border-green-900', off: 'bg-white border-stone-900' },
  normal: { on: 'bg-amber-400 text-black border-amber-700', off: 'bg-white border-stone-900' },
  sick: { on: 'bg-red-600 text-white border-red-900', off: 'bg-white border-stone-900' },
}

export default function ParentPage({ store }: { store: Store }) {
  const { state, actions } = store
  const today = dateKey()
  const rec = state.records[today] ?? { doses: {} }
  const { medNames, guardianPhone, guardianName, parentName } = state.settings
  const takenCount = SLOTS.filter((s) => rec.doses[s]).length

  const [undoSlot, setUndoSlot] = useState<Slot | null>(null)
  const [sys, setSys] = useState('')
  const [dia, setDia] = useState('')
  const [pulse, setPulse] = useState('')
  const [bpSaved, setBpSaved] = useState(false)

  const pressDose = (slot: Slot) => {
    if (rec.doses[slot]) {
      setUndoSlot(slot) // 이미 체크된 것은 한 번 더 확인
      return
    }
    actions.toggleDose(slot)
    navigator.vibrate?.(80)
  }

  const saveBp = () => {
    const s = Number(sys)
    const d = Number(dia)
    if (!s || !d) return
    actions.setBloodPressure({ sys: s, dia: d, pulse: Number(pulse) || undefined, time: new Date().toISOString() })
    setSys('')
    setDia('')
    setPulse('')
    setBpSaved(true)
    setTimeout(() => setBpSaved(false), 2500)
  }

  return (
    <div className="space-y-5 pb-4 text-stone-950">
      {/* 날짜 */}
      <div className="px-1 pt-1">
        <p className="text-[28px] font-extrabold leading-tight">{formatDateKo(today)}</p>
        <p className="mt-1 text-2xl font-bold text-stone-700">
          {takenCount === 3 ? `${parentName}, 오늘 약 다 드셨어요! 👏` : `오늘 약 ${takenCount}번 / 3번 드셨어요`}
        </p>
      </div>

      {/* 약 버튼 3개 */}
      <div className="space-y-4">
        {SLOTS.map((slot) => {
          const taken = rec.doses[slot]
          const Icon = SLOT_ICON[slot]
          return (
            <button
              key={slot}
              onClick={() => pressDose(slot)}
              aria-pressed={!!taken}
              className={`flex min-h-[128px] w-full items-center gap-4 rounded-3xl border-4 px-5 py-4 text-left transition active:scale-[0.98] ${
                taken ? 'border-green-900 bg-green-700 text-white' : 'border-stone-900 bg-white text-stone-950'
              }`}
            >
              <span
                className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-4 ${
                  taken ? 'border-white bg-white text-green-700' : 'border-stone-900 bg-stone-100'
                }`}
              >
                {taken ? <Check className="h-12 w-12" strokeWidth={4} /> : <Icon className="h-10 w-10" strokeWidth={2.5} />}
              </span>
              <span className="flex-1">
                <span className="block text-[32px] font-black leading-tight">{medNames[slot]}</span>
                <span className={`mt-1 block text-2xl font-bold ${taken ? 'text-green-50' : 'text-stone-600'}`}>
                  {taken ? `복용 완료 · ${formatTime(taken)}` : '드시고 꾹 누르세요'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* 컨디션 */}
      <section className="rounded-3xl border-4 border-stone-900 bg-white p-5">
        <h2 className="mb-4 text-[28px] font-black">오늘 컨디션은요?</h2>
        <div className="grid grid-cols-3 gap-3">
          {(['good', 'normal', 'sick'] as Condition[]).map((c) => {
            const on = rec.condition === c
            return (
              <button
                key={c}
                onClick={() => {
                  actions.setCondition(c)
                  navigator.vibrate?.(60)
                }}
                aria-pressed={on}
                className={`flex min-h-[120px] flex-col items-center justify-center rounded-2xl border-4 active:scale-95 ${
                  on ? CONDITION_STYLE[c].on : CONDITION_STYLE[c].off
                }`}
              >
                <span className="text-5xl leading-none">{CONDITION_EMOJI[c]}</span>
                <span className="mt-2 text-[26px] font-black">{CONDITION_LABEL[c]}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 혈압 */}
      <section className="rounded-3xl border-4 border-stone-900 bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 text-[28px] font-black">
          <HeartPulse className="h-8 w-8 text-red-600" strokeWidth={2.5} /> 혈압 적기
        </h2>
        {rec.bp && (
          <p className="mb-3 text-2xl font-bold text-green-800">
            오늘 기록: {rec.bp.sys} / {rec.bp.dia}
            {rec.bp.pulse ? ` · 맥박 ${rec.bp.pulse}` : ''}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-2xl font-bold">높은 혈압</span>
            <input
              inputMode="numeric"
              value={sys}
              onChange={(e) => setSys(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="120"
              className="mt-1 h-20 w-full rounded-2xl border-4 border-stone-900 text-center text-[40px] font-black"
            />
          </label>
          <label className="block">
            <span className="block text-2xl font-bold">낮은 혈압</span>
            <input
              inputMode="numeric"
              value={dia}
              onChange={(e) => setDia(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="80"
              className="mt-1 h-20 w-full rounded-2xl border-4 border-stone-900 text-center text-[40px] font-black"
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="block text-2xl font-bold">맥박 (없으면 비워두세요)</span>
          <input
            inputMode="numeric"
            value={pulse}
            onChange={(e) => setPulse(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="70"
            className="mt-1 h-20 w-full rounded-2xl border-4 border-stone-900 text-center text-[40px] font-black"
          />
        </label>
        <button
          onClick={saveBp}
          disabled={!sys || !dia}
          className="mt-4 min-h-20 w-full rounded-2xl bg-stone-900 text-[28px] font-black text-white active:scale-[0.98] disabled:bg-stone-300"
        >
          {bpSaved ? '저장했어요 ✔' : '혈압 저장'}
        </button>
      </section>

      {/* 자녀에게 알리기 */}
      {guardianPhone ? (
        <a
          href={smsLink(guardianPhone, buildStatusMessage(state))}
          className="flex min-h-24 w-full items-center justify-center gap-3 rounded-3xl bg-sky-700 text-[28px] font-black text-white active:scale-[0.98]"
        >
          <MessageCircle className="h-10 w-10" strokeWidth={2.5} /> {guardianName}에게 문자 보내기
        </a>
      ) : (
        <p className="rounded-2xl bg-stone-200 p-4 text-xl font-bold text-stone-700">
          자녀 전화번호가 없어요. 위쪽 [보호자] → 설정에서 넣어주세요.
        </p>
      )}

      {undoSlot && (
        <ConfirmDialog
          message={
            <>
              {medNames[undoSlot]} 체크를
              <br />
              취소할까요?
            </>
          }
          confirmText="네, 취소할게요"
          cancelText="아니요, 그대로 둘게요"
          danger
          onConfirm={() => {
            actions.toggleDose(undoSlot)
            setUndoSlot(null)
          }}
          onCancel={() => setUndoSlot(null)}
        />
      )}
    </div>
  )
}
