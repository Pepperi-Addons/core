import { BaseCoreService } from "./baseCore.service";
import { Request } from "@pepperi-addons/debug-server";
import IPapiService from "./IPapi.service";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { SchemaManipulator } from "./schemaManipulator";


export class AccountUsersCoreService extends BaseCoreService
{
	constructor(schema: AddonDataScheme, request: Request, papiService: IPapiService)
	{
		super(schema, request, papiService);
		// Add Key and Hidden fields to the schema, so when GETting from PAPI, we will get them
		const schemaManipulator = new SchemaManipulator(this.schema);
		schemaManipulator.addField('Key', { Type: 'String' });
		schemaManipulator.addField('Hidden', { Type: 'Bool' });
	}
}
