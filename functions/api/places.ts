interface Env {
  GOOGLE_PLACES_API_KEY?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=180"
    }
  })

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
  const language = (url.searchParams.get("language") || "zh-TW").split("-")[0]
  const mode = url.searchParams.get("mode") || "search"

  if (!q) return json({ message: "請輸入店名或景點名稱。", results: [] }, 400)

  if (!env.GOOGLE_PLACES_API_KEY) {
    return json({
      configured: false,
      message: "尚未設定 Google Places 金鑰，將改用免費地址搜尋。",
      results: []
    })
  }

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
      body: JSON.stringify({
        textQuery: q,
        languageCode: language,
        maxResultCount: mode === "autocomplete" ? 5 : 6
      })
    })

    const data: any = await response.json()
    if (!response.ok) {
      return json({
        configured: true,
        message: data?.error?.message || "Google Places 搜尋暫時無法使用。",
        results: []
      }, response.status)
    }

    return json({
      configured: true,
      results: (data.places || []).map(mapPlace)
    })
  } catch {
    return json({
      configured: true,
      message: "目前無法連線至 Google Places，將改用免費地址搜尋。",
      results: []
    }, 502)
  }
}
