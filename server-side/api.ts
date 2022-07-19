import { Client, Request } from '@pepperi-addons/debug-server';
import { resources } from './data_source_api';


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
		return resources(client, request);
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}
