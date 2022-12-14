import { CreateResult, GetParams, GetResult, SearchParams, SearchResult as ClientApiSearchResult, UpdateParams, UpdateResult } from "@pepperi-addons/client-api";
import { CreateResourceParams } from "./constants";
import { IClientApiService } from "./iClientApiService";

export default class ClientApiService implements IClientApiService
{
	public async search(resourceName:string, searchParams: SearchParams<string>): Promise<ClientApiSearchResult<string>>
	{
		return await pepperi.api[resourceName].search(searchParams);
	}

	public async get(resourceName:string, getParams: GetParams<string>): Promise<GetResult<string>>
	{
		return await pepperi.api[resourceName].get(getParams);
	}

	public async add(resourceName:string, createResourceParams: CreateResourceParams): Promise<CreateResult>
	{
		return await pepperi.app[resourceName].add(createResourceParams);
	}

	public async update(resourceName:string, updateParams: UpdateParams): Promise<UpdateResult>
	{
		return await pepperi.app[resourceName].update(updateParams);
	}
}