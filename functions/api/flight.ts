interface Env {
  AERODATABOX_API_KEY?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=120"
    }
  })

const durationMinutes = (from?: string, to?: string) => {
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
  runway: m?.runwayTime?.local || m?.runwayTime?.utc || ""
})

const mapFlight = (f: any, index: number) => {
  const departure = movement(f.departure)
  const arrival = movement(f.arrival)
  const aircraftName = [
    f.aircraft?.model,
    f.aircraft?.modeS,
  ].filter(Boolean).join("・")
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
    durationMin: durationMinutes(timeValue(f.departure), timeValue(f.arrival)),
    distanceKm: f.greatCircleDistance?.km,
    source: "AeroDataBox",
    updatedAt: f.lastUpdatedUtc || ""
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const flight = (url.searchParams.get("flight") || "").replace(/\s+/g, "").toUpperCase()
  const date = url.searchParams.get("date") || ""

  if (!flight) return json({ message: "請輸入航班號碼。", flights: [] }, 400)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ message: "請選擇正確的搭乘日期。", flights: [] }, 400)
  }
  if (!env.AERODATABOX_API_KEY) {
    return json({
      configured: false,
      message: "Cloudflare 尚未設定 AERODATABOX_API_KEY，可先使用手動航班。",
      flights: []
    }, 503)
  }

  const endpoint = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flight)}/${encodeURIComponent(date)}`
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Accept": "application/json",
        "X-RapidAPI-Key": env.AERODATABOX_API_KEY,
        "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com"
      }
    })

    if (response.status === 204) {
      return json({ configured: true, provider: "AeroDataBox", message: "這個日期找不到該航班。", flights: [] }, 404)
    }

    const data: any = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = data?.message || data?.detail || data?.error || `AeroDataBox 回傳錯誤 ${response.status}`
      return json({
        configured: true,
        provider: "AeroDataBox",
        message: response.status === 401 || response.status === 403
          ? "AeroDataBox 金鑰或方案尚未生效，請確認 RapidAPI 訂閱與 Cloudflare Secret。"
          : String(detail),
        flights: []
      }, response.status)
    }

    const flights = Array.isArray(data) ? data.map(mapFlight) : []
    return json({
      configured: true,
      provider: "AeroDataBox",
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
