import { Client, Request } from '@pepperi-addons/debug-server';
import { CoreSchemaService } from './coreSchema.service';
import { Helper } from './helper';
import PapiService from './papi.service';

export async function create(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "POST": {
		const papiClient = Helper.getPapiClient(client);
		const papiService = new PapiService(papiClient);
		const core = new CoreSchemaService(request.query?.resource_name, request, papiService);

		return await core.createSchema();
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}

export async function purge(client: Client, request: Request) 
{
	console.log(`Body received: ${JSON.stringify(request.body)}`);

	switch (request.method) 
	{
	case "POST": {
		const papiClient = Helper.getPapiClient(client);
		const papiService = new PapiService(papiClient);
		const core = new CoreSchemaService(request.body.Name, request, papiService);

		return await core.purgeSchema();
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}
