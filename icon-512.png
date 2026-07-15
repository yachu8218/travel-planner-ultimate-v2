type PagesFunction<Env = unknown> = (context: {
  request: Request
  env: Env
  params: Record<string, string>
  data: unknown
  waitUntil(promise: Promise<unknown>): void
  next(input?: Request | string): Promise<Response>
}) => Response | Promise<Response>
