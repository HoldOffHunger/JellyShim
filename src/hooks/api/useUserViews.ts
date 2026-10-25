import type { Api } from '@jellyfin/sdk/lib/api';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { UserViewApiGetUserViewsRequest } from '@jellyfin/sdk/lib/generated-client/api/user-view-api';
import { getUserViewApi } from '@jellyfin/sdk/lib/utils/api/user-view-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from '../useApi';

const fetchUserViews = async (
    api: Api,
    params?: UserViewApiGetUserViewsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getUserViewApi(api)
        .getUserViews(params, options);

    // JellyShim: music is browsed through Folders only, so the album-based
    // Music view is left out of every menu, toolbar and home section.
    const items = (response.data.Items || []).filter(view => view.CollectionType !== CollectionType.Music);
    return { ...response.data, Items: items, TotalRecordCount: items.length };
};

export const getUserViewsQuery = (
    api?: Api,
    params?: UserViewApiGetUserViewsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'Views', params ],
    queryFn: ({ signal }) => fetchUserViews(api!, params, { signal }),
    enabled: !!api
});

export const useUserViews = (
    params?: UserViewApiGetUserViewsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getUserViewsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
