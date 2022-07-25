import { Client, Request } from '@pepperi-addons/debug-server';
import { get_by_unique_field, resources } from './data_source_api';

// #region get by key
export async function get_items_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "items");
}

export async function get_accounts_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "accounts");
}

export async function get_users_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "users");
}
// #endregion

// #region GET/POST

export async function items(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "items");
}

export async function accounts(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "accounts");
}

export async function users(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "users");
}
// #endregion

// #region get by unique field
export async function get_items_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "items");
}

export async function get_accounts_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "accounts");
}

export async function get_users_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "users");
}

async function getByUniqueFieldFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, get_by_unique_field);
}
// #endregion


async function resourcesFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, resources);
}

async function genericAdapter(client: Client, request: Request, resourceName: string, adaptedFunction: Function)
{
	const requestCopy = {...request};
	requestCopy.query.resource_name = resourceName;
	return adaptedFunction(client, requestCopy);
}
