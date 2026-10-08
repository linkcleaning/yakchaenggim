import { useEffect, useState } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** 홈 화면에 바로가기 추가 안내 (안드로이드: 버튼 한 번 / 아이폰: 방법 안내) */
export default function InstallBanner({ onDismiss }: { onDismiss: () => void }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone())
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferred(null)
  }

  return (
    <div className="relative mb-4 rounded-3xl border-4 border-green-700 bg-green-50 p-5 pr-14 text-stone-950">
      <button
        onClick={onDismiss}
        aria-label="안내 닫기"
        className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-full active:bg-green-100"
      >
        <X className="h-7 w-7" />
      </button>
      <p className="text-2xl font-black">📱 홈 화면에 약챙김 추가하기</p>
      {deferred ? (
        <>
          <p className="mt-1 text-xl font-bold text-stone-700">버튼 한 번이면 앱처럼 바로 열 수 있어요.</p>
          <button
            onClick={install}
            className="mt-3 min-h-16 w-full rounded-2xl bg-green-700 text-2xl font-black text-white active:scale-[0.98]"
          >
            홈 화면에 추가
          </button>
        </>
      ) : isIOS ? (
        <ol className="mt-2 space-y-2 text-xl font-bold">
          <li className="flex items-center gap-2">
            1. 사파리 아래쪽 <Share className="inline h-7 w-7 text-sky-600" /> 공유 버튼
          </li>
          <li className="flex items-center gap-2">
            2. <SquarePlus className="inline h-7 w-7" /> &lsquo;홈 화면에 추가&rsquo;
          </li>
          <li>3. 오른쪽 위 &lsquo;추가&rsquo;</li>
        </ol>
      ) : (
        <p className="mt-2 text-xl font-bold">
          크롬 오른쪽 위 ⋮ 메뉴 → &lsquo;홈 화면에 추가&rsquo; 또는 &lsquo;앱 설치&rsquo;를 눌러주세요.
        </p>
      )}
    </div>
  )
}
