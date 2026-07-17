interface Env {
  GOOGLE_PLACES_API_KEY?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const name = (url.searchParams.get("name") || "").trim()
  const maxWidth = Math.min(Math.max(Number(url.searchParams.get("maxWidth") || 900), 200), 1600)

  if (!env.GOOGLE_PLACES_API_KEY || !name) {
    return new Response("Photo unavailable", { status: 404 })
  }

  try {
    const endpoint = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true`
    const response = await fetch(endpoint, {
      headers: { "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY }
    })
    const data: any = await response.json()
    if (!response.ok || !data.photoUri) return new Response("Photo unavailable", { status: 404 })
    return Response.redirect(data.photoUri, 302)
  } catch {
    return new Response("Photo unavailable", { status: 404 })
  }
}
