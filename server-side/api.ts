import { Client, Request } from '@pepperi-addons/debug-server';
import { CoreService } from './core.service';
import { Helper } from './helper';
import PapiService from './papi.service';

export async function get_by_key(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "GET": {
		const papiClient = Helper.getPapiClient(client);
		const papiService = new PapiService(papiClient);
		const core = new CoreService(request.query?.resource_name, request, papiService);

		return await core.getByKey();
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function get_items_by_key(client: Client, request: Request) 
{
	return await getResourceItemByKey(client, request, "items");
}

export async function get_accounts_by_key(client: Client, request: Request) 
{
	return await getResourceItemByKey(client, request, "accounts");
}

export async function get_users_by_key(client: Client, request: Request) 
{
	return await getResourceItemByKey(client, request, "users");
}

async function getResourceItemByKey(client: Client, request: Request, resourceName: string)
{
    console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "GET": {
        const requestCopy = {...request};
        requestCopy.query.resource_name = resourceName;
		return get_by_key(client, request);
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}
