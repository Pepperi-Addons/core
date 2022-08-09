import { Client, Request } from '@pepperi-addons/debug-server';
import { CoreService } from './core.service';
import { CoreSchemaService } from './coreSchema.service';
import { Helper } from './helper';
import PapiService from './papi.service';

export async function create(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "POST": {
		const coreSchema = getCoreSchemaService(client, request);
		return await coreSchema.createSchema();
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function purge(client: Client, request: Request) 
{

	switch (request.method) 
	{
	case "POST": {
		const coreSchema = getCoreSchemaService(client, request);
		return await coreSchema.purgeSchema();
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function resources(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "GET":
	{
		const coreService = getCoreService(client, request);

		if(request.query.key)
		{
			return await coreService.getResourceByKey();
		}
		else
		{
			return await coreService.getResources();
		}
	}
	case "POST":
	{
		const coreService = getCoreService(client, request);
		return await coreService.createResource();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function batch(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);
	console.log(`Body received: ${JSON.stringify(request.body)}`);

	switch (request.method) 
	{
	case "POST":
	{
		const coreService = getCoreService(client, request);
		return await coreService.batch();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function get_by_unique_field(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "GET":
	{
		const coreService = getCoreService(client, request);
		return await coreService.getResourceByUniqueField();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function search(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "POST":
	{
		const coreService = getCoreService(client, request);
		return coreService.search();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

function getCoreSchemaService(client: Client, request: Request)
{
	const papiService = getPapiService(client);
	const core = new CoreSchemaService(request.body?.Name, request, client, papiService);
	return core;
}


function getCoreService(client: Client, request: Request)
{
	const papiService = getPapiService(client);
	const core = new CoreService(request.query?.resource_name, request, papiService);
	return core;
}

function getPapiService(client: Client) 
{
	const papiClient = Helper.getPapiClient(client);
	const papiService = new PapiService(papiClient);
	return papiService;
}