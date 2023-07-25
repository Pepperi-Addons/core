import { AddonDataScheme } from '@pepperi-addons/papi-sdk';
import { Request } from '@pepperi-addons/debug-server';

import { BaseCoreService, IPapiService, PapiBatchResponse, ResourceFields, SearchResult } from 'core-shared';

export class MockCoreService extends BaseCoreService
{
	constructor(request: Request)
	{
		const mockAddonDataSchema: AddonDataScheme = {
			Name: 'MockAddonDataScheme'
		};

		super(mockAddonDataSchema, request, new MockApiService(request.query.resource_name));
	}
}

export class MockApiService implements IPapiService
{
	constructor(protected resourceName: string)
	{}

	async getResourceSchema(): Promise<AddonDataScheme> 
	{
		return Promise.resolve({Name: this.resourceName});
	}

	async getResourceFields(): Promise<ResourceFields> 
	{
		throw new Error('Method not implemented.');
	}

	async createResource(body: any): Promise<any>
	{
		return await this.upsertResource(body);
	}

	async updateResource(body: any): Promise<any>
	{
		return await this.upsertResource(body);
	}

	async upsertResource(body: any): Promise<any>
	{
		return Promise.resolve({});
	}

	async batch(body: any): Promise<PapiBatchResponse>
	{
		return Promise.resolve([]);
	}

	async getResources(query: any): Promise<Array<any>>
	{
		return Promise.resolve([]);
	}

	async getResourceByKey(key: string): Promise<any> 
	{
		return Promise.resolve({});
	}

	async getResourceByExternalId(externalId: any): Promise<any>
	{
		return Promise.resolve({});
	}

	async getResourceByInternalId(internalId: any): Promise<any>
	{
		return Promise.resolve({});
	}

	async searchResource(body: void): Promise<SearchResult>
	{
		return Promise.resolve({Objects: []});
	}
}
