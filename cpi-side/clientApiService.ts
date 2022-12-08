import {IPapiService, PapiBatchResponse, ResourceFields, SearchResult} from 'core-shared';
import { GetParams, GetResult, SearchParams, SearchResult as ClientApiSearchResult } from "@pepperi-addons/client-api";
import { FieldType } from "@pepperi-addons/pepperi-filters";
import { parse as transformSqlToJson } from '@pepperi-addons/pepperi-filters'


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