import type { ReactNode } from 'react'
import { X } from 'lucide-react'

/** 화면 아래에서 올라오는 큰 입력창 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center print:hidden">
      <div className="safe-bottom max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 active:bg-stone-200"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** 실수로 누른 것을 되돌릴 때 확인하는 큰 대화상자 */
export function ConfirmDialog({
  message,
  confirmText,
  cancelText = '아니요',
  danger = false,
  onConfirm,
  onCancel,
}: {
  message: ReactNode
  confirmText: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 print:hidden">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center">
        <p className="mb-6 text-2xl font-bold leading-snug">{message}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`min-h-16 rounded-2xl text-2xl font-extrabold text-white active:scale-[0.98] ${
              danger ? 'bg-red-600' : 'bg-green-700'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="min-h-16 rounded-2xl border-4 border-stone-800 text-2xl font-extrabold active:bg-stone-100"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  inputMode?: 'text' | 'tel' | 'numeric'
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-lg font-bold text-stone-700">{label}</span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-xl border-2 border-stone-300 px-4 text-lg focus:border-green-700 focus:outline-none"
      />
    </label>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-lg font-bold text-stone-700">{label}</span>
      <textarea
        value={value}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-stone-300 p-3 text-lg focus:border-green-700 focus:outline-none"
      />
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-5 shadow-sm ${className}`}>{children}</section>
}

export function PrimaryButton({
  children,
  onClick,
  className = '',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 text-xl font-extrabold text-white active:scale-[0.98] disabled:bg-stone-300 ${className}`}
    >
      {children}
    </button>
  )
}
