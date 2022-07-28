import { Client, Request } from "@pepperi-addons/debug-server";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { ResourceField, ResourceFields, RESOURCE_TYPES, UNIQUE_FIELDS } from "./constants";
import PapiService from "./papi.service";

export class CoreSchemaService
{
	constructor(protected resource: string, protected request: Request, protected client: Client, protected papi: PapiService)
	{
		this.validateResource();
	}

	/**
     * returns the schema of the requested resource
     */
	public async createSchema(): Promise<any>
	{
		const resourceFields: ResourceFields = await this.papi.getResourceFields(this.resource);
		const schema = this.translateResourceFieldsToSchema(resourceFields);

		return schema;
	}

	/**
	 * Throws an error if the requested resource is not supported
	 */
	private validateResource() 
	{
		if (!RESOURCE_TYPES.includes(this.resource)) 
		{
			const errorMessage = `The resource name is not valid. Please provide a valid resource name.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	/**
     * @param resourceFields The resource's fields to be translated to a valid Resource Schema
     * @returns a valid Resource Schema
     */
	protected translateResourceFieldsToSchema(resourceFields: ResourceFields)
	{
		const schema: AddonDataScheme = {
			Name: this.resource,
			Type: 'papi',
			AddonUUID: this.client.AddonUUID,
			GenericResource: true,
			Fields: {}
		};

		for (const resourceField of resourceFields)
		{
			if(schema.Fields)
			{
				schema.Fields[resourceField.FieldID] = {
					Type: this.getFieldTypeFromFieldsFormat(resourceField),
					Unique: UNIQUE_FIELDS.includes(resourceField.FieldID),
				}
			}
		}
        
		return schema;
	}


	/**
     * @param resourceField The resource field from which a field type will be extracted
     * @returns Returns a valid schema field type based on a ResourceField Format
     */
	protected getFieldTypeFromFieldsFormat(resourceField: ResourceField)
	{
		switch(resourceField.Format) 
		{
		case 'String':
		case 'Guid':
			return 'String'
		case 'DateTime':
			return 'DateTime'
		case 'Int32':
		case 'Int64':
			return 'Integer'
		case 'Boolean':
			return 'Bool'
		case 'Double':
		case 'Decimal':
			return 'Double'
		default:
			return 'String'
		}
	}

	public async purgeSchema() 
	{
		// DI-20776: Implement the purgeSchema method
		// In the future we should use “hard delete” of papi - which is not developed yet
		// There is no way to uninstall core addons anyhow
	}

}