import { Client, Request } from '@pepperi-addons/debug-server';
import {BaseCoreService, CatalogsAndAccountsCoreService, UsersCoreService, CoreSchemaService, IPapiService, Helper} from 'core-shared';
import BasePapiService from './basePapi.service';
import { UsersPapiService } from './usersPapi.service';
import { DIMXObject, AddonDataScheme } from '@pepperi-addons/papi-sdk';

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

export async function key(client: Client, request: Request)
{
	return await resources(client, request);
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

	if(request.body.DataSourceExportParams?.ForcedWhereClauseAddition)
	{
		request.query.where = `${request.body.DataSourceExportParams?.ForcedWhereClauseAddition}${request.query.where ? ` AND (${request.query.where})` : ''}`;
	}

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
		const coreService = await getCoreService(client, request);

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
		const coreService = await getCoreService(client, request);
		return await coreService.upsertResource();
	}
	default:
	{
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function batch(client: Client, request: Request) : Promise<{ DIMXObjects: DIMXObject[];}>
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);
	request.query.addon_uuid = request.body.AddonUUID;
	request.query.resource_name = request.body.Resource;

	switch (request.method) 
	{
	case "POST":
	{
		const coreService = await getCoreService(client, request);
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
		const coreService = await getCoreService(client, request);
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
		const coreService = await getCoreService(client, request);
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


async function getCoreService(client: Client, request: Request): Promise<BaseCoreService>
{
	let core: BaseCoreService;
	const papiService: IPapiService = getPapiService(client, request);
	const resourceSchema: AddonDataScheme = await getResourceSchema(client, request);

	switch(request.query?.resource_name)
	{
	case "users":
	case "employees":
	{
		core = new UsersCoreService(resourceSchema, request, papiService);
		break;
	}
	case "catalogs":
	case "accounts":
	{
		core = new CatalogsAndAccountsCoreService(resourceSchema, request, papiService);
		break;
	}
	default:
	{
		core = new BaseCoreService(resourceSchema, request, papiService);
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
	case "employees":
	{
		papiService = new UsersPapiService(papiClient);
		break;
	}
	default:
	{
		papiService = new BasePapiService(request.query.resource_name, papiClient);
		break;
	}
	}

	return papiService;
}

async function getResourceSchema(client: Client, request: Request): Promise<AddonDataScheme>
{
	const papiClient = Helper.getPapiClient(client, request.query.addon_uuid);
	const schemaOwnerPapiService = new BasePapiService(request.query.resource_name, papiClient);
	const resourceSchema = await schemaOwnerPapiService.getResourceSchema();

	return resourceSchema;
}
