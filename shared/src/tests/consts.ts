// import { PapiClientOptions } from '@pepperi-addons/papi-sdk';

import { Client } from "@pepperi-addons/debug-server/dist";
import { ResourceFields, PapiBatchResponse, SearchResult } from "../constants";
import IPapiService from "../IPapi.service";

export const mockClient : Client/*: PapiClientOptions*/ = {
    AddonUUID: 'NotUsed',
    BaseURL: 'NotUsed',
    AddonSecretKey: 'NotUsed',
    ActionUUID: 'NotUsed',
    AssetsBaseUrl: 'NotUsed',
    Retry: () => { return 'NotUsed' },
    // Token is fake, only has distributor UUID which is mendatory for constructors
    OAuthAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXBwZXJpLmRpc3RyaWJ1dG9ydXVpZCI6IjEyMzQ1Njc4OTAifQ.JcRiubA-ZGJsCJfDfU8eQqyZq8FAULgeLbXfm3-aQhs',
    ValidatePermission(policyName) {
        // return true;
        return Promise.resolve();
    }
}

export class MockApiService implements IPapiService
{

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		throw new Error('Method not implemented.');
	}

	async createResource(resourceName: string, body: any): Promise<any>
	{
		return await this.upsertResource(resourceName, body);
	}

	async updateResource(resourceName: string, body: any): Promise<any>
	{
		return await this.upsertResource(resourceName, body);
	}

	async upsertResource(resourceName: string, body: any): Promise<any>
	{
		return Promise.resolve({});
	}

	async batch(resourceName: string, body: any): Promise<PapiBatchResponse>
	{
		return Promise.resolve([]);
	}

	async getResources(resourceName: string, query: any): Promise<Array<any>>
	{
		return Promise.resolve([]);
	}

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		return Promise.resolve({});
	}

	async getResourceByExternalId(resourceName: string, externalId: any): Promise<any>
	{
		return Promise.resolve({});
	}

	async getResourceByInternalId(resourceName: string, internalId: any): Promise<any>
	{
		return Promise.resolve({});
	}

	async searchResource(resourceName: string, body: void): Promise<SearchResult>
	{
		return Promise.resolve({Objects: []});
	}
}
