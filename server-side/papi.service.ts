import { PapiClient } from '@pepperi-addons/papi-sdk';
import { ResourceFields } from './constants';
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
}

export default PapiService;