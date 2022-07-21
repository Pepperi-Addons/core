import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class Helper
{
	static getPapiClient(client: Client): PapiClient
	{
		return new PapiClient({
			baseURL: client.BaseURL,
			token: client.OAuthAccessToken,
			addonUUID: client.AddonUUID,
			actionUUID: client.ActionUUID,
			addonSecretKey: client.AddonSecretKey,
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
}