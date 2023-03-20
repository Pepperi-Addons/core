import { IPapiService } from 'core-shared';
import NoCreationDateCpiSideApiService from './noCreationDateCpiSideApiService';


export default class NoPostCpiSideApiService extends NoCreationDateCpiSideApiService implements IPapiService
{
	override async createResource(resourceName: string, body: any): Promise<any> 
	{
		throw new Error(`Creation of a '${resourceName}' resource is not supported.`);
	}

	override async updateResource(resourceName: string, body: any): Promise<any> 
	{
		throw new Error(`Updating a '${resourceName}' resource is not supported.`);
	}

	override async upsertResource(resourceName: string, body: any): Promise<any> 
	{
		throw new Error(`Upserting a '${resourceName}' resource is not supported.`);
	}
}
