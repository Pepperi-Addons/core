import { Client, Request } from '@pepperi-addons/debug-server';
import { batch, get_by_unique_field, resources, search } from './data_source_api';

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

export async function get_account_users_by_key(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "account_users");
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

export async function account_users(client: Client, request: Request) 
{
	return await resourcesFunctionAdapter(client, request, "account_users");
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

export async function get_account_users_by_unique_field(client: Client, request: Request) 
{
	return await getByUniqueFieldFunctionAdapter(client, request, "account_users");
}

async function getByUniqueFieldFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, get_by_unique_field);
}
// #endregion

// #region search
export async function items_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "items");
}

export async function accounts_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "accounts");
}

export async function users_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "users");
}

export async function account_users_search(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "account_users");
}

async function searchFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, search);
}
// #endregion

// #region batch
export async function batch_items(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "items");
}

export async function batch_accounts(client: Client, request: Request) 
{
	return await searchFunctionAdapter(client, request, "accounts");
}

export async function batch_users(client: Client, request: Request) 
{
	return await batchFunctionAdapter(client, request, "users");
}

export async function batch_account_users(client: Client, request: Request) 
{
	return await batchFunctionAdapter(client, request, "account_users");
}

async function batchFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, batch);
}
// #endregion

async function resourcesFunctionAdapter(client: Client, request: Request, resourceName: string)
{
	return genericAdapter(client, request, resourceName, resources);
}

async function genericAdapter(client: Client, request: Request, resourceName: string, adaptedFunction: (client: Client, request: Request) => Promise<any>)
{
	const requestCopy = {...request};
	requestCopy.query.resource_name = resourceName;
	return adaptedFunction(client, requestCopy);
}
