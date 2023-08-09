import { Client } from '@pepperi-addons/debug-server/dist';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { DIMX_ADDON_UUID } from './constants';

export class Helper
{
	static getPapiClient(client: Client, addonUUID?: string, secretKey?: string): PapiClient
	{
		return new PapiClient({
			baseURL: client.BaseURL,
			token: client.OAuthAccessToken,
			actionUUID: client.ActionUUID,
			...(addonUUID && {addonUUID: addonUUID}),
			...(secretKey && {addonSecretKey: secretKey}),
		});
	}

	static encodeQueryParams(params: any) 
	{
		const ret: string[] = [];

		Object.keys(params).forEach((key) => 
		{
			ret.push(key + '=' + encodeURIComponent(params[key]));
		});

		return ret.join('&');
	}

	static async validateAddonSecretKey(header: any, client: Client, addonUUID: any)
	{
		const lowerCaseHeaders = Helper.getLowerCaseHeaders(header);

		if (!lowerCaseHeaders['x-pepperi-secretkey'] || !(
			await this.isValidRequestedAddon(client, lowerCaseHeaders['x-pepperi-secretkey'], addonUUID) || // Given secret key doesn't match the client addon's.
			await this.isValidRequestedAddon(client, lowerCaseHeaders['x-pepperi-secretkey'], DIMX_ADDON_UUID) // Given secret key doesn't match the DIMX's.
		)) 
		{
			const err: any = new Error(`Authorization request denied. ${lowerCaseHeaders['x-pepperi-secretkey']? 'check secret key' : 'Missing secret key header'} `);
			err.code = 401;
			throw err;
		}
	}

	public static getLowerCaseHeaders(header: any) 
	{
		const lowerCaseHeaders = {};
		for (const [key, value] of Object.entries(header)) 
		{
			lowerCaseHeaders[key.toLowerCase()] = value;
		}
		return lowerCaseHeaders;
	}

	private static async isValidRequestedAddon(client: Client, secretKey, addonUUID)
	{
		const papiClient = Helper.getPapiClient(client, addonUUID, secretKey);

		try
		{
			const res = await papiClient.get(`/var/sk/addons/${addonUUID}/validate`);
			return true;
		}
		catch (err) 
		{
			if (err instanceof Error) 
			{
				console.error(`${err.message}`);
			}
			return false;
		}
	}
}
