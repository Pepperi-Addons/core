import { PapiClient } from '@pepperi-addons/papi-sdk';
import { PapiBatchResponse, ResourceFields } from './constants';
import { Helper } from './helper';

export class PapiService 
{
	constructor(protected papiClient: PapiClient) 
	{}

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		const url = `/meta_data/${resourceName}/fields?include_owned=true&include_internal=false`;
		return this.papiClient.get(url);
	}

	createResource(resourceName: string, body: any)
	{
		return this.papiClient.post(`/${resourceName}`, body);
	}

	batch(resourceName: string, body: any): Promise<PapiBatchResponse>
	{
		return this.papiClient.post(`/batch/${resourceName}`, body);
	}

	async getResources(resourceName: string, query: any)
	{
		let url = `/${resourceName}`;
		const encodedQeury = Helper.encodeQueryParams(query);
		url = `${url}?${encodedQeury}`;

		return this.papiClient.get(url);
	}

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		return this.papiClient.get(`/${resourceName}/UUID/${key}`);
	}

	async getResourceByExternalId(resourceName: string, externalId: any)
	{
		return this.papiClient.get(`/${resourceName}/ExternalId/${externalId}`);

	}

	async getResourceByInternalId(resourceName: string, internalId: any)
	{
		return this.papiClient.get(`/${resourceName}/${internalId}`);
	}

	async searchResource(resourceName: string, body: void)
	{
		return this.papiClient.post(`/${resourceName}/search`, body);
	}
}

export default PapiService;