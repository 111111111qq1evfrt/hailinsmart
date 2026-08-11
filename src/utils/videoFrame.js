export async function extractVideoFrame(videoUrl, options = {}) {
  const {
    time = 0.5,
    width = 640,
    height = 360,
    fallback = null,
    timeout = 5000
  } = options

  return new Promise((resolve) => {
    if (!videoUrl || videoUrl.startsWith('data:')) {
      resolve(fallback)
      return
    }

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.src = videoUrl

    let completed = false
    let timeoutId = null

    const cleanUp = () => {
      completed = true
      if (timeoutId) clearTimeout(timeoutId)
      video.pause()
      video.src = ''
      video.load()
    }

    const onSuccess = () => {
      if (completed) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, width, height)

        const frameUrl = canvas.toDataURL('image/jpeg', 0.85)
        cleanUp()
        resolve(frameUrl)
      } catch (e) {
        cleanUp()
        resolve(fallback)
      }
    }

    const onError = () => {
      if (completed) return
      cleanUp()
      resolve(fallback)
    }

    video.addEventListener('loadeddata', () => {
      if (completed) return
      const seekTime = Math.min(time, video.duration ? video.duration / 10 : time)
      video.currentTime = seekTime
    })

    video.addEventListener('seeked', onSuccess)
    video.addEventListener('error', onError)
    video.addEventListener('stalled', onError)

    timeoutId = setTimeout(() => {
      if (!completed) {
        cleanUp()
        resolve(fallback)
      }
    }, timeout)
  })
}

export async function extractVideoFrames(videoList, options = {}) {
  const results = []
  for (const video of videoList) {
    const frame = await extractVideoFrame(video.url || video.src, options)
    results.push({ ...video, frame })
  }
  return results
}