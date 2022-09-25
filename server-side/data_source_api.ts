import { Client, Request } from '@pepperi-addons/debug-server';
import { BaseCoreService } from './baseCore.service';
import { CoreSchemaService } from './coreSchema.service';
import { Helper } from './helper';
import BasePapiService from './basePapi.service';
import { UsersCoreService } from './usersCore.service';
import { UsersPapiService } from './usersPapi.service';
import IPapiService from './IPapi.service';

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

export async function papi_export(client: Client, request: Request)
{
	const resourcesRequest = {...request};
	resourcesRequest.query['where'] = request.body['Where'];
	resourcesRequest.query['fields'] = request.body['Fields'];
	resourcesRequest.query['page'] = request.body['Page'];
	resourcesRequest.query['page_size'] = request.body['MaxPageSize'];
	resourcesRequest.query['order_by'] = request.body['OrderBy'];
	resourcesRequest.query['include_deleted'] = request.body["IncludeDeleted"];
	resourcesRequest.query['resource_name'] = request.body["Resource"];
	resourcesRequest.query['addon_uuid'] = request.body["AddonUUID"];

	resourcesRequest.method = 'GET';

	resourcesRequest.body = {};

	const exportResult = await resources(client, resourcesRequest);

	return {Objects: exportResult};
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
		// const papiClient = Helper.getPapiClient(client);
		// const papiService = new BasePapiService(papiClient);
		// const papiService = new UsersPapiService(papiClient);
		// const coreService = new BaseCoreService(request.query.resource_name, request, papiService);
		return await coreService.upsertResource();
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
	const papiService = getPapiService(client, request);
	const core = new CoreSchemaService(request.body?.Name, request, client, papiService);
	return core;
}


function getCoreService(client: Client, request: Request)
{
	let core: BaseCoreService | undefined = undefined;
	const papiService: IPapiService = getPapiService(client, request);

	switch(request.query?.resource_name)
	{
		case "users":
			{
				core = new UsersCoreService(request.query?.resource_name ?? request.body.Resource, request, papiService);
				break;
			}
		default:
			{
				core = new BaseCoreService(request.query?.resource_name ?? request.body.Resource, request, papiService);
			}
	}

	return core;
}

function getPapiService(client: Client, request: Request) : IPapiService
{
	const papiClient = Helper.getPapiClient(client);
	let papiService: IPapiService | undefined = undefined;

	switch(request.query.resource_name)
	{
		case "users":
		{
			papiService = new UsersPapiService(papiClient);
			break;
		}
		default:
		{
			papiService = new BasePapiService(papiClient);
			break;
		}
	}

	return papiService;
}