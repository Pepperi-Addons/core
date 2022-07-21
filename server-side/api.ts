import { Client, Request } from '@pepperi-addons/debug-server';
import { resources } from './data_source_api';

// #region get by key
export async function get_items_by_key(client: Client, request: Request) 
{
	return await dataSourceQueriesAdapter(client, request, "items");
}

export async function get_accounts_by_key(client: Client, request: Request) 
{
	return await dataSourceQueriesAdapter(client, request, "accounts");
}

export async function get_users_by_key(client: Client, request: Request) 
{
	return await dataSourceQueriesAdapter(client, request, "users");
}
// #endregion

// #region GET

export async function items(client: Client, request: Request) 
{
	return await dataSourceQueriesAdapter(client, request, "items");
}

export async function accounts(client: Client, request: Request) 
{
	return await dataSourceQueriesAdapter(client, request, "accounts");
}

export async function users(client: Client, request: Request) 
{
	return await dataSourceQueriesAdapter(client, request, "users");
}
// #endregion

async function dataSourceQueriesAdapter(client: Client, request: Request, resourceName: string)
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "GET": {
		const requestCopy = {...request};
		requestCopy.query.resource_name = resourceName;
		return resources(client, requestCopy);
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}
