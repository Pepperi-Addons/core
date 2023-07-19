import { CreateResult, GetParams, GetResult, SearchParams, SearchResult as ClientApiSearchResult, UpdateParams, UpdateResult } from '@pepperi-addons/client-api';
import { CreateResourceParams } from './constants';


export interface IClientApiService {
    search(resourceName: string, searchParams: SearchParams<string>): Promise<ClientApiSearchResult<string>>;

    get(resourceName: string, getParams: GetParams<string>): Promise<GetResult<string>>;

    add(resourceName: string, createResourceParams: CreateResourceParams): Promise<CreateResult>;
    
    update(resourceName: string, updateParams: UpdateParams): Promise<UpdateResult>;
}
