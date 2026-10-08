import { createPortal } from 'react-dom'
import type { AppState } from '../store'
import {
  SLOTS,
  SLOT_LABEL,
  CONDITION_LABEL,
  lastNDays,
  formatDateKo,
  formatTime,
  dayRate,
  formatHHMM,
  upcomingAppointments,
} from '../store'

/** 인쇄할 때만 보이는 진료용 기록지. 인쇄 창에서 'PDF로 저장'을 고르면 PDF가 됩니다. */
export default function PrintReport({ state, days }: { state: AppState; days: number }) {
  // 앱을 쓰기 시작한 날 이전은 빼고 계산 (최신 날짜가 위로)
  const firstKey = Object.keys(state.records).sort()[0] ?? lastNDays(1)[0]
  const keys = lastNDays(days)
    .filter((k) => k >= firstKey)
    .reverse()
  const { settings, medical, hospitals } = state
  const recs = keys.map((k) => state.records[k])
  const totalRate = Math.round((recs.reduce((sum, r) => sum + dayRate(r), 0) / keys.length) * 100)
  const bps = recs.filter((r) => r?.bp).map((r) => r!.bp!)
  const avg = (ns: number[]) => (ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0)
  const next = upcomingAppointments(state)

  const report = (
    <div className="hidden bg-white text-[11pt] leading-snug text-black print:block">
      <div className="mb-3 flex items-end justify-between border-b-2 border-black pb-2">
        <div>
          <h1 className="text-[18pt] font-extrabold">복약 및 혈압 기록지</h1>
          <p>
            환자: <b>{settings.parentName}</b> · 기간: {formatDateKo(keys[keys.length - 1])} ~ {formatDateKo(keys[0])} (
            {keys.length}일)
          </p>
        </div>
        <p className="text-right text-[9pt]">출력일 {formatDateKo(lastNDays(1)[0])}</p>
      </div>

      <table className="mb-3 w-full border-collapse text-[10pt]">
        <tbody>
          <tr>
            <td className="w-1/4 border border-black bg-stone-100 px-2 py-1 font-bold">복용 중인 약</td>
            <td className="border border-black px-2 py-1">
              {medical.medications ||
                SLOTS.map((s) => `${SLOT_LABEL[s]}: ${settings.medNames[s]}`).join(' / ')}
            </td>
          </tr>
          <tr>
            <td className="border border-black bg-stone-100 px-2 py-1 font-bold">지병 / 알레르기</td>
            <td className="border border-black px-2 py-1">
              {medical.conditions || '-'} / {medical.allergies || '-'}
            </td>
          </tr>
          <tr>
            <td className="border border-black bg-stone-100 px-2 py-1 font-bold">요약</td>
            <td className="border border-black px-2 py-1">
              기간 복약률 <b>{totalRate}%</b>
              {bps.length > 0 && (
                <>
                  {' '}
                  · 혈압 평균 <b>{avg(bps.map((b) => b.sys))}/{avg(bps.map((b) => b.dia))}</b> mmHg (측정 {bps.length}회,
                  최고 {Math.max(...bps.map((b) => b.sys))}/{Math.max(...bps.map((b) => b.dia))})
                </>
              )}
            </td>
          </tr>
          {hospitals.length > 0 && (
            <tr>
              <td className="border border-black bg-stone-100 px-2 py-1 font-bold">다니는 병원</td>
              <td className="border border-black px-2 py-1">
                {hospitals.map((h) => [h.name, h.department, h.doctor].filter(Boolean).join(' ')).join(' / ')}
                {next[0] && (
                  <>
                    {' '}
                    · 다음 예약 {formatDateKo(next[0].date)} {formatHHMM(next[0].time)}
                  </>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <table className="w-full border-collapse text-center text-[10pt]">
        <thead>
          <tr className="bg-stone-100">
            <th className="border border-black px-1 py-1">날짜</th>
            {SLOTS.map((s) => (
              <th key={s} className="border border-black px-1 py-1">
                {SLOT_LABEL[s]}
              </th>
            ))}
            <th className="border border-black px-1 py-1">복약률</th>
            <th className="border border-black px-1 py-1">혈압 (맥박)</th>
            <th className="border border-black px-1 py-1">컨디션</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const r = state.records[k]
            return (
              <tr key={k} className="break-inside-avoid">
                <td className="border border-black px-1 py-1 text-left">{formatDateKo(k)}</td>
                {SLOTS.map((s) => (
                  <td key={s} className="border border-black px-1 py-1">
                    {r?.doses[s] ? `○ ${formatTime(r.doses[s])}` : '✕'}
                  </td>
                ))}
                <td className="border border-black px-1 py-1">{Math.round(dayRate(r) * 100)}%</td>
                <td className="border border-black px-1 py-1">
                  {r?.bp ? `${r.bp.sys}/${r.bp.dia}${r.bp.pulse ? ` (${r.bp.pulse})` : ''}` : '-'}
                </td>
                <td className="border border-black px-1 py-1">{r?.condition ? CONDITION_LABEL[r.condition] : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[9pt]">○ 복용(시각) · ✕ 미복용 또는 미기록 · 본 기록은 가정에서 직접 입력한 자료입니다.</p>
    </div>
  )

  return createPortal(report, document.body)
}
