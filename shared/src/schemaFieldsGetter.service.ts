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

	public async getSchemaFields(schema: AddonDataScheme, currentDepth: number = 0): Promise<SchemaFieldsResult>
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

		if (schema.Fields![fieldName]?.Resource) 
		{
			// Get the referenced resource's schema
			const referencedResourceSchema = await this.schemaGetter.getResourceSchema(schema.Fields![fieldName].Resource);
			const referencedSchemaFields = {...getDefaultSchemaFields(), ...referencedResourceSchema.Fields};

			// Concat the referenced resource's schema fields to the referring field
			const nonReferringFields = Object.keys(referencedSchemaFields).filter(field => !referencedSchemaFields[field].Resource);

			for (const referencedField of nonReferringFields)
			{
				res[`${fieldName}.${referencedField}`] = {
					FieldType: referencedSchemaFields[referencedField].Type as FieldType,
					TranslatedFieldName: `${fieldName}.${this.handleKeyToPapiKeyPropertyName(referencedField, referencedResourceSchema)}`
				};
			}

			// ADAL also supports the following query syntax: "ResourceName.ReferencedFieldName", 
			// so we need to add the following to the result as well:
			if(Object.keys(referencedSchemaFields).includes('Key'))
			{
				res[fieldName] = {
					FieldType: referencedSchemaFields['Key'].Type as FieldType,
					TranslatedFieldName: `${fieldName}.${this.handleKeyToPapiKeyPropertyName('Key', referencedResourceSchema)}`
				};
			}

			// If the referenced resource has a reference field, recursively add it's fields to the referring field
			const hasReferringFields = Object.keys(referencedSchemaFields).some(field => referencedSchemaFields[field].Resource);

			if(hasReferringFields)
			{
				if(currentDepth <= this.MAX_DEPTH)
                {
                    const recursiveRes =  await this.getSchemaFields(referencedResourceSchema, currentDepth + 1);

                    for(const recursiveResFieldName in recursiveRes)
                    {
                        res[`${fieldName}.${recursiveResFieldName}`] = {
                            FieldType: recursiveRes[recursiveResFieldName].FieldType,
                            TranslatedFieldName: `${fieldName}.${recursiveRes[recursiveResFieldName].TranslatedFieldName}`
                        };
                    }   
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
