import {IPapiService, PapiBatchResponse, ResourceFields, SearchResult} from 'core-shared';
import { GetParams, GetResult, SearchParams, SearchResult as ClientApiSearchResult } from "@pepperi-addons/client-api";
import { FieldType } from "@pepperi-addons/pepperi-filters";
import { parse as transformSqlToJson } from '@pepperi-addons/pepperi-filters';
import _ from 'lodash';


export default class ClientApiService implements IPapiService
{
    constructor(protected clientAddonUUID: string){}

    async getResourceFields(resourceName: string): Promise<ResourceFields> {
        // This method is used for creation of a schema, and is not needed in cpi-side
        throw new Error('Method not implemented.');
    }
    async createResource(resourceName: string, body: any): Promise<any> {
        return await this.upsertResource(resourceName, body);
    }
    async updateResource(resourceName: string, body: any): Promise<any> {
        return await this.upsertResource(resourceName, body);
    }
    async upsertResource(resourceName: string, body: any): Promise<any> {
        throw new Error('Method not implemented.');
    }
    async batch(resourceName: string, body: any): Promise<PapiBatchResponse> {
        // This method is not used in cpi-side
        throw new Error('Method not implemented.');
    }
    async getResources(resourceName: string, query: any): Promise<any[]> {
        // This method is not used in cpi-side
        // cpi-side only calls Search.
        throw new Error('Method not implemented.');
    }
    async getResourceByKey(resourceName: string, key: string): Promise<any> {
        const schemaFields = await this.getRequestedClientApiFields(resourceName);

		const getParams: GetParams<string> = {
			key: {  
				UUID: key
			}, 
			fields: schemaFields
		};

        // CreationDate ins't synced for Catalogs.
        getParams.fields = getParams.fields.filter(field => field !== 'CreationDate');

		const getResult: GetResult<string> = await this.executeFunctionByName(`pepperi.api.${resourceName}.get`, globalThis, getParams);
        
		return getResult.object
    }
    async getResourceByExternalId(resourceName: string, externalId: any): Promise<any> {
        throw new Error('Method not implemented.');
    }
    async getResourceByInternalId(resourceName: string, internalId: any): Promise<any> {
        throw new Error('Method not implemented.');
    }
    async searchResource(resourceName: string, body: any): Promise<SearchResult> 
    {
        debugger;
        let clientApiSearchResult: ClientApiSearchResult<string>;

        body.Fields = body.Fields?.split(',') ?? await this.getRequestedClientApiFields(resourceName);
        body.Fields = body.Fields.filter(field => field !== 'CreationDate');

        // Due to the lack of time, I'm not validating the mutual exclusivity between Where, UniqueFieldList and KeyList.
        // This is promised in the API, and I'm counting on the api to hold to it's definition.
        // The exclusivity is defined here: https://apidesign.pepperi.com/generic-resources/introduction
        if(body.hasOwnProperty('UniqueFieldList') || body.hasOwnProperty('UUIDList')) // PAPI works with UUIDList, not KeyList.
        {
            const uniqueField = body.hasOwnProperty('UniqueFieldList'   ) ? body.UniqueFieldID : 'UUID';
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

            clientApiSearchResult = await this.executeFunctionByName(`pepperi.api.${resourceName}.search`, globalThis, searchParams);
        }

         // Build the SearchResult object to return
        const searchResult: SearchResult = {
            "Objects": clientApiSearchResult.objects,
            ...(body.IncludeCount && {"Count" : clientApiSearchResult.count})
        };

		return searchResult!;
    }

    async handleSearchUniqueFieldList(resourceName: string, uniqueField: string, valuesList: string[], fields: string[], page: number = 0, pageSize?: number): Promise<ClientApiSearchResult<string>>
    {
        debugger;
        // There's no 'in' operator in ClientApi. A "manual" implementation of this functionality is required.

        // 1. Get all of the resources.
        const searchParams: SearchParams<string> = {fields: fields};
        
        const clientApiSearchResult: ClientApiSearchResult<string> = await this.executeFunctionByName(`pepperi.api.${resourceName}.search`, globalThis, searchParams);

        // 2. Filter the resources that fit the valuesList.
        // Assuming the resources.length is bigger than valuesList.length
        const resourcesHashTable = new Map();

        // Add the elements from resources to the hash table
        for (const resource of clientApiSearchResult.objects)
        {
            resourcesHashTable.set(resource[uniqueField], resource);
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
            requestedPageResourceWithFields.push(_.pick(resource, fields));
        }

        clientApiSearchResult.objects = requestedPageResourceWithFields;

        return clientApiSearchResult;
    }

    protected executeFunctionByName(functionName: string, context: any, ...args: any[]): any 
    {
    const namespaces = functionName.split(".");
    const func = namespaces.pop();
    for (let i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func!].apply(context, args);
    }

    protected async getRequestedClientApiFields(resourceName: string)
    {
    	try{
            const schema = await pepperi.addons.data.schemes.uuid(this.clientAddonUUID).name(resourceName).get();
            let schemaFields = Object.keys(schema.Fields);
            // ModificationDateTime isn't supported in cpi-side
            schemaFields = schemaFields.filter(field => field !== 'ModificationDateTime');
            return schemaFields;
        }
        catch(error)
        {
            console.error(error instanceof Error ? error.message : 'Unknown error occurred.');
            throw error;
        }
    }

    protected async getClientApiFieldsTypes(resourceName: string) : Promise<{[key: string]: FieldType}>
    {
    	const res: {[key: string]: FieldType} = {}
    	const schema = await pepperi.addons.data.schemes.uuid(this.clientAddonUUID).name(resourceName).get();
        
    	for(const fieldName in schema.Fields)
    	{
    		res[fieldName] = schema.Fields[fieldName].Type
    	}

    	return res;
    }

}