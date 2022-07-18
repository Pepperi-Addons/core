import { Client, Request } from '@pepperi-addons/debug-server';
import { Core } from './core';
import PapiService from './papi.service';

export async function create(client: Client, request: Request) 
{
	console.log(`Query received: ${JSON.stringify(request.query)}`);

	switch (request.method) 
	{
	case "POST": {
		const papiService = new PapiService(client);
		const core = new Core(request, papiService);

		return await core.createSchema();
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}
