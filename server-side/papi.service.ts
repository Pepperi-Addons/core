import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server';
import { ResourceFields } from './constants';

export class PapiService 
{

	papiClient: PapiClient

	constructor(private client: Client) 
	{
		this.papiClient = new PapiClient({
			baseURL: client.BaseURL,
			token: client.OAuthAccessToken,
			addonUUID: client.AddonUUID,
			addonSecretKey: client.AddonSecretKey,
			actionUUID: client.ActionUUID
		});
	}

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