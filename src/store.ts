import { useCallback, useEffect, useState } from 'react'

/* ────────────── 데이터 형태 ────────────── */

export type Slot = 'morning' | 'lunch' | 'dinner'
export type Condition = 'good' | 'normal' | 'sick'
export type Mode = 'parent' | 'guardian'

export const SLOTS: Slot[] = ['morning', 'lunch', 'dinner']
export const SLOT_LABEL: Record<Slot, string> = { morning: '아침', lunch: '점심', dinner: '저녁' }
export const CONDITION_LABEL: Record<Condition, string> = { good: '좋음', normal: '보통', sick: '아픔' }
export const CONDITION_EMOJI: Record<Condition, string> = { good: '😊', normal: '😐', sick: '🤒' }

export interface BloodPressure {
  sys: number // 수축기(높은 혈압)
  dia: number // 이완기(낮은 혈압)
  pulse?: number // 맥박
  time: string // 측정 시각 ISO
}

export interface DayRecord {
  doses: Partial<Record<Slot, string>> // 복용한 시각 ISO
  condition?: Condition
  bp?: BloodPressure
}

export interface Hospital {
  id: string
  name: string
  department: string
  doctor: string
  phone: string
  address: string
}

export interface Appointment {
  id: string
  hospitalId: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  memo: string
}

export interface Contact {
  id: string
  name: string
  relation: string
  phone: string
}

export interface MedicalInfo {
  bloodType: string
  conditions: string
  allergies: string
  medications: string
}

export interface Settings {
  parentName: string
  parentPhone: string
  guardianName: string
  guardianPhone: string
  medNames: Record<Slot, string>
  remindDaysBefore: number // 예약 며칠 전부터 알릴지
}

export interface AppState {
  mode: Mode
  records: Record<string, DayRecord> // 키: YYYY-MM-DD
  hospitals: Hospital[]
  appointments: Appointment[]
  contacts: Contact[]
  medical: MedicalInfo
  settings: Settings
  notifiedIds: string[] // 이미 알림을 보낸 예약
  installDismissed: boolean
}

/* ────────────── 기본값 ────────────── */

const STORAGE_KEY = 'yakchaenggim-v1'

export const defaultState: AppState = {
  mode: 'parent',
  records: {},
  hospitals: [],
  appointments: [],
  contacts: [{ id: 'c-119', name: '119 구급대', relation: '응급', phone: '119' }],
  medical: { bloodType: '', conditions: '', allergies: '', medications: '' },
  settings: {
    parentName: '어머니',
    parentPhone: '',
    guardianName: '자녀',
    guardianPhone: '',
    medNames: { morning: '아침 약', lunch: '점심 약', dinner: '저녁 약' },
    remindDaysBefore: 1,
  },
  notifiedIds: [],
  installDismissed: false,
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const saved = JSON.parse(raw) as Partial<AppState>
    // 새 항목이 추가돼도 깨지지 않도록 기본값과 합치기
    return {
      ...defaultState,
      ...saved,
      medical: { ...defaultState.medical, ...saved.medical },
      settings: {
        ...defaultState.settings,
        ...saved.settings,
        medNames: { ...defaultState.settings.medNames, ...saved.settings?.medNames },
      },
    }
  } catch {
    return defaultState
  }
}

/* ────────────── 날짜 도우미 ────────────── */

const pad = (n: number) => String(n).padStart(2, '0')

/** 휴대폰 현지 시간 기준 YYYY-MM-DD */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 오늘부터 거슬러 올라간 N일 (오래된 날 → 오늘 순서) */
export function lastNDays(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    out.push(dateKey(d))
  }
  return out
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
export function weekday(key: string): string {
  return WEEKDAYS[keyToDate(key).getDay()]
}

export function formatDateKo(key: string): string {
  const d = keyToDate(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

export function formatTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())}`
}

export function formatHHMM(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시${m ? ` ${m}분` : ''}`
}

export function appointmentDate(a: Appointment): Date {
  const [y, mo, d] = a.date.split('-').map(Number)
  const [h, mi] = (a.time || '09:00').split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi)
}

/** 예약까지 남은 날짜 (0 = 오늘, 1 = 내일, 음수 = 지남) */
export function daysUntil(dateStr: string): number {
  const today = keyToDate(dateKey())
  return Math.round((keyToDate(dateStr).getTime() - today.getTime()) / 86400000)
}

