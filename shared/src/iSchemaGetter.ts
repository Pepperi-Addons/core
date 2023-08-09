import { AddonDataScheme } from "@pepperi-addons/papi-sdk";

export interface ISchemaGetter
{
	getResourceSchema(resourceName?: string): Promise<AddonDataScheme>
}
