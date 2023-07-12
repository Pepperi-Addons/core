import { PapiClient } from '@pepperi-addons/papi-sdk';
import { ErrorWithStatus, IPapiService } from 'core-shared';
import BasePapiService from './basePapi.service';

export class UsersPapiService extends BasePapiService implements IPapiService
{
	constructor(papiClient: PapiClient) 
	{
		super('users', papiClient);
	}

	async createResource(body: any)
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

	async updateResource(body: any)
	{
		try
		{
			return await this.papiClient.post(`/${this.resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async upsertResource(body: any): Promise<any> 
	{
		throw new Error('Method not implemented.');
	}
}

export default UsersPapiService;
