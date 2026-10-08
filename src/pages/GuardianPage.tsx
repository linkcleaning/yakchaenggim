import { useState } from 'react'
import { BellRing, MessageCircle, Printer } from 'lucide-react'
import type { Store } from '../store'
import {
  SLOTS,
  SLOT_LABEL,
  CONDITION_LABEL,
  CONDITION_EMOJI,
  lastNDays,
  weekday,
  keyToDate,
  formatDateKo,
  formatTime,
  dayRate,
  dateKey,
  smsLink,
  buildStatusMessage,
} from '../store'
import { Card } from '../components/ui'
import PrintReport from '../components/PrintReport'

function rateColor(rate: number, hasRecord: boolean) {
  if (!hasRecord) return 'bg-stone-200 text-stone-500'
  if (rate === 1) return 'bg-green-600 text-white'
  if (rate > 0) return 'bg-amber-400 text-black'
  return 'bg-red-500 text-white'
}

export default function GuardianPage({ store }: { store: Store }) {
  const { state } = store
  const days = lastNDays(7)
  const today = dateKey()
  const [selected, setSelected] = useState(today)
  const [reportDays, setReportDays] = useState(30)
  const { parentName, guardianPhone, parentPhone, guardianName, medNames } = state.settings

  const weekRate = Math.round((days.reduce((sum, k) => sum + dayRate(state.records[k]), 0) / days.length) * 100)
  const sel = state.records[selected]
  const todayRec = state.records[today]
  const missed = SLOTS.filter((s) => !todayRec?.doses[s])

  return (
    <div className="space-y-4 pb-4">
      {/* 오늘 요약 */}
      <Card>
        <p className="text-lg font-bold text-stone-500">{formatDateKo(today)}</p>
        <h2 className="text-2xl font-extrabold">{parentName}의 오늘</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SLOTS.map((s) => {
            const t = todayRec?.doses[s]
            return (
              <div
                key={s}
                className={`rounded-2xl p-3 text-center ${t ? 'bg-green-100 text-green-900' : 'bg-stone-100 text-stone-500'}`}
              >
                <p className="text-lg font-extrabold">{SLOT_LABEL[s]}</p>
                <p className="text-sm font-bold">{t ? `✔ ${formatTime(t)}` : '미복용'}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-lg font-bold">
          컨디션:{' '}
          {todayRec?.condition
            ? `${CONDITION_EMOJI[todayRec.condition]} ${CONDITION_LABEL[todayRec.condition]}`
            : '아직 선택 안 함'}
          {todayRec?.bp && ` · 혈압 ${todayRec.bp.sys}/${todayRec.bp.dia}`}
        </p>
        {todayRec?.condition === 'sick' && (
          <p className="mt-2 rounded-xl bg-red-50 p-3 text-lg font-bold text-red-700">
            오늘 &lsquo;아픔&rsquo;을 누르셨어요. 전화 한 통 드려보세요.
          </p>
        )}
      </Card>

      {/* 7일 달력 */}
      <Card>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">최근 7일 복약률</h2>
          <p className="text-3xl font-black text-green-700">{weekRate}%</p>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((k) => {
            const r = state.records[k]
            const rate = dayRate(r)
            const has = !!r && (Object.keys(r.doses).length > 0 || !!r.condition)
            const isSel = k === selected
            return (
              <button
                key={k}
                onClick={() => setSelected(k)}
                className={`flex flex-col items-center rounded-2xl border-2 py-2 active:scale-95 ${
                  isSel ? 'border-stone-900' : 'border-transparent'
                }`}
              >
                <span className={`text-sm font-bold ${weekday(k) === '일' ? 'text-red-600' : 'text-stone-500'}`}>
                  {weekday(k)}
                </span>
                <span
                  className={`mt-1 flex h-11 w-11 items-center justify-center rounded-full text-lg font-black ${rateColor(
                    rate,
                    has,
                  )}`}
                >
                  {keyToDate(k).getDate()}
                </span>
                <span className="mt-1 flex gap-0.5">
                  {SLOTS.map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 w-1.5 rounded-full ${r?.doses[s] ? 'bg-green-600' : 'bg-stone-300'}`}
                    />
                  ))}
                </span>
                <span className="mt-0.5 h-5 text-sm">{r?.condition ? CONDITION_EMOJI[r.condition] : ''}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-stone-600">
          <span className="flex items-center gap-1">
            <i className="h-3 w-3 rounded-full bg-green-600" /> 모두 복용
          </span>
          <span className="flex items-center gap-1">
            <i className="h-3 w-3 rounded-full bg-amber-400" /> 일부
          </span>
          <span className="flex items-center gap-1">
            <i className="h-3 w-3 rounded-full bg-red-500" /> 미복용
          </span>
          <span className="flex items-center gap-1">
            <i className="h-3 w-3 rounded-full bg-stone-200" /> 기록 없음
          </span>
        </div>

        {/* 선택한 날 자세히 */}
        <div className="mt-4 rounded-2xl bg-stone-50 p-4">
          <p className="mb-2 text-lg font-extrabold">{formatDateKo(selected)}</p>
          <ul className="space-y-1 text-lg">
            {SLOTS.map((s) => (
              <li key={s} className="flex justify-between">
                <span>
                  {SLOT_LABEL[s]} · {medNames[s]}
                </span>
                <b className={sel?.doses[s] ? 'text-green-700' : 'text-red-600'}>
                  {sel?.doses[s] ? formatTime(sel.doses[s]) : '미복용'}
                </b>
              </li>
            ))}
            <li className="flex justify-between">
              <span>컨디션</span>
              <b>{sel?.condition ? `${CONDITION_EMOJI[sel.condition]} ${CONDITION_LABEL[sel.condition]}` : '-'}</b>
            </li>
            <li className="flex justify-between">
              <span>혈압</span>
              <b>{sel?.bp ? `${sel.bp.sys}/${sel.bp.dia}${sel.bp.pulse ? ` · 맥박 ${sel.bp.pulse}` : ''}` : '-'}</b>
            </li>
          </ul>
        </div>
      </Card>

      {/* 문자 보내기 */}
      <Card className="space-y-3">
        <h2 className="text-2xl font-extrabold">문자로 알리기</h2>
        <a
          href={smsLink(guardianPhone, buildStatusMessage(state))}
          className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 text-xl font-extrabold text-white active:scale-[0.98]"
        >
          <MessageCircle className="h-7 w-7" /> 복약 확인 문자 → {guardianName}
        </a>
        {parentPhone && missed.length > 0 && (
          <a
            href={smsLink(
              parentPhone,
              `${parentName}, ${missed.map((s) => SLOT_LABEL[s]).join('·')} 약 아직 안 드셨어요. 드시고 약챙김에서 꼭 눌러주세요 😊`,
            )}
            className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-4 border-sky-700 px-4 text-xl font-extrabold text-sky-800 active:scale-[0.98]"
          >
            <BellRing className="h-7 w-7" /> {parentName}께 약 드시라고 문자
          </a>
        )}
        {!guardianPhone && (
          <p className="text-base text-stone-500">설정에서 보호자 번호를 넣으면 받는 사람이 자동으로 채워져요.</p>
        )}
      </Card>

      {/* 인쇄 */}
      <Card className="space-y-3">
        <h2 className="text-2xl font-extrabold">진료용 기록지 인쇄 / PDF</h2>
        <p className="text-lg text-stone-600">병원에서 의사 선생님께 보여드릴 복약·혈압 기록표예요.</p>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              onClick={() => setReportDays(n)}
              className={`min-h-14 rounded-2xl border-2 text-xl font-extrabold ${
                reportDays === n ? 'border-green-700 bg-green-700 text-white' : 'border-stone-300 bg-white'
              }`}
            >
              {n}일
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 text-xl font-extrabold text-white active:scale-[0.98]"
        >
          <Printer className="h-7 w-7" /> 인쇄 · PDF 저장
        </button>
        <p className="text-base text-stone-500">
          인쇄 화면에서 프린터 대신 &lsquo;PDF로 저장&rsquo;을 고르면 파일로 저장돼요. 휴대폰은 공유 → 인쇄에서 저장할 수 있어요.
        </p>
      </Card>

      <PrintReport state={state} days={reportDays} />
    </div>
  )
}
