import { IPapiService } from 'core-shared';
import NoCreationDateCpiSideApiService from './noCreationDateCpiSideApiService';


export default class CatalogsAndUsersCpiSideApiService extends NoCreationDateCpiSideApiService implements IPapiService
{
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
}
