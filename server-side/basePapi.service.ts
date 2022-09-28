import { PapiClient } from '@pepperi-addons/papi-sdk';
import { PapiBatchResponse, ResourceFields } from './constants';
import { ErrorWithStatus } from './errorWithStatus';
import { Helper } from './helper';
import IPapiService from './IPapi.service';

export class BasePapiService implements IPapiService
{
	constructor(protected papiClient: PapiClient) 
	{}

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		const url = `/meta_data/${resourceName}/fields?include_owned=true&include_internal=false`;
		try
		{
			return await this.papiClient.get(url);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}

	}

	async createResource(resourceName: string, body: any)
	{
		return await this.upsertResource(resourceName, body);
	}

	async updateResource(resourceName: string, body: any)
	{
		return await this.upsertResource(resourceName, body);
	}

	async upsertResource(resourceName: string, body: any) 
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

	async batch(resourceName: string, body: any): Promise<PapiBatchResponse>
	{
		try
		{
			return await this.papiClient.post(`/batch/${resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async getResources(resourceName: string, query: any)
	{
		let url = `/${resourceName}`;
		const encodedQeury = Helper.encodeQueryParams(query);
		url = `${url}?${encodedQeury}`;
		try
		{
			return await this.papiClient.get(url);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		try
		{
			return await this.papiClient.get(`/${resourceName}/UUID/${key}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async getResourceByExternalId(resourceName: string, externalId: any)
	{
		try
		{
			return await this.papiClient.get(`/${resourceName}/ExternalId/${externalId}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async getResourceByInternalId(resourceName: string, internalId: any)
	{
		try
		{
			return await this.papiClient.get(`/${resourceName}/${internalId}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async searchResource(resourceName: string, body: void)
	{
		try
		{
			return await this.papiClient.apiCall("POST", `/${resourceName}/search`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}
}

export default BasePapiService;