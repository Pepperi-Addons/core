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
	constructor(protected clientAddonUUID: string, protected iClientApi: IClientApiService)
	{}

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		// This method is used for creation of a schema, and is not needed in cpi-side
		throw new Error('Method not implemented.');
	}

	async createResource(resourceName: string, body: any): Promise<any> 
	{
		// Build CreateResourceParams
		const createResourceParams: CreateResourceParams = {
			object: body,
		}

		// Call to create the resource
		const addResult = await this.iClientApi.add(resourceName, createResourceParams);

		// Validate the creation process succeeded
		if(addResult.status !== 'added')
		{
			const errorMessage = `Adding resource of type ${resourceName} failed. Addition status: '${addResult.status}'. Message: '${addResult.message}'`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		// Get the newly created resource
		const resultObject = await this.getResourceByKey(resourceName, addResult.id);

		return resultObject;
	}

	async updateResource(resourceName: string, body: any): Promise<any> 
	{
		// Build UpdateParams
		const updateParams: UpdateParams = {
			objects: [
				body
			]
		}

		// Call to update the resource
		const updateResult = await this.iClientApi.update(resourceName, updateParams);

		// Validate the creation process succeeded
		if(updateResult.result[0].status !== 'updated')
		{
			const errorMessage = `Updating resource of type ${resourceName} failed. Update status: '${updateResult.result[0].status}'. Message: '${updateResult.result[0].message}'`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		// Get the newly updated resource
		const resultObject = await this.getResourceByKey(resourceName, updateResult.result[0].id);

		return resultObject;
	}

	async upsertResource(resourceName: string, body: any): Promise<any> 
	{
		let res: any;
		let doesResourceExist: boolean | undefined;

		try
		{
			await this.getResourceByKey(resourceName, body.UUID);
			doesResourceExist = true;
		}
		catch(error)
		{
			doesResourceExist = false;
		}

		if(doesResourceExist)
		{
			res = await this.updateResource(resourceName, body);
		}
		else
		{
			res = await this.createResource(resourceName, body); 
		}

		return res;
	}

	async batch(resourceName: string, body: any): Promise<PapiBatchResponse> 
	{
		// This method is not used in cpi-side
		throw new Error('Method not implemented.');
	}

	async getResources(resourceName: string, query: any): Promise<any[]> 
	{
		// This method is not used in cpi-side
		// cpi-side only calls Search.
		throw new Error('Method not implemented.');
	}

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		const schemaFields = await this.getRequestedClientApiFields(resourceName);
		const getParams: GetParams<string> = {
			key: {  
				UUID: key
			}, 
			fields: schemaFields
		};
		
		const getResult = await this.iClientApi.get(resourceName, getParams);
        
		return getResult.object
	}

	async getResourceByExternalId(resourceName: string, externalId: any): Promise<any> 
	{
		const searchBody = this.createAUniqueFieldRequestBody("ExternalID", externalId);
		return await this.callSearchExpectingASingleResource(resourceName, searchBody);
	}

	async getResourceByInternalId(resourceName: string, internalId: any): Promise<any> 
	{
		const searchBody = this.createAUniqueFieldRequestBody("InternalID", internalId);
		return await this.callSearchExpectingASingleResource(resourceName, searchBody);
	}

	protected createAUniqueFieldRequestBody(uniqueFieldID: string, uniqueFieldValue: string)
	{
		return {UniqueFieldID: uniqueFieldID,
			UniqueFieldList: [uniqueFieldValue]
		};
	}

	protected async callSearchExpectingASingleResource(resourceName: string, searchBody: any)
	{
		const res = await this.searchResource(resourceName, searchBody);
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

	async searchResource(resourceName: string, body: any): Promise<SearchResult> 
	{
		let clientApiSearchResult: ClientApiSearchResult<string>;
		body.Fields = body.Fields ? this.filterFieldsToMatchCpi(body.Fields.split(',')) : await this.getRequestedClientApiFields(resourceName);

		// Due to the lack of time, I'm not validating the mutual exclusivity between Where, UniqueFieldList and KeyList.
		// This is promised in the API, and I'm counting on the api to hold to it's definition.
		// The exclusivity is defined here: https://apidesign.pepperi.com/generic-resources/introduction
		if(body.hasOwnProperty('UniqueFieldList') || body.hasOwnProperty('UUIDList')) // PAPI works with UUIDList, not KeyList.
		{
			const uniqueField = body.hasOwnProperty('UniqueFieldList') ? body.UniqueFieldID : 'UUID';
			const valuesList = body.hasOwnProperty('UniqueFieldList') ? body.UniqueFieldList : body.UUIDList;
			clientApiSearchResult = await this.handleSearchUniqueFieldList(resourceName, uniqueField, valuesList, body.Fields, body.Page, body.PageSize);
		}
		else
		{
			const searchParams: SearchParams<string> = {
				fields: body.Fields,
				...(body.hasOwnProperty('Page') && {page: body.Page}),
				...(body.hasOwnProperty('PageSize') && {pageSize: body.PageSize}),
				...(body.hasOwnProperty('Where')) && {filter: transformSqlToJson(body.Where, await this.getClientApiFieldsTypes(resourceName))},
			};

			clientApiSearchResult = await this.iClientApi.search(resourceName, searchParams);
		}

		// Build the SearchResult object to return
		const searchResult: SearchResult = {
			"Objects": clientApiSearchResult.objects,
			...(body.IncludeCount && {"Count" : clientApiSearchResult.count})
		};

		return searchResult;
	}

	async handleSearchUniqueFieldList(resourceName: string, uniqueField: string, valuesList: string[], requestedFields: string[], page = 0, pageSize?: number): Promise<ClientApiSearchResult<string>>
	{
		// There's no 'in' operator in ClientApi. A "manual" implementation of this functionality is required.

		// 1. Get all of the resources, including the uniqueField (it might not be included in requestedFields).
		const clientApiSearchResult: ClientApiSearchResult<string> = await this.getAllResources(requestedFields, uniqueField, resourceName);

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

	/**
	 * Get all of the resources of a given resource name.
	 * Return only the requested fields, and the unique field.
	 * @param requestedFields {string[]} The fields to return.
	 * @param uniqueField {string} The unique field of the resource.
	 * @param resourceName {string} The name of the resource.
	 * @returns 
	 */
	private async getAllResources(requestedFields: string[], uniqueField: string, resourceName: string)
	{
		const searchFields = [...requestedFields];
		if (!searchFields.includes(uniqueField))
		{
			searchFields.push(uniqueField);
		}

		const searchParams: SearchParams<string> = { fields: searchFields };

		let clientApiSearchResult: ClientApiSearchResult<string> = await this.iClientApi.search(resourceName, searchParams);

		if (clientApiSearchResult.count > clientApiSearchResult.objects.length)
		{
			// In case the number of resources is bigger than the page size, we need to get all of the resources.
			searchParams.pageSize = clientApiSearchResult.count;
			clientApiSearchResult = await this.iClientApi.search(resourceName, searchParams);
		}

		return clientApiSearchResult;
	}

	protected async getRequestedClientApiFields(resourceName: string)
	{
    	try
		{
			const schema = await pepperi.addons.data.schemes.uuid(this.clientAddonUUID).name(resourceName).get();
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
		const res: Array<string> =  schemaFields.filter(field => field !== 'ModificationDateTime' && field !== 'Key');

		// Add UUID to the requested fields, so it will be translated into a Key property.
		res.push('UUID');
		return res;
	}

	protected async getClientApiFieldsTypes(resourceName: string) : Promise<{[key: string]: FieldType}>
	{
    	const res: {[key: string]: FieldType} = {}
    	const schema = (await this.getResourceSchema(resourceName)) as unknown as {[key: string]: any, Key: string};
        
    	for(const fieldName in schema.Fields)
    	{
    		res[fieldName] = schema.Fields[fieldName].Type
    	}

    	return res;
	}

	async getResourceSchema(resourceName: string): Promise<AddonDataScheme>
	{
		return await pepperi.addons.data.schemes.uuid(this.clientAddonUUID).name(resourceName).get() as unknown as AddonDataScheme;
	}
}
