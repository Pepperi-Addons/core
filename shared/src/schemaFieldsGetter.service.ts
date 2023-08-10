import { AddonDataScheme } from '@pepperi-addons/papi-sdk';
import { FieldType } from '@pepperi-addons/pepperi-filters';
import { getDefaultSchemaFields, getPapiKeyPropertyName } from './constants';
import { ISchemaGetter } from './iSchemaGetter';

export interface SchemaFieldsResult
{
    [key: string]: {FieldType: FieldType, TranslatedFieldName: string}
}

export class SchemaFieldsGetterService 
{
	/**
     * The maximum depth of reference fields to get
     * This is to prevent infinite loops
     */
	protected readonly MAX_DEPTH = 5;
	protected cachedSchemaFields: {[key: string]: SchemaFieldsResult} = {};

	constructor(protected schemaGetter: ISchemaGetter)
	{}

	public async getSchemaFields(schema: AddonDataScheme, currentDepth = 0): Promise<SchemaFieldsResult>
	{
		if(!this.cachedSchemaFields[schema.Name])
		{
			this.cachedSchemaFields[schema.Name] = await this.internalGetSchemaFields(schema, currentDepth);
		}

		return this.cachedSchemaFields[schema.Name];
	}

	protected async internalGetSchemaFields(schema: AddonDataScheme, currentDepth: number): Promise<SchemaFieldsResult>
	{
		const res: SchemaFieldsResult = {};
		const schemaFields = {...getDefaultSchemaFields(), ...schema.Fields};
        
		for (const fieldName in schemaFields)
		{
			Object.assign(res, await this.handleReferencedFields(schema, fieldName, currentDepth));

			// If the field is not a reference field, add it to the result
			if (!schemaFields[fieldName].Resource)
			{
				res[fieldName] = {
					FieldType: schemaFields[fieldName].Type as FieldType,
					TranslatedFieldName: this.handleKeyToPapiKeyPropertyName(fieldName, schema)
				};
			}
		}

		return res;
	}

	protected async handleReferencedFields(schema: AddonDataScheme, fieldName: string, currentDepth: number): Promise<SchemaFieldsResult>
	{
		const res: SchemaFieldsResult = {};

		if (currentDepth <= this.MAX_DEPTH && schema.Fields![fieldName]?.Resource) 
		{
			const referencedSchema = await this.schemaGetter.getResourceSchema(schema.Fields![fieldName].Resource);
			const referencedSchemaFields =  await this.getSchemaFields(referencedSchema, currentDepth + 1);

			for (const referencedFieldName in referencedSchemaFields)
			{
				const referencedField = referencedSchemaFields[referencedFieldName];

				res[`${fieldName}.${referencedFieldName}`] = {
					FieldType: referencedField.FieldType,
					TranslatedFieldName: `${fieldName}.${referencedField.TranslatedFieldName}`
				};

				// ADAL also supports the following query syntax: "ResourceName.ReferencedFieldName", 
			    // so we need to add the following to the result as well:
				if(referencedFieldName === 'Key')
				{
					res[fieldName] = {
						FieldType: referencedField.FieldType,
						TranslatedFieldName: `${fieldName}.${this.handleKeyToPapiKeyPropertyName(referencedFieldName, referencedSchema)}`
					};
				}
			}
		}

		return res;
	}

	protected handleKeyToPapiKeyPropertyName(fieldName: string, schema: AddonDataScheme)
	{
		if (fieldName === 'Key')
		{
			fieldName = getPapiKeyPropertyName(schema.Name);
		}

		return fieldName;
	}
}
