import { IPapiService } from 'core-shared';
import { IClientApiService } from './iClientApiService';
import NoCreationDateCpiSideApiService from './noCreationDateCpiSideApiService';


export default class NoPostCpiSideApiService extends NoCreationDateCpiSideApiService implements IPapiService
{
	constructor(resourceName: string, clientAddonUUID: string, iClientApi: IClientApiService)
	{
		if(resourceName === 'employees')
		{
			resourceName = 'users'
		}

		super(resourceName, clientAddonUUID, iClientApi);
	}

	override async createResource(body: any): Promise<any> 
	{
		throw new Error(`Creation of a '${this.resourceName}' resource is not supported.`);
	}

	override async updateResource(body: any): Promise<any> 
	{
		throw new Error(`Updating a '${this.resourceName}' resource is not supported.`);
	}

	override async upsertResource(body: any): Promise<any> 
	{
		throw new Error(`Upserting a '${this.resourceName}' resource is not supported.`);
	}
}
