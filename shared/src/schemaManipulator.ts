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
	public addField(fieldName: string, field: SchemeField): void
	{
        this.schema.Fields![fieldName] = field;
	}
}
