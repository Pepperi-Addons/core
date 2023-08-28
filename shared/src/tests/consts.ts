import { Client } from '@pepperi-addons/debug-server/dist';
import { AddonDataScheme } from '@pepperi-addons/papi-sdk';
import { ResourceFields, PapiBatchResponse, SearchResult } from '../constants';
import IPapiService from '../IPapi.service';

export const mockClient : Client/*: PapiClientOptions*/ = {
	AddonUUID: 'NotUsed',
	BaseURL: 'NotUsed',
	AddonSecretKey: 'NotUsed',
	ActionUUID: 'NotUsed',
	AssetsBaseUrl: 'NotUsed',
	Retry: () => 
	{
		return 'NotUsed' 
	},
	// Token is fake, only has distributor UUID which is mandatory for constructors
	OAuthAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXBwZXJpLmRpc3RyaWJ1dG9ydXVpZCI6IjEyMzQ1Njc4OTAifQ.JcRiubA-ZGJsCJfDfU8eQqyZq8FAULgeLbXfm3-aQhs',
	ValidatePermission(policyName) 
	{
		return Promise.resolve();
	}
}

export const usersSchema: AddonDataScheme = {
	'GenericResource': true,
	'ModificationDateTime': '2023-01-04T15:23:24.066Z',
	'SyncData': {
		'Sync': true
	},
	'CreationDateTime': '2022-12-13T13:56:05.491Z',
	'Fields': {
		'InternalID': {
			'Type': 'Integer',
			'Unique': true
		},
		'CreationDateTime': {
			'Type': 'DateTime'
		},
		'Email': {
			'Type': 'String'
		},
		'FirstName': {
			'Type': 'String'
		},
		'ExternalID': {
			'Type': 'String',
			'Unique': true
		},
		'ModificationDateTime': {
			'Type': 'DateTime'
		},
		'Hidden': {
			'Type': 'Bool'
		},
		'LastName': {
			'Type': 'String'
		},
		'Mobile': {
			'Type': 'String'
		},
		'Key': {
			'Type': 'String',
			'Unique': true
		}
	},
	'Type': 'papi',
	'Hidden': false,
	'Name': 'users',
	'AddonUUID': 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f'
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

	async createResource(body: any, fields: string): Promise<any>
	{
		return await this.upsertResource(body, fields);
	}

	async updateResource(body: any, fields: string): Promise<any>
	{
		return await this.upsertResource(body, fields);
	}

	async upsertResource(body: any, fields: string): Promise<any>
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
