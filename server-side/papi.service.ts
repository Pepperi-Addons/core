import { PapiClient } from '@pepperi-addons/papi-sdk';
import { ResourceFields } from './constants';

export class PapiService 
{
	constructor(protected papiClient: PapiClient) 
	{}

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		const url = `/meta_data/${resourceName}/fields?include_owned=true&include_internal=false`;
		return this.papiClient.get(url);
	}

	getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		return this.papiClient.get(`/${resourceName}/UUID/${key}`);
	}
}

export default PapiService;