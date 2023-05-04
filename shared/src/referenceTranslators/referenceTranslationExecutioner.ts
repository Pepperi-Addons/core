import { AddonDataScheme } from "@pepperi-addons/papi-sdk";

export class ReferenceTranslationManager
{
    constructor(protected schema: AddonDataScheme)
    {}

    public papiToAdal(inputItems: any[]): any[]
    {
        const callback = (resourceName: string, fieldName: string, inputItems: any[]) =>
        {
            const referenceField = this.getResourcePapiReferenceField(resourceName);
            for (const inputItem of inputItems) {
                inputItem[fieldName] = inputItem[fieldName].Data[referenceField];
            }
        }

        return this.translate(inputItems, callback);
    }

    public adalToPapi(inputItems: any[]): any[]
    {
        const callback = (resourceName: string, fieldName: string, inputItems: any[]) =>
        {
            const referenceField = this.getResourcePapiReferenceField(resourceName);
            const resultReference: {Data: any} = {Data: {}}
            for(const inputItem of inputItems)
            {
                resultReference[referenceField] = inputItem[fieldName];
                inputItem[fieldName] = referenceField;
            }
        }

        return this.translate(inputItems, callback);
    }

    protected translate(inputItems: any[], callback: ((resourceName: string, fieldName: string, inputItem: any) => void))
    {
        const resItems = inputItems.map(inputItem => 
            {
                return {...inputItem};
            });

        // Arbitrarily take the fields from the first item.
        // Since all the items are from the same resource, they all have the same fields.
		const resItemFields = Object.keys(resItems[0]); 
		const requestedSchemaFields = Object.keys(this.schema.Fields!).filter(schemaField => resItemFields.includes(schemaField));

		requestedSchemaFields.map(field => {
			if (this.schema.Fields![field].Resource) {
				callback(this.schema.Fields![field].Resource!, field, resItems);
			}
		});

		return resItems;
    }

    protected getResourcePapiReferenceField(resourceName: string): string
    {
        switch (resourceName){
            case "roles":
            case "profiles":
                return "InternalID";
            default:
                return "UUID";
        }
    }
}
