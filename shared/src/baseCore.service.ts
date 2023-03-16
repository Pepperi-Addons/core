import { Request } from "@pepperi-addons/debug-server";
import { DIMXObject, AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { PapiBatchResponse, RESOURCE_TYPES, SearchResult, UNIQUE_FIELDS } from "./constants";
import IPapiService from "./IPapi.service";

export class BaseCoreService 
{
	constructor(protected schema: AddonDataScheme, protected request: Request, protected papi: IPapiService) 
	{
		this.validateResource();
	}

	/**
	 * Throws an error if the requested resource is not supported
	 */
	protected validateResource() 
	{
		if (!RESOURCE_TYPES.includes(this.schema.Name)) 
		{
			const errorMessage = `The resource name is not valid. Please provide a valid resource name.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	/**
	 * Return the item with the given key
	 */
	public async getResourceByKey(key?: string): Promise<any>
	{
		const requestedKey = key ?? this.request.query.key;

		this.validateKey(requestedKey);

		const papiItem = await this.papi.getResourceByKey(this.schema.Name, requestedKey);
		const translatedItem = this.translatePapiItemToItem(papiItem);

		return translatedItem;
	}

	/**
	 * Returns an item by the unique field
	 */
	public async getResourceByUniqueField(field_id?: string, value?: string)
	{
		const requestedFieldId = field_id ?? this.request.query.field_id;
		const requestedValue = value ?? this.request.query.value;

		//validate field_id and value query parameters are present
		this.validateUniqueKeyPrerequisites(requestedFieldId, requestedValue);

		switch(requestedFieldId)
		{
		case "UUID":
		case "Key":
		{
			return await this.getResourceByKey(requestedValue);
		}
		case "InternalID":
		{

			const papiItem = await this.papi.getResourceByInternalId(this.schema.Name, requestedValue);
			const translatedItem = this.translatePapiItemToItem(papiItem);

			return translatedItem;
		}
		case "ExternalID":
		{
			const papiItem = await this.papi.getResourceByExternalId(this.schema.Name, requestedValue);
			const translatedItem = this.translatePapiItemToItem(papiItem);

			return translatedItem;
		}
		default:
		{
			// Something weird happened, since the field_id is not one of the above
			// and it is validated in the validateUniqueKeyPrerequisites function...
			const errorMessage = `The field_id is not valid. Please provide a valid field_id.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
		}
	}

	/**
	 * Throws an exception if field_id and value query parameters are not present
	 */
	protected validateUniqueKeyPrerequisites(requestedFieldId: string, requestedValue: string)
	{
		if (!(requestedFieldId && requestedValue))
		{
			throw new Error(`Missing the required field_id and value query parameters.`);
		}

		if(!UNIQUE_FIELDS.includes(requestedFieldId))
		{
			throw new Error(`The field_id query parameter is not valid. Supported field_ids are: ${UNIQUE_FIELDS.join(", ")}`);
		}
	}

	/**
	 * Perform a search like a GET endpoint, but given a body to overcome the URL size limitation to get list of objects.
	 * @returns a list of items that match the required parameters
	 */
	public async search()
	{
		this.validateSearchPrerequisites();
		// Create a papi Search body
		const papiSearchBody = this.translateBodyToPapiSearchBody();

		const res: SearchResult = await this.papi.searchResource(this.schema.Name, papiSearchBody);
		
		res.Objects = res.Objects.map(papiItem => this.translatePapiItemToItem(papiItem));

		// if Fields are requested, drop any other fields
		// PAPI handles this for us, but this should be done
		// for any fields that were added during the translation.
		this.deleteUnwantedFieldsFromItems(res.Objects, this.request.body.Fields);

		return res;
	}

	/**
	 * Given a list of wanted fields and a list of items, deletes unwanted fields from the items.
	 * @param items the items from which to delete the unwanted fields.
	 * @param fieldsArray an array of string representing the wanted fields.
	 */
	private deleteUnwantedFieldsFromItems(items: any, fieldsArray: Array<string>) 
	{
		if (fieldsArray) 
		{
			items.forEach(item => 
			{
				Object.keys(item).forEach(key => 
				{
					if (!fieldsArray.includes(key)) 
					{
						delete item[key];
					}
				});
			}
			);
		}
	}

	/**
	 * Throws an exception if the search body is not valid
	 */
	protected validateSearchPrerequisites()
	{
		if(this.request.body.UniqueFieldID && !UNIQUE_FIELDS.includes(this.request.body.UniqueFieldID))
		{
			const errorMessage = `The passed UniqueFieldID is not supported: '${this.request.body.UniqueFieldID}'. Supported UniqueFieldID values are: ${JSON.stringify(UNIQUE_FIELDS)}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		if(this.request.body.KeyList && (this.request.body.UniqueFieldID || this.request.body.UniqueFieldList))
		{
			const errorMessage = `Sending both KeyList and UniqueFieldList is not supported.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		if(this.request.body.UniqueFieldList && !this.request.body.UniqueFieldID)
		{
			const errorMessage = `Missing UniqueFieldID parameter.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	/**
	 * Returns a papi compliant search body
	 */
	private translateBodyToPapiSearchBody()
	{
		const papiSearchBody: any = {};
		
		this.translatePapiSupportedSearchFields(papiSearchBody);

		// If fields include property Key, remove it from the fields list and and UUID instead.
		let fields = papiSearchBody.Fields?.split(',');

		// Remove possible duplicates in Fields
		fields = fields?.filter((item,index) => fields.indexOf(item) === index);

		if(fields?.includes("Key"))
		{
			fields.splice(fields.indexOf("Key"), 1);
			fields.push("UUID");

			papiSearchBody.Fields = fields.join(',');
		}

		// If the query passed a page_size=-1, remove it.
		// Resources with a lot of objects might time out otherwise.
		// For more information see: https://pepperi.atlassian.net/browse/DI-21943
		if(papiSearchBody.PageSize === -1)
		{
			delete papiSearchBody.PageSize;
		}

		// If not IncludeDeleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// In order for Nebula (which works via ADAL directly with Core) to work
		// as intended and get the filtered account_users, it was decided that the
		// filtering will be done in Core for all resources, since it should have
		// no real impact.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		papiSearchBody.Where = this.filterHiddenObjects(papiSearchBody.Where, papiSearchBody.IncludeDeleted);

		return papiSearchBody;
	}

	/**
	 * Filters out hidden objects from the search query.
	 * 
	 * @param {string} where - The search query.
	 * @param {boolean} includeDeleted - Whether to include deleted objects.
	 * @returns {string} The filtered search query.
	 */
	private filterHiddenObjects(where: string | undefined, includeDeleted: boolean): string | undefined
	{
		const res = includeDeleted ? where : `Hidden=0${where ? ` AND (${where})` : ''}`;

		return res;
	}

	private translatePapiSupportedSearchFields(papiSearchBody: any) 
	{
		// populate papiSearchBody with the properties on the request's body, keeping any existing properties on the papiSearchBody.
		Object.keys(this.request.body).map(key => papiSearchBody[key] = this.request.body[key]);
		// Key isn't supported by PAPI natively. We have to use UUID instead.
		if (papiSearchBody.KeyList) 
		{
			papiSearchBody.UUIDList = papiSearchBody.KeyList;
			delete papiSearchBody.KeyList;
		}

		if(papiSearchBody.UniqueFieldID === 'Key')
		{
			papiSearchBody.UniqueFieldID = 'UUID';
		}

		// Fields are passed as an array of strings, while PAPI supports a string that is separated by commas.
		if(papiSearchBody.Fields && Array.isArray(papiSearchBody.Fields))
		{
			papiSearchBody.Fields = (papiSearchBody.Fields as Array<string>).join(',');
		}
	}

	/**
	 * Return a list of items
	 */
	public async getResources() 
	{
		// Pass a query without resource_name
		const queryCopy = { ...this.request.query };
		delete queryCopy.resource_name;


		// Since PAPI does not have a Key field, we need to remove it from the query
		// And add the equivalent UUID field to the query
		this.changeKeyFieldQueryToUuidFieldQuery(queryCopy);

		// If the query passed a page_size=-1, remove it.
		// Resources with a lot of objects might time out otherwise.
		// For more information see: https://pepperi.atlassian.net/browse/DI-21943
		if(queryCopy.page_size === "-1")
		{
			delete queryCopy.page_size;
		}

		// If not include_deleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// In order for Nebula (which works via ADAL directly with Core) to work
		// as intended and get the filtered account_users, it was decided that the
		// filtering will be done in Core for all resources, since it should have
		// no real impact.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		queryCopy.where = this.filterHiddenObjects(queryCopy.where, this.request.query.include_deleted);

		const papiItems = await this.papi.getResources(this.schema.Name, queryCopy);

		const translatedItems = papiItems.map(papiItem => this.translatePapiItemToItem(papiItem));

		// if Fields are requested, drop any other fields
		// PAPI handles this for us, but this should be done
		// for any fields that were added during the translation.
		this.deleteUnwantedFieldsFromItems(translatedItems, this.request.query.fields)

		return translatedItems;
	}

	/**
	 * If a query contains a key field, change it to a UUID field
	 * @param query
	 */
	private changeKeyFieldQueryToUuidFieldQuery(query: any)
	{
		if (query.fields) 
		{
			const fields = query.fields.split(",");
			if (fields.includes("Key")) 
			{
				fields.splice(fields.indexOf("Key"), 1);
				fields.push("UUID");
				query.fields = fields.join(",");
			}
		}
	}
	/**
	 * Upserts a resource
	 * @returns the updated resource
	 */
	public async upsertResource()
	{
		// Translate the item to PAPI format
		const papiItemRequestBody = this.translateItemToPapiItem(this.request.body);
		// Create the PAPI item
		const papiItem = await this.papi.upsertResource(this.schema.Name, papiItemRequestBody);
		// Translate the PAPI item to an item
		const translatedItem = this.translatePapiItemToItem(papiItem);

		return translatedItem;
	}

	/**
	 * Batch upserts a list of items
	 * @returns a list of upserted items
	 */
	public async batch(): Promise<{DIMXObjects: DIMXObject[]}>
	{
		this.validateBatchPrerequisites();

		const batchObjects = [...this.request.body.Objects];
		// Translate the items to PAPI format
		const papiItems = batchObjects.map(batchObject => this.translateItemToPapiItem(batchObject));
		const papiBatchResult: PapiBatchResponse = await this.papi.batch(this.schema.Name, papiItems);
		// PAPI batch objects are returned with empty UUIDs. We have to get the
		// actual UUIDs from PAPI and replace the empty UUIDs with the actual UUIDs.
		await this.fillPapiBatchResultWithUUIDs(papiBatchResult);

		// To comply with DIMX Batch operations, we have to return DIMXObjects
		const batchDimxObjects = this.translatePapiBatchResponseToDimxObjects(papiBatchResult)

		return batchDimxObjects;
	}

	/**
	 * Throws an error in case the body is missing an Objects array, or if a OverwriteObject=true is passed.
	 */
	protected validateBatchPrerequisites()
	{
		let errorMessage = '';
		if(!(this.request.body?.Objects && Array.isArray(this.request.body?.Objects)))
		{
			errorMessage = 'Missing an Objects array';
		}

		if(this.request.body.OverwriteObject)
		{
			errorMessage = 'OverwriteObject parameter is not supported.'
		}

		if(errorMessage)
		{
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	/**
	 * Create an Array of DIMXObject based on a PapiBatchResponse
	 * @param papiBatchResult The papiBatchResult from which to create DIMXObjects
	 * @returns an Array of DIMXObject based on a PapiBatchResponse
	 */
	protected translatePapiBatchResponseToDimxObjects(papiBatchResult: PapiBatchResponse): {DIMXObjects: Array<DIMXObject>}
	{
		const res: {DIMXObjects: DIMXObject[]} = {DIMXObjects: []};
		res.DIMXObjects = papiBatchResult.map(papiItem => 
		{
			return {
				Key: papiItem.UUID!,
				Status: papiItem.Status,
				...(papiItem.Status === "Error" && {Details: papiItem.Message})
			}
		});

		return res;
	}

	/**
	 * PAPI batch objects are returned with empty UUIDs. We have to set the
	 * actual UUIDs based on the original batch request - DIMX validates that each item has a Key.
	 * @param papiBatchResult the PapiBatchResponse object on which to add UUIDs
	 */
	protected async fillPapiBatchResultWithUUIDs(papiBatchResult: PapiBatchResponse)
	{
		const batchObjects = [...this.request.body.Objects];
		const batchObjectKeys = batchObjects.map(batchObject => batchObject.Key);

		papiBatchResult.forEach((papiItem, index) => 
		{
			papiItem.UUID = batchObjectKeys[index];
		});
	}

	/**
	 * Translate the item to PAPI format
	 * @param item the item to translate
	 */
	protected translateItemToPapiItem(item: any)
	{
		// Add a UUID property equal to Key.
		let resItem = this.AddUUIDPropertyEqualToKey(item);

		// Translate ADAL references to PAPI references.
		resItem = this.translateAdalReferencesToPapiReferences(resItem);

		return resItem;
	}

	private AddUUIDPropertyEqualToKey(item: any)
	{
		const resItem = { ...item };

		// If item has both UUID and Key fields, make sure they are equivalent
		if (resItem.UUID && resItem.Key && resItem.UUID !== resItem.Key) {
			throw new Error("The UUID and Key fields are not equivalent.");
		}

		// If item has a Key field, set the UUID field to the same value and delete the Key field
		if (resItem.Key) {
			resItem.UUID = resItem.Key;
			delete resItem.Key;
		}
		return resItem;
	}

	private translateAdalReferencesToPapiReferences(adalItem: any): any
	{
		const resItem = { ...adalItem };

		const resItemFields = Object.keys(resItem);
		const requestedSchemaFields = Object.keys(this.schema.Fields!).filter(schemaField => resItemFields.includes(schemaField));

		requestedSchemaFields.map(field => {
			if (this.schema.Fields![field].Resource) {
				resItem[field] = {
					Data:
					{
						UUID :resItem[field]
					}
				}
			}
		});

		return resItem;
	}

	/**
	 * Translates a given Papi item to a resource item
	 * @param papiItem the papi item to translate
	 * @returns a resource item
	 */
	protected translatePapiItemToItem(papiItem: any) 
	{
		// Add Key property, equal to UUID.
		let resItem = this.addKeyPropertyEqualToUUID(papiItem);

		// Remove properties that are not part of the schema.
		resItem = this.removePropertiesNotListedOnSchema(resItem);

		// Add ms to DateTime fields. 
		// For more information see: https://pepperi.atlassian.net/browse/DI-23237
		resItem = this.addMsToDateTimeFields(papiItem);

		// Translate PAPI references to ADAL references.
		resItem = this.translatePapiReferencesToAdalReferences(resItem);

		return resItem;
	}

	private addKeyPropertyEqualToUUID(papiItem: any): any
	{
		const resItem = { ...papiItem };
		resItem.Key = resItem.UUID;
		return resItem;
	}

	removePropertiesNotListedOnSchema(item: any): any 
	{
		const resItem = { ...item };

		const resItemFields = Object.keys(resItem);
		const schemaFields = Object.keys(this.schema.Fields!);

		// Keep only fields that listed on the schema, or TSA fields.
		const fieldsToDelete = resItemFields.filter(field => this.shouldFieldBeDeleted(field, schemaFields));
		fieldsToDelete.map(absentField => delete resItem[absentField]);
		
		return resItem;
	}

	/**
	 * Add milliseconds to DateTime fields on the PAPI item.
	 */
	private addMsToDateTimeFields(papiItem: any): any {
		const resItem = { ...papiItem };

		const resItemFields = Object.keys(resItem);
		const schemaFields = Object.keys(this.schema.Fields!);

		// Keep fields that are part of the schema, and are of type DateTime
		const dateTimeFields = resItemFields.filter(field => schemaFields.includes(field) && this.schema.Fields![field].Type === 'DateTime');

		// Set a new Date on the resItem
		dateTimeFields.map(dateTimeField => {
			resItem[dateTimeField] = new Date(resItem[dateTimeField]).toISOString();
		})
		
		return resItem;
	}

	protected shouldFieldBeDeleted(field: string, schemaFields: string[]): boolean
	{
		return !(schemaFields.includes(field) || field.startsWith('TSA') || field.startsWith('PSA'));
	}

	private translatePapiReferencesToAdalReferences(papiItem: any): any
	{
		const resItem = { ...papiItem };

		const resItemFields = Object.keys(resItem);
		const requestedSchemaFields = Object.keys(this.schema.Fields!).filter(schemaField => resItemFields.includes(schemaField));

		requestedSchemaFields.map(field => {
			if (this.schema.Fields![field].Resource) {
				resItem[field] = resItem[field].Data.UUID;
			}
		});

		return resItem;
	}

	/**
	 * Throws an error if no key is provided
	 */
	private validateKey(key: string) 
	{
		if (!key) 
		{
			throw new Error("No key provided");
		}
	}

}
