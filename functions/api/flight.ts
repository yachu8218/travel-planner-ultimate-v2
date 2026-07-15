interface Env {
  RAPIDAPI_KEY?: string
  RAPIDAPI_HOST?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=120"
    }
  })

const durationMinutes = (fromUtc?: string, toUtc?: string, fromLocal?: string, toLocal?: string) => {
  const from = fromUtc || fromLocal
  const to = toUtc || toLocal
  if (!from || !to) return undefined
  const value = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

const timeValue = (movement: any) =>
  movement?.revisedTime?.local ||
  movement?.runwayTime?.local ||
  movement?.scheduledTime?.local ||
  movement?.revisedTime?.utc ||
  movement?.runwayTime?.utc ||
  movement?.scheduledTime?.utc

const movement = (m: any) => ({
  airport: m?.airport?.name || "",
  iata: m?.airport?.iata || "",
  icao: m?.airport?.icao || "",
  terminal: m?.terminal || "",
  gate: m?.gate || "",
  baggage: m?.baggageBelt || "",
  scheduled: m?.scheduledTime?.local || m?.scheduledTime?.utc || "",
  revised: m?.revisedTime?.local || m?.revisedTime?.utc || "",
  runway: m?.runwayTime?.local || m?.runwayTime?.utc || "",
  timezone: m?.airport?.timeZone || "",
  utcOffset: (
    m?.scheduledTime?.local ||
    m?.revisedTime?.local ||
    m?.runwayTime?.local ||
    ""
  ).match(/([+-]\d{2}:?\d{2})$/)?.[1] || ""
})

const mapFlight = (f: any, index: number) => {
  const departure = movement(f.departure)
  const arrival = movement(f.arrival)
  const aircraftName = [f.aircraft?.model, f.aircraft?.modeS].filter(Boolean).join("・")
  return {
    id: `${f.number || "flight"}-${index}-${departure.iata}-${arrival.iata}`,
    flightNo: f.number || "",
    airline: f.airline?.name || "",
    airlineIata: f.airline?.iata || "",
    status: f.status || "Unknown",
    codeshareStatus: f.codeshareStatus || "",
    departure,
    arrival,
    aircraft: aircraftName || f.aircraft?.model || "",
    registration: f.aircraft?.reg || "",
    durationMin: durationMinutes(
      f.departure?.scheduledTime?.utc || f.departure?.revisedTime?.utc || f.departure?.runwayTime?.utc,
      f.arrival?.scheduledTime?.utc || f.arrival?.revisedTime?.utc || f.arrival?.runwayTime?.utc,
      timeValue(f.departure),
      timeValue(f.arrival)
    ),
    distanceKm: f.greatCircleDistance?.km,
    source: "AeroDataBox",
    updatedAt: f.lastUpdatedUtc || ""
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const flight = (url.searchParams.get("flight") || "").replace(/\s+/g, "").toUpperCase()
  const date = url.searchParams.get("date") || ""
  const host = (env.RAPIDAPI_HOST || "aerodatabox.p.rapidapi.com").trim()

  if (!flight) return json({ message: "請輸入航班號碼。", flights: [] }, 400)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ message: "請選擇正確的搭乘日期。", flights: [] }, 400)
  }

  if (!env.RAPIDAPI_KEY) {
    return json({
      configured: false,
      message: "Cloudflare 尚未設定 RAPIDAPI_KEY，可先使用手動航班。",
      flights: []
    }, 503)
  }

  const endpoint = `https://${host}/flights/number/${encodeURIComponent(flight)}/${encodeURIComponent(date)}`

  try {
    const response = await fetch(endpoint, {
      headers: {
        "Accept": "application/json",
        "X-RapidAPI-Key": env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": host
      }
    })

    if (response.status === 204) {
      return json({
        configured: true,
        provider: "AeroDataBox",
        message: "這個日期找不到該航班。",
        flights: []
      }, 404)
    }

    const data: any = await response.json().catch(() => null)

    if (!response.ok) {
      let message = data?.message || data?.detail || data?.error || `RapidAPI 回傳錯誤 ${response.status}`

      if (response.status === 401 || response.status === 403) {
        message = "RapidAPI 金鑰、Host 或 AeroDataBox 訂閱尚未生效。"
      } else if (response.status === 429) {
        message = "RapidAPI 配額或請求頻率已達上限，請稍後再試或改用手動航班。"
      }

      return json({
        configured: true,
        provider: "AeroDataBox",
        message: String(message),
        flights: []
      }, response.status)
    }

    const flights = Array.isArray(data) ? data.map(mapFlight) : []

    return json({
      configured: true,
      provider: "AeroDataBox",
      host,
      flights,
      message: flights.length ? "" : "這個日期找不到該航班。"
    })
  } catch {
    return json({
      configured: true,
      provider: "AeroDataBox",
      message: "Cloudflare 暫時無法連線至 AeroDataBox。",
      flights: []
    }, 502)
  }
}
