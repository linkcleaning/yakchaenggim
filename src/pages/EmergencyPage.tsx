import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Phone, Plus, Siren, Trash2 } from 'lucide-react'
import type { Contact, MedicalInfo, Store } from '../store'
import { uid, telLink } from '../store'
import { Card, ConfirmDialog, Field, PrimaryButton, Sheet, TextArea } from '../components/ui'

export default function EmergencyPage({ store, big }: { store: Store; big: boolean }) {
  const { state, actions } = store
  const { contacts, medical, settings } = state
  const [edit, setEdit] = useState<Contact | null>(null)
  const [del, setDel] = useState<Contact | null>(null)
  const [editMed, setEditMed] = useState(false)
  const hasMedical = Object.values(medical).some((v) => v.trim())

  const medicalCard = (
    <div className={`rounded-3xl bg-white p-5 ${big ? 'border-4 border-red-700' : 'shadow-sm'}`}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={`font-black text-red-700 ${big ? 'text-[26px]' : 'text-2xl'}`}>🚑 응급 의료 정보</h2>
        {!big && (
          <button
            onClick={() => setEditMed(true)}
            className="flex min-h-12 items-center gap-1 rounded-xl bg-stone-100 px-4 text-lg font-bold"
          >
            <Pencil className="h-5 w-5" /> 수정
          </button>
        )}
      </div>
      <p className={`mb-2 text-stone-600 ${big ? 'text-xl' : 'text-base'}`}>구급대원·의료진에게 이 화면을 보여주세요.</p>
      <dl className={`grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 ${big ? 'text-2xl' : 'text-lg'}`}>
        <dt className="font-bold">이름</dt>
        <dd>{settings.parentName}</dd>
        <dt className="font-bold">혈액형</dt>
        <dd>{medical.bloodType || '-'}</dd>
        <dt className="font-bold">지병</dt>
        <dd>{medical.conditions || '-'}</dd>
        <dt className="font-bold">알레르기</dt>
        <dd>{medical.allergies || '-'}</dd>
        <dt className="font-bold">복용 약</dt>
        <dd>{medical.medications || '-'}</dd>
      </dl>
      {!hasMedical && !big && (
        <p className="mt-2 text-base text-stone-500">수정을 눌러 혈액형·지병·복용 약을 적어두세요.</p>
      )}
    </div>
  )

  /* ───── 부모님 모드: 크게 누르면 바로 전화 ───── */
  if (big) {
    return (
      <div className="space-y-4 pb-4">
        <h1 className="flex items-center gap-2 px-1 text-[30px] font-black">
          <Siren className="h-9 w-9 text-red-600" /> 비상 연락
        </h1>
        <p className="px-1 text-2xl font-bold text-stone-700">이름을 누르면 바로 전화가 걸려요.</p>
        {contacts.map((c) => {
          const is119 = c.phone.replace(/\D/g, '') === '119'
          return (
            <a
              key={c.id}
              href={telLink(c.phone)}
              className={`flex min-h-[112px] items-center gap-4 rounded-3xl border-4 px-5 active:scale-[0.98] ${
                is119 ? 'border-red-900 bg-red-600 text-white' : 'border-stone-900 bg-white text-stone-950'
              }`}
            >
              <span
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ${
                  is119 ? 'bg-white text-red-600' : 'bg-green-700 text-white'
                }`}
              >
                <Phone className="h-10 w-10" strokeWidth={2.5} />
              </span>
              <span>
                <span className="block text-[32px] font-black leading-tight">{c.name}</span>
                <span className={`block text-2xl font-bold ${is119 ? 'text-red-50' : 'text-stone-600'}`}>
                  {c.relation} · {c.phone}
                </span>
              </span>
            </a>
          )
        })}
        {medicalCard}
      </div>
    )
  }

  /* ───── 보호자 모드: 연락처 관리 ───── */
  return (
    <div className="space-y-4 pb-4">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">비상 연락망</h2>
          <button
            onClick={() => setEdit({ id: uid('c'), name: '', relation: '', phone: '' })}
            className="flex min-h-12 items-center gap-1 rounded-xl bg-green-700 px-4 text-lg font-bold text-white"
          >
            <Plus className="h-5 w-5" /> 추가
          </button>
        </div>
        <p className="mb-3 text-base text-stone-500">위에 있을수록 부모님 화면에서도 위에 보여요.</p>
        <ul className="space-y-2">
          {contacts.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 rounded-2xl border-2 border-stone-200 p-3">
              <a href={telLink(c.phone)} className="min-w-0 flex-1">
                <p className="truncate text-xl font-extrabold">{c.name}</p>
                <p className="text-base text-stone-600">
                  {c.relation} · {c.phone}
                </p>
              </a>
              <div className="flex shrink-0 gap-1">
                <button
                  disabled={i === 0}
                  onClick={() => actions.moveContact(c.id, -1)}
                  aria-label="위로"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 disabled:opacity-30"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
                <button
                  disabled={i === contacts.length - 1}
                  onClick={() => actions.moveContact(c.id, 1)}
                  aria-label="아래로"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 disabled:opacity-30"
                >
                  <ArrowDown className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setEdit(c)}
                  aria-label="수정"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setDel(c)}
                  aria-label="삭제"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {medicalCard}

      {edit && (
        <ContactSheet
          initial={edit}
          onClose={() => setEdit(null)}
          onSave={(c) => {
            actions.saveContact(c)
            setEdit(null)
          }}
        />
      )}
      {editMed && (
        <MedicalSheet
          initial={medical}
          onClose={() => setEditMed(false)}
          onSave={(m) => {
            actions.setMedical(m)
            setEditMed(false)
          }}
        />
      )}
      {del && (
        <ConfirmDialog
          message={<>&lsquo;{del.name}&rsquo; 연락처를 삭제할까요?</>}
          confirmText="삭제"
          cancelText="취소"
          danger
          onConfirm={() => {
            actions.deleteContact(del.id)
            setDel(null)
          }}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  )
}

function ContactSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: Contact
  onClose: () => void
  onSave: (c: Contact) => void
}) {
  const [c, setC] = useState(initial)
  return (
    <Sheet title="연락처" onClose={onClose}>
      <Field label="이름 *" value={c.name} onChange={(v) => setC({ ...c, name: v })} placeholder="예: 큰딸 지영" />
      <Field
        label="관계"
        value={c.relation}
        onChange={(v) => setC({ ...c, relation: v })}
        placeholder="예: 딸, 이웃, 주치의"
      />
      <Field
        label="전화번호 *"
        value={c.phone}
        onChange={(v) => setC({ ...c, phone: v })}
        type="tel"
        inputMode="tel"
        placeholder="010-0000-0000"
      />
      <PrimaryButton
        disabled={!c.name.trim() || !c.phone.trim()}
        onClick={() => onSave({ ...c, name: c.name.trim(), phone: c.phone.trim() })}
      >
        저장
      </PrimaryButton>
    </Sheet>
  )
}

function MedicalSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: MedicalInfo
  onClose: () => void
  onSave: (m: MedicalInfo) => void
}) {
  const [m, setM] = useState(initial)
  return (
    <Sheet title="응급 의료 정보" onClose={onClose}>
      <Field label="혈액형" value={m.bloodType} onChange={(v) => setM({ ...m, bloodType: v })} placeholder="예: A형 Rh+" />
      <TextArea
        label="지병"
        value={m.conditions}
        onChange={(v) => setM({ ...m, conditions: v })}
        placeholder="예: 고혈압, 당뇨"
      />
      <TextArea label="알레르기" value={m.allergies} onChange={(v) => setM({ ...m, allergies: v })} />
      <TextArea
        label="복용 중인 약"
        value={m.medications}
        onChange={(v) => setM({ ...m, medications: v })}
        placeholder="약 이름과 용량"
      />
      <PrimaryButton onClick={() => onSave(m)}>저장</PrimaryButton>
    </Sheet>
  )
}
