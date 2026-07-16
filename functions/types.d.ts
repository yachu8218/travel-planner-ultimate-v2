type PagesFunction<Env = unknown> = (context: {
  request: Request
  env: Env
  params: Record<string, string>
  data: unknown
  waitUntil(promise: Promise<unknown>): void
  next(input?: Request | string): Promise<Response>
}) => Response | Promise<Response>

type KVNamespace = {
 get(key:string):Promise<string|null>
 put(key:string,value:string,options?:{expiration?:number;expirationTtl?:number;metadata?:unknown}):Promise<void>
 delete(key:string):Promise<void>
}
