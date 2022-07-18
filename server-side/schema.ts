import { Client, Request } from '@pepperi-addons/debug-server';
import { CoreService } from './core.service';
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
		const core = new CoreService(request, papiService);

		return await core.createSchema();
	}
	default: {
		throw new Error(`Unsupported method: ${request.method}`);
	}
	}
}