export function dDayLabel(dateStr: string): string {
  const n = daysUntil(dateStr)
  if (n === 0) return '오늘'
  if (n === 1) return '내일'
  if (n === 2) return '모레'
  return n > 0 ? `D-${n}` : '지남'
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** 하루 복용률 (0~1) */
export function dayRate(rec?: DayRecord): number {
  if (!rec) return 0
  return SLOTS.filter((s) => rec.doses[s]).length / SLOTS.length
}

/** 다가오는 예약 (지난 것 제외, 가까운 순) */
export function upcomingAppointments(state: AppState): Appointment[] {
  const now = Date.now()
  return [...state.appointments]
    .filter((a) => appointmentDate(a).getTime() >= now - 3 * 3600000) // 진료 후 3시간까지는 보여줌
    .sort((a, b) => appointmentDate(a).getTime() - appointmentDate(b).getTime())
}

/* ────────────── 상태 훅 ────────────── */

export function useAppStore() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* 저장공간 부족 등 무시 */
    }
  }, [state])

  // 다른 탭에서 바뀌면 반영
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), [])

  const updateDay = useCallback(
    (key: string, fn: (r: DayRecord) => DayRecord) =>
      setState((s) => ({
        ...s,
        records: { ...s.records, [key]: fn(s.records[key] ?? { doses: {} }) },
      })),
    [],
  )

  const actions = {
    setMode: (mode: Mode) => update((s) => ({ ...s, mode })),

    toggleDose: (slot: Slot, key = dateKey()) =>
      updateDay(key, (r) => {
        const doses = { ...r.doses }
        if (doses[slot]) delete doses[slot]
        else doses[slot] = new Date().toISOString()
        return { ...r, doses }
      }),

    setCondition: (c: Condition, key = dateKey()) => updateDay(key, (r) => ({ ...r, condition: c })),

    setBloodPressure: (bp: BloodPressure, key = dateKey()) => updateDay(key, (r) => ({ ...r, bp })),

    saveHospital: (h: Hospital) =>
      update((s) => ({
        ...s,
        hospitals: s.hospitals.some((x) => x.id === h.id)
          ? s.hospitals.map((x) => (x.id === h.id ? h : x))
          : [...s.hospitals, h],
      })),

    deleteHospital: (id: string) =>
      update((s) => ({
        ...s,
        hospitals: s.hospitals.filter((x) => x.id !== id),
        appointments: s.appointments.filter((a) => a.hospitalId !== id),
      })),

    saveAppointment: (a: Appointment) =>
      update((s) => ({
        ...s,
        appointments: s.appointments.some((x) => x.id === a.id)
          ? s.appointments.map((x) => (x.id === a.id ? a : x))
          : [...s.appointments, a],
        notifiedIds: s.notifiedIds.filter((id) => id !== a.id), // 날짜를 바꾸면 다시 알림
      })),

    deleteAppointment: (id: string) =>
      update((s) => ({ ...s, appointments: s.appointments.filter((x) => x.id !== id) })),

    markNotified: (id: string) =>
      update((s) => (s.notifiedIds.includes(id) ? s : { ...s, notifiedIds: [...s.notifiedIds, id] })),

    saveContact: (c: Contact) =>
      update((s) => ({
        ...s,
        contacts: s.contacts.some((x) => x.id === c.id)
          ? s.contacts.map((x) => (x.id === c.id ? c : x))
          : [...s.contacts, c],
      })),

    deleteContact: (id: string) => update((s) => ({ ...s, contacts: s.contacts.filter((x) => x.id !== id) })),

    moveContact: (id: string, dir: -1 | 1) =>
      update((s) => {
        const list = [...s.contacts]
        const i = list.findIndex((x) => x.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= list.length) return s
        ;[list[i], list[j]] = [list[j], list[i]]
        return { ...s, contacts: list }
      }),

    setMedical: (m: MedicalInfo) => update((s) => ({ ...s, medical: m })),

    setSettings: (st: Settings) => update((s) => ({ ...s, settings: st })),

    dismissInstall: () => update((s) => ({ ...s, installDismissed: true })),

    importAll: (data: AppState) => setState({ ...defaultState, ...data }),

    resetAll: () => setState({ ...defaultState, mode: 'guardian' }),
  }

  return { state, actions }
}

export type Store = ReturnType<typeof useAppStore>
export type Actions = Store['actions']

/* ────────────── 문자(SMS) ────────────── */

/** 휴대폰 문자앱을 내용이 채워진 상태로 열기 */
export function smsLink(phone: string, body: string): string {
  const num = phone.replace(/[^0-9+]/g, '')
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  return `sms:${num}${isIOS ? '&' : '?'}body=${encodeURIComponent(body)}`
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`
}

export function buildStatusMessage(state: AppState, key = dateKey()): string {
  const rec = state.records[key]
  const { parentName, medNames } = state.settings
  const lines = SLOTS.map((s) => {
    const t = rec?.doses[s]
    return `${SLOT_LABEL[s]}(${medNames[s]}): ${t ? `✅ ${formatTime(t)}` : '❌ 아직'}`
  })
  const parts = [`[약챙김] ${parentName} ${formatDateKo(key)} 복약 현황`, ...lines]
  if (rec?.condition) parts.push(`컨디션: ${CONDITION_EMOJI[rec.condition]} ${CONDITION_LABEL[rec.condition]}`)
  if (rec?.bp) parts.push(`혈압: ${rec.bp.sys}/${rec.bp.dia}${rec.bp.pulse ? ` 맥박 ${rec.bp.pulse}` : ''}`)
  const next = upcomingAppointments(state)[0]
  if (next) {
    const h = state.hospitals.find((x) => x.id === next.hospitalId)
    parts.push(`다음 진료: ${formatDateKo(next.date)} ${formatHHMM(next.time)} ${h?.name ?? ''}`)
  }
  return parts.join('\n')
}

/* ────────────── 캘린더(.ics) 파일 ────────────── */

/** 휴대폰 기본 캘린더에 예약을 등록 → 앱을 닫아도 전날·2시간 전 알림이 울림 */
export function downloadIcs(a: Appointment, h: Hospital | undefined, parentName: string) {
  const start = appointmentDate(a)
  const end = new Date(start.getTime() + 60 * 60000)
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const esc = (t: string) => t.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  const title = `${parentName} 병원 진료 - ${h?.name ?? '병원'}${h?.department ? ` ${h.department}` : ''}`
  const desc = [h?.doctor && `담당: ${h.doctor}`, h?.phone && `전화: ${h.phone}`, a.memo].filter(Boolean).join('\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//yakchaenggim//KO',
    'BEGIN:VEVENT',
    `UID:${a.id}@yakchaenggim`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(h?.address ?? '')}`,
    `DESCRIPTION:${esc(desc)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc('내일 병원 예약이 있어요')}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc('2시간 뒤 병원 진료')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `병원예약_${a.date}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
