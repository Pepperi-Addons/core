import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { ResourceFields, PapiBatchResponse, SearchResult } from "../constants";
import IPapiService from "../IPapi.service";

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
	"GenericResource": true,
	"ModificationDateTime": "2023-01-04T15:23:24.066Z",
	"SyncData": {
		"Sync": true
	},
	"CreationDateTime": "2022-12-13T13:56:05.491Z",
	"Fields": {
		"InternalID": {
			"Type": "Integer",
			"Unique": true
		},
		"CreationDateTime": {
			"Type": "DateTime"
		},
		"Email": {
			"Type": "String"
		},
		"FirstName": {
			"Type": "String"
		},
		"ExternalID": {
			"Type": "String",
			"Unique": true
		},
		"ModificationDateTime": {
			"Type": "DateTime"
		},
		"Hidden": {
			"Type": "Bool"
		},
		"LastName": {
			"Type": "String"
		},
		"Mobile": {
			"Type": "String"
		},
		"Key": {
			"Type": "String",
			"Unique": true
		}
	},
	"Type": "papi",
	"Hidden": false,
	"Name": "users",
	"AddonUUID": "fc5a5974-3b30-4430-8feb-7d5b9699bc9f"
}

export class MockApiService implements IPapiService
{
	async getResourceSchema(resourceName: string): Promise<AddonDataScheme> 
	{
		return Promise.resolve({Name: resourceName});
	}

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