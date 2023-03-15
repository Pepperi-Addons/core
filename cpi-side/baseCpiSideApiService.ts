import {IPapiService, PapiBatchResponse, ResourceFields, SearchResult} from 'core-shared';
import { GetParams, SearchParams, SearchResult as ClientApiSearchResult, UpdateParams } from "@pepperi-addons/client-api";
import { FieldType } from "@pepperi-addons/pepperi-filters";
import { parse as transformSqlToJson } from '@pepperi-addons/pepperi-filters';
import pick from 'lodash.pick';
import { IClientApiService } from './iClientApiService';
import { CreateResourceParams } from './constants';
import { AddonDataScheme } from '@pepperi-addons/papi-sdk';


export default class BaseCpiSideApiService implements IPapiService
{
	constructor(protected resourceName: string, protected clientAddonUUID: string, protected iClientApi: IClientApiService)
	{}

	async getResourceFields(): Promise<ResourceFields> 
	{
		// This method is used for creation of a schema, and is not needed in cpi-side
		throw new Error('Method not implemented.');
	}

	async createResource(body: any): Promise<any> 
	{
		// Build CreateResourceParams
		const createResourceParams: CreateResourceParams = {
			object: body,
		}

		// Call to create the resource
		const addResult = await this.iClientApi.add(this.resourceName, createResourceParams);

		// Validate the creation process succeeded
		if(addResult.status !== 'added')
		{
			const errorMessage = `Adding resource of type ${this.resourceName} failed. Addition status: '${addResult.status}'. Message: '${addResult.message}'`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		// Get the newly created resource
		const resultObject = await this.getResourceByKey(addResult.id);

		return resultObject;
	}

	async updateResource(body: any): Promise<any> 
	{
		// Build UpdateParams
		const updateParams: UpdateParams = {
			objects: [
				body
			]
		}

		// Call to update the resource
		const updateResult = await this.iClientApi.update(this.resourceName, updateParams);

		// Validate the creation process succeeded
		if(updateResult.result[0].status !== 'updated')
		{
			const errorMessage = `Updating resource of type ${this.resourceName} failed. Update status: '${updateResult.result[0].status}'. Message: '${updateResult.result[0].message}'`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		// Get the newly updated resource
		const resultObject = await this.getResourceByKey(updateResult.result[0].id);

		return resultObject;
	}

	async upsertResource(body: any): Promise<any> 
	{
		let res: any;
		let doesResourceExist: boolean | undefined;

		try
		{
			await this.getResourceByKey(body.UUID);
			doesResourceExist = true;
		}
		catch(error)
		{
			doesResourceExist = false;
		}

		if(doesResourceExist)
		{
			res = await this.updateResource(body);
		}
		else
		{
			res = await this.createResource(body); 
		}

		return res;
	}

	async batch(body: any): Promise<PapiBatchResponse> 
	{
		// This method is not used in cpi-side
		throw new Error('Method not implemented.');
	}

	async getResources(query: any): Promise<any[]> 
	{
		// This method is not used in cpi-side
		// cpi-side only calls Search.
		throw new Error('Method not implemented.');
	}

	async getResourceByKey(key: string): Promise<any> 
	{
		const schemaFields = await this.getRequestedClientApiFields();
		const getParams: GetParams<string> = {
			key: {  
				UUID: key
			}, 
			fields: schemaFields
		};
		
		const getResult = await this.iClientApi.get(this.resourceName, getParams);
        
		return getResult.object
	}

	async getResourceByExternalId(externalId: any): Promise<any> 
	{
		const searchBody = this.createAUniqueFieldRequestBody("ExternalID", externalId);
		return await this.callSearchExpectingASingleResource(searchBody);
	}

	async getResourceByInternalId(internalId: any): Promise<any> 
	{
		const searchBody = this.createAUniqueFieldRequestBody("InternalID", internalId);
		return await this.callSearchExpectingASingleResource(searchBody);
	}

	protected createAUniqueFieldRequestBody(uniqueFieldID: string, uniqueFieldValue: string)
	{
		return {UniqueFieldID: uniqueFieldID,
			UniqueFieldList: [uniqueFieldValue]
		};
	}

	protected async callSearchExpectingASingleResource(searchBody: any)
	{
		const res = await this.searchResource(searchBody);
		if(res.Objects.length === 1)
		{
			return res.Objects[0];
		}
		else if(res.Objects.length > 1)
		{
			throw new Error("Something very strange happened... Found more than one instance.");
		}
		else
		{
			throw new Error("Could not find the requested resource");
		}
	}

	async searchResource(body: any): Promise<SearchResult> 
	{
		let clientApiSearchResult: ClientApiSearchResult<string>;
		body.Fields = body.Fields ? this.filterFieldsToMatchCpi(body.Fields.split(',')) : await this.getRequestedClientApiFields();

		// Due to the lack of time, I'm not validating the mutual exclusivity between Where, UniqueFieldList and KeyList.
		// This is promised in the API, and I'm counting on the api to hold to it's definition.
		// The exclusivity is defined here: https://apidesign.pepperi.com/generic-resources/introduction
		if(body.hasOwnProperty('UniqueFieldList') || body.hasOwnProperty('UUIDList')) // PAPI works with UUIDList, not KeyList.
		{
			const uniqueField = body.hasOwnProperty('UniqueFieldList') ? body.UniqueFieldID : 'UUID';
			const valuesList = body.hasOwnProperty('UniqueFieldList') ? body.UniqueFieldList : body.UUIDList;
			clientApiSearchResult = await this.handleSearchUniqueFieldList(uniqueField, valuesList, body.Fields, body.Page, body.PageSize);
		}
		else
		{
			const searchParams: SearchParams<string> = {
				fields: body.Fields,
				...(body.hasOwnProperty('Page') && {page: body.Page}),
				...(body.hasOwnProperty('PageSize') && {pageSize: body.PageSize}),
				...(body.hasOwnProperty('Where')) && {filter: transformSqlToJson(body.Where, await this.getClientApiFieldsTypes())},
			};

			clientApiSearchResult = await this.iClientApi.search(this.resourceName, searchParams);
		}

		// Build the SearchResult object to return
		const searchResult: SearchResult = {
			"Objects": clientApiSearchResult.objects,
			...(body.IncludeCount && {"Count" : clientApiSearchResult.count})
		};

		return searchResult;
	}

	async handleSearchUniqueFieldList(uniqueField: string, valuesList: string[], requestedFields: string[], page = 0, pageSize?: number): Promise<ClientApiSearchResult<string>>
	{
		// There's no 'in' operator in ClientApi. A "manual" implementation of this functionality is required.

		// 1. Get all of the resources, including the uniqueField (it might not be included in requestedFields).
		const searchFields = [...requestedFields];
		if(!searchFields.includes(uniqueField))
		{
			searchFields.push(uniqueField);
		}

		const searchParams: SearchParams<string> = {fields: searchFields};
        
		const clientApiSearchResult: ClientApiSearchResult<string> = await this.iClientApi.search(this.resourceName, searchParams);

		// 2. Filter the resources that fit the valuesList.
		// Assuming the resources.length is bigger than valuesList.length
		const resourcesHashTable = new Map();

		// Add the elements from resources to the hash table
		for (const resource of clientApiSearchResult.objects)
		{
			// Use toString() singe since we try to get the value from the hash table,
			// It is done using a parameter of type string.
			resourcesHashTable.set(resource[uniqueField].toString(), resource);
		}

		// Create an array to store the elements from the intersection
		const intersection: any[] = [];

		// Check each value from valuesList to see if it exists in the hash table
		for (const value of valuesList)
		{
			if (resourcesHashTable.has(value))
			{
				intersection.push(resourcesHashTable.get(value));
			}
		}

		// 3. set the count property to be the size of the intersection
		clientApiSearchResult.count = intersection.length;

		// 4. Get the requested page of resources
		let requestedPageResources;
		if(pageSize)
		{
			const firstIndex = Math.max(0, (page - 1)) * pageSize;
			const lastIndex = firstIndex + pageSize;
			requestedPageResources = intersection.slice(firstIndex, lastIndex);
		}
		else
		{
			requestedPageResources = intersection;
		}

		// 5. Keep only the required Fields
		const requestedPageResourceWithFields: Array<any> = [];
		for (const resource of requestedPageResources)
		{
			// For explanation about lodash.pick, see: https://lodash.com/docs/4.17.15#pick
			requestedPageResourceWithFields.push(pick(resource, requestedFields));
		}

		clientApiSearchResult.objects = requestedPageResourceWithFields;

		return clientApiSearchResult;
	}

	protected async getRequestedClientApiFields()
	{
    	try
		{
			const schema = await pepperi.addons.data.schemes.uuid(this.clientAddonUUID).name(this.resourceName).get();
			let schemaFields = Object.keys(schema.Fields);

			schemaFields = this.filterFieldsToMatchCpi(schemaFields);
			return schemaFields;
		}
		catch(error)
		{
			console.error(error instanceof Error ? error.message : 'Unknown error occurred.');
			throw error;
		}
	}

	protected filterFieldsToMatchCpi(schemaFields: string[]): string[] 
	{
		// ModificationDateTime isn't supported in cpi-side
		// Key is part of the schema, but doesn't exist on the PAPI object.
		return schemaFields.filter(field => field !== 'ModificationDateTime' && field !== 'Key');
	}

	protected async getClientApiFieldsTypes() : Promise<{[key: string]: FieldType}>
	{
    	const res: {[key: string]: FieldType} = {}
    	const schema = (await this.getResourceSchema()) as unknown as {[key: string]: any, Key: string};
        
    	for(const fieldName in schema.Fields)
    	{
    		res[fieldName] = schema.Fields[fieldName].Type
    	}

    	return res;
	}

	async getResourceSchema(): Promise<AddonDataScheme>
	{
		return await pepperi.addons.data.schemes.uuid(this.clientAddonUUID).name(this.resourceName).get() as unknown as AddonDataScheme;
	}
}
