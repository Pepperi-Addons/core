import { ErrorWithStatus, IPapiService } from 'core-shared';
import BasePapiService from './basePapi.service';

export class UsersPapiService extends BasePapiService implements IPapiService
{

	async createResource(resourceName: string, body: any)
	{
		try
		{
			return await this.papiClient.post(`/createUser`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async updateResource(resourceName: string, body: any)
	{
		try
		{
			return await this.papiClient.post(`/${resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async upsertResource(resourceName: string, body: any): Promise<any> 
	{
		throw new Error('Method not implemented.');
	}
}

export default UsersPapiService;
