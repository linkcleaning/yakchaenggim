// 약챙김 서비스워커: 한 번 열어본 화면을 저장해 두어 인터넷이 끊겨도 앱이 열리게 합니다.
const CACHE = 'yakchaenggim-v1'
// 앱이 올라간 주소 (예: https://아이디.github.io/yakchaenggim/)
const ROOT = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([ROOT, ROOT + 'manifest.webmanifest', ROOT + 'icon.svg'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  // 페이지 이동: 인터넷 우선, 실패하면 저장본
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(ROOT, copy))
          return res
        })
        .catch(() => caches.match(ROOT)),
    )
    return
  }

  // 그 외 파일(JS, CSS, 아이콘): 저장본 우선, 없으면 받아서 저장
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})

// 알림을 누르면 앱 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      if (list.length > 0) return list[0].focus()
      return self.clients.openWindow(ROOT)
    }),
  )
})
