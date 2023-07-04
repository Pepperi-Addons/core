import { AddonDataScheme, SchemeField } from "@pepperi-addons/papi-sdk";

/**
 * A class that helps to manipulate the schema
 */
export class SchemaManipulator
{
	constructor(protected schema: AddonDataScheme)
	{}

	/**
     * Add a field to the schema
     * @param fieldName {string} The name of the field to add
     * @param field {SchemeField} The field to add
     */
	protected addField(fieldName: string, field: SchemeField): void
	{
        this.schema.Fields![fieldName] = field;
	}

	/**
	 * Add the standard fields to the schema
	 * Standard fields are: Key and Hidden
	 * - Key is a string field
	 * - Hidden is a boolean field
	 * @returns void
	 */
	public addStandardFields(): void
	{
		const standardFields: {FieldName: string, SchemaField: SchemeField}[] = [
			{ FieldName: "Key", SchemaField: {Type: "String"}},
			{ FieldName: "Hidden", SchemaField: {Type: "Bool"}},
		];

		standardFields.map(standardField => this.addField(standardField.FieldName, standardField.SchemaField));
	}

}
