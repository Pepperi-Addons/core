import { IPapiService } from 'core-shared';
import { IClientApiService } from './iClientApiService';
import BaseCpiSideApiService from './baseCpiSideApiService';


export default class CatalogsAndUsersCpiSideApiService extends BaseCpiSideApiService implements IPapiService
{
	constructor(protected clientAddonUUID: string, protected iClientApi: IClientApiService)
	{
		super(clientAddonUUID, iClientApi);
	}

	async createResource(resourceName: string, body: any): Promise<any> 
	{
		throw new Error(`Creation of a '${resourceName}' resource is not supported.`);
	}

	async updateResource(resourceName: string, body: any): Promise<any> 
	{
		throw new Error(`Updating a '${resourceName}' resource is not supported.`);
	}

	async upsertResource(resourceName: string, body: any): Promise<any> 
	{
		throw new Error(`Upserting a '${resourceName}' resource is not supported.`);
	}

	protected filterFieldsToMatchCpi(schemaFields: string[]): string[]
	{
		schemaFields = super.filterFieldsToMatchCpi(schemaFields);
		
		// CreationDate isn't synced for catalogs and users resources
		return schemaFields.filter(field => field !== 'CreationDate' && field !== 'CreationDateTime');
	}
}
