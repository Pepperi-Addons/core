import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import { ResourceFields } from './constants';

export class PapiService 
{

	// papiClient: PapiClient

	constructor(protected papiClient: PapiClient) 
	{}

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		const url = `/meta_data/${resourceName}/fields?include_owned=true&include_internal=false`;
		return this.papiClient.get(url);
	}

	getAddons(): Promise<InstalledAddon[]> 
	{
		return this.papiClient.addons.installedAddons.find({});
	}
}

export default PapiService;