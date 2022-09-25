import { Client, Request } from "@pepperi-addons/debug-server";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { ResourceField, ResourceFields, RESOURCE_TYPES, UNIQUE_FIELDS } from "./constants";
import { Helper } from "./helper";
import IPapiService from "./IPapi.service";

export class CoreSchemaService
{
	constructor(protected resource: string, protected request: Request, protected client: Client, protected papi: IPapiService)
	{
		this.validateResource();
	}

	/**
     * returns the schema of the requested resource
     */
	public async createSchema(): Promise<any>
	{
		await this.validateSchemaCreationRequest();
		

		// Return the client addon's scheme (of type 'papi').
		return this.getMergedSchema();
	
	}

	private async getMergedSchema(): Promise<AddonDataScheme>
	{
		const resourceFields: ResourceFields = await this.papi.getResourceFields(this.resource);
		const schema = this.translateResourceFieldsToSchema(resourceFields);
		const result = {
			...this.request.body,
			...schema
		}

		if(this.request.body.Fields)
		{
			result.Fields = {
				...this.request.body.Fields,
				...schema.Fields
			};
		}

		return result;
	}

	private async validateSchemaCreationRequest()
	{
		await this.validateSchemaAlterationRequest();
		this.validateSchemaType();

	}

	private async validateSchemaAlterationRequest()
	{
		// Validate that the provided secret key matches the addon's secre key, and that the addon is indeed installed.
		await Helper.validateAddonSecretKey(this.request.header, this.client, this.request.query.addon_uuid);

		// Validate that the requested schema is valid
		this.validateSchemaName();
		this.validateSchemaFields();
	}

	/**
     * Validates that the requested schema type is 'papi'. Throws an excpetion otherwise.
     */
	private validateSchemaType() 
	{
		if (!this.request.body || this.request.body.Type !== 'papi') 
		{
			throw new Error("The schema must be of type 'papi'")
		}
	}

	private validateSchemaName() 
	{
		if (!this.request.body || !this.request.body.Name) 
		{
			throw new Error("The schema must have a Name property");
		}

		if(!RESOURCE_TYPES.includes(this.request.body.Name)) 
		{
			throw new Error("Can not create a schema for the resource '" + this.request.body.Name + "'. Supported resources are: '" + RESOURCE_TYPES.join(', ') + "'");
		}
	}

	/**
	 * Throws an exception if the schema fields are passed. 
	 * Currently no custom fields are supported.
	 */
	private validateSchemaFields()
	{
		if(this.request.body.Fields && Object.keys(this.request.body.Fields).length > 0)
		{
			throw new Error("Custom fields are not supported.");
		}
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
		const schema = {
			Name: this.resource,
			Type: 'papi',
			AddonUUID: this.request.query.addon_uuid,
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

		this.validateSchemaAlterationRequest();
	}

}