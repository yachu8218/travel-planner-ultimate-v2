interface Env {
  GOOGLE_PLACES_API_KEY?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  })

const regionFor = (language: string, destination: string) => {
  const text = `${language} ${destination}`.toLowerCase()
  if (text.includes("ko") || /釜山|首爾|濟州|大邱|仁川|부산|서울|제주/.test(destination)) return "KR"
  if (text.includes("ja") || /東京|大阪|京都|福岡|沖繩/.test(destination)) return "JP"
  if (text.includes("th") || destination.includes("曼谷")) return "TH"
  if (text.includes("fr") || destination.includes("巴黎")) return "FR"
  return undefined
}

const mapPlace = (p: any) => {
  const weekday = p.regularOpeningHours?.weekdayDescriptions || []
  return {
    place_id: p.id,
    name: p.displayName?.text || "",
    display_name: p.formattedAddress || p.displayName?.text || "",
    lat: String(p.location?.latitude || ""),
    lon: String(p.location?.longitude || ""),
    openingHours: weekday.join("／"),
    phone: p.nationalPhoneNumber || "",
    website: p.websiteUri || "",
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    openNow: p.currentOpeningHours?.openNow ?? p.regularOpeningHours?.openNow,
    source: "Google Places"
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const q = (url.searchParams.get("q") || "").trim()
  const languageRaw = url.searchParams.get("language") || "zh-TW"
  const language = languageRaw.split("-")[0]
  const destination = url.searchParams.get("destination") || ""
  const mode = url.searchParams.get("mode") || "search"

  if (!q) return json({ configured: Boolean(env.GOOGLE_PLACES_API_KEY), message: "請輸入店名或景點名稱。", results: [] }, 400)

  if (!env.GOOGLE_PLACES_API_KEY) {
    return json({
      configured: false,
      message: "Cloudflare Function 尚未取得 GOOGLE_PLACES_API_KEY。",
      results: []
    })
  }

  const body: Record<string, unknown> = {
    textQuery: q,
    languageCode: language,
    maxResultCount: mode === "autocomplete" ? 5 : 8
  }
  const regionCode = regionFor(languageRaw, destination)
  if (regionCode) body.regionCode = regionCode

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.regularOpeningHours",
          "places.currentOpeningHours",
          "places.nationalPhoneNumber",
          "places.websiteUri",
          "places.rating",
          "places.userRatingCount",
          "places.businessStatus"
        ].join(",")
      },
      body: JSON.stringify(body)
    })

    const data: any = await response.json()
    if (!response.ok) {
      return json({
        configured: true,
        googleStatus: response.status,
        message: data?.error?.message || `Google Places 回傳錯誤 ${response.status}。`,
        results: []
      }, 200)
    }

    const results = (data.places || []).map(mapPlace)
    return json({
      configured: true,
      query: q,
      regionCode,
      message: results.length ? "" : "Google Places 查無符合結果。",
      results
    })
  } catch {
    return json({
      configured: true,
      message: "Cloudflare 無法連線到 Google Places。",
      results: []
    }, 200)
  }
}
