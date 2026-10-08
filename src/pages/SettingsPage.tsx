import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import type { AppState, Settings, Store } from '../store'
import { SLOTS, SLOT_LABEL, dateKey, defaultState } from '../store'
import { Card, ConfirmDialog, Field, PrimaryButton } from '../components/ui'

export default function SettingsPage({ store }: { store: Store }) {
  const { state, actions } = store
  const [s, setS] = useState<Settings>(state.settings)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const save = () => {
    actions.setSettings(s)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `약챙김_백업_${dateKey()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as AppState
      if (!data || typeof data !== 'object' || !('records' in data)) throw new Error()
      actions.importAll(data)
      setS({ ...state.settings, ...data.settings })
      setMsg('✔ 백업을 불러왔어요.')
    } catch {
      setMsg('백업 파일이 아니에요. 약챙김에서 저장한 .json 파일을 골라주세요.')
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <Card>
        <h2 className="mb-4 text-2xl font-extrabold">기본 정보</h2>
        <Field
          label="부모님 호칭"
          value={s.parentName}
          onChange={(v) => setS({ ...s, parentName: v })}
          placeholder="예: 어머니, 아버지"
        />
        <Field
          label="부모님 전화번호 (약 드시라고 문자 보낼 때)"
          value={s.parentPhone}
          onChange={(v) => setS({ ...s, parentPhone: v })}
          type="tel"
          inputMode="tel"
        />
        <Field
          label="보호자 호칭"
          value={s.guardianName}
          onChange={(v) => setS({ ...s, guardianName: v })}
          placeholder="예: 큰딸, 아들"
        />
        <Field
          label="보호자 전화번호 (복약 문자 받을 번호)"
          value={s.guardianPhone}
          onChange={(v) => setS({ ...s, guardianPhone: v })}
          type="tel"
          inputMode="tel"
          placeholder="010-0000-0000"
        />

        <h3 className="mb-2 mt-2 text-xl font-extrabold">약 이름 (부모님 화면에 크게 보여요)</h3>
        {SLOTS.map((slot) => (
          <Field
            key={slot}
            label={SLOT_LABEL[slot]}
            value={s.medNames[slot]}
            onChange={(v) => setS({ ...s, medNames: { ...s.medNames, [slot]: v } })}
            placeholder={`예: ${SLOT_LABEL[slot]} 혈압약`}
          />
        ))}

        <label className="mb-4 block">
          <span className="mb-1 block text-lg font-bold text-stone-700">병원 예약 미리 알림</span>
          <select
            value={s.remindDaysBefore}
            onChange={(e) => setS({ ...s, remindDaysBefore: Number(e.target.value) })}
            className="h-14 w-full rounded-xl border-2 border-stone-300 bg-white px-3"
          >
            {[0, 1, 2, 3, 7].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? '당일만' : `${n}일 전부터`}
              </option>
            ))}
          </select>
        </label>

        <PrimaryButton onClick={save}>{saved ? '저장했어요 ✔' : '저장'}</PrimaryButton>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-2xl font-extrabold">백업 · 옮기기</h2>
        <p className="text-base text-stone-600">
          기록은 이 휴대폰 안에만 저장돼요. 휴대폰을 바꾸거나 앱 데이터를 지우기 전에 백업 파일을 저장해두세요.
        </p>
        <button
          onClick={exportData}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 text-lg font-bold"
        >
          <Download className="h-5 w-5" /> 백업 파일 저장
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 text-lg font-bold"
        >
          <Upload className="h-5 w-5" /> 백업 파일 불러오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importData(f)
            e.target.value = ''
          }}
        />
        {msg && <p className="text-base font-bold">{msg}</p>}
        <button onClick={() => setConfirmReset(true)} className="w-full py-3 text-base font-bold text-red-600 underline">
          모든 기록 지우기
        </button>
      </Card>

      {confirmReset && (
        <ConfirmDialog
          message={
            <>
              모든 복약 기록과 병원·연락처를
              <br />
              지울까요? 되돌릴 수 없어요.
            </>
          }
          confirmText="모두 지우기"
          cancelText="취소"
          danger
          onConfirm={() => {
            actions.resetAll()
            setS(defaultState.settings)
            setConfirmReset(false)
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}
