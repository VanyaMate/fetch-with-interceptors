export type RequestInterceptor = (data: RequestInfo, init: RequestInit) => Promise<[RequestInfo, RequestInit]>;
export type ResponseInterceptor = (response: Response) => Promise<Response>;
export declare const createFetchWithInterceptors: (requestInterceptors: Array<RequestInterceptor>, responseInterceptors: Array<ResponseInterceptor>) => (data: RequestInfo, init?: RequestInit) => Promise<Response>;
