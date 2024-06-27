# Fetch with interceptors

```
npm i @vanyamate/fetch-with-interceptors
```

```typescript
export { createFetchWithInterceptors } from '@vanyamate/fetch-with-interceptors'; 
```

Example:

```typescript
// Request interceptors
export const addBaseUrlInterceptor = (baseUrl: string): RequestInterceptor => async function (url, init) {
    return [ baseUrl + url, init ];
};

export const addJsonContentTypeInterceptor: RequestInterceptor = async function (url, init) {
    init.headers = new Headers(init.headers);
    init.headers.set('Content-Type', 'application/json');

    return [ url, init ];
};

export const addUserTokensInterceptor: RequestInterceptor = async (data, init) => {
    const accessToken: string | undefined  = localStorage.getItem(LOCAL_STORAGE_USER_ACCESS_TOKEN);
    const refreshToken: string | undefined = localStorage.getItem(LOCAL_STORAGE_USER_REFRESH_TOKEN);
    init.headers                           = new Headers(init.headers);

    if (accessToken) {
        init.headers.set('authorization', accessToken);
    }
    if (refreshToken) {
        init.headers.set('refresh-token', refreshToken);
    }

    return [ data, init ];
};
```

```typescript
// Response interceptors

export const responseTokenRefreshedInterceptor: ResponseInterceptor = async (response) => {
    const responsePayload: unknown = response['data'];
    if (responsePayload) {
        if (isDomainResponse(responsePayload)) {
            if (isDomainTokens(responsePayload.tokens)) {
                localStorage.setItem(LOCAL_STORAGE_USER_ACCESS_TOKEN, responsePayload.tokens[0]);
                localStorage.setItem(LOCAL_STORAGE_USER_REFRESH_TOKEN, responsePayload.tokens[1]);
            } else if (isDomainAuthResponse(responsePayload.data)) {
                localStorage.setItem(LOCAL_STORAGE_USER_ACCESS_TOKEN, responsePayload.data.tokens[0]);
                localStorage.setItem(LOCAL_STORAGE_USER_REFRESH_TOKEN, responsePayload.data.tokens[1]);
            }
        }
    }

    return response;
};

export const returnResponseJsonInterceptor: ResponseInterceptor = async (response) => {
    const responseData = await response.json();
    response['data']   = responseData;
    return response;
};
```

Usage:

```typescript
export const api = createFetchWithInterceptors([
    addBaseUrlInterceptor(`${ __API__ }/v1/`),
    addJsonContentTypeInterceptor,
    addUserTokensInterceptor,
], [
    returnResponseJsonInterceptor,
    responseTokenRefreshedInterceptor,
]);


export const createRequest = function (url: RequestInfo, init?: RequestInit) {
    return api(url, init)
        .then((response) => response['data'] ?? response.json())
        .then((data: unknown) => {
            if (isDomainResponse(data)) {
                return data;
            }

            throw data;
        });
};

export const getDialogueByIdAction = function (id: string) {
    return createRequest(`private-dialogues/${ id }`, { method: 'get' })
        .then((response) => {
            if (isDomainPrivateDialogueFull(response.data)) {
                return response.data;
            }
            return null;
        });
};

export const getDialoguesAction = function () {
    return createRequest('private-dialogues/list', { method: 'GET' })
        .then((response) => {
            if (Array.isArray(response.data)) {
                return response.data.filter(isDomainPrivateDialogueFull);
            }
            return [];
        });
};
```