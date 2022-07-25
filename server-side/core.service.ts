import { Request } from "@pepperi-addons/debug-server";
import { RESOURCE_TYPES, UNIQUE_FIELDS } from "./constants";
import PapiService from "./papi.service";

export class CoreService 
{
	constructor(protected resource: string, protected request: Request, protected papi: PapiService) 
	{
		this.validateResource();
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
	 * Return the item with the given key
	 */
	public async getResourceByKey(key?: string): Promise<any>
	{
		const requestedKey = key ?? this.request.query.key;

		this.validateKey(requestedKey);

		const papiItem = await this.papi.getResourceByKey(this.resource, requestedKey);
		const transaltedItem = this.translatePapiItemToItem(papiItem);

		return transaltedItem;
	}

	/**
	 * Returns an item by the unique field
	 */
	public async getResourceByUniqueField()
	{
		//validate field_id and value query parameters are present
		this.validateUniqueKeyPrerequisites();

		switch(this.request.query.field_id)
		{
		case "UUID":
		case "Key":
		{
			const key = this.request.query.value;
			return this.getResourceByKey(key);
		}
		case "InternalID":
		{
			const internalId = this.request.query.value;
			const papiItem = await this.papi.getResourceByInternalId(this.resource, internalId);
			const transaltedItem = this.translatePapiItemToItem(papiItem);

			return transaltedItem;
		}
		case "ExternalID":
		{
			const externalId = this.request.query.value;
			const papiItem = await this.papi.getResourceByExternalId(this.resource, externalId);
			const transaltedItem = this.translatePapiItemToItem(papiItem);

			return transaltedItem;
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
	validateUniqueKeyPrerequisites()
	{
		if (!(this.request.query.field_id && this.request.query.value))
		{
			throw new Error(`Missing the required field_id and value query parameters.`);
		}

		if(!UNIQUE_FIELDS.includes(this.request.query.field_id))
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
		const papiSearchBody = this.translateBodyToPapiSeacrhBody();

		const papiItems = await this.papi.searchResource(this.resource, papiSearchBody);
		
		const translatedItems = papiItems.map(papiItem => this.translatePapiItemToItem(papiItem));

		// if Fields are requested, drop any other fields
		// PAPI handles this for us, but this should be done
		// for any fields that were added during the translation.
		this.deleteUnwantedFieldsFromItems(translatedItems, this.request.body.fields);

		return translatedItems;
	}

	/**
	 * Given a list of wanted fields and a list of items, deletes unwanted fields from the items.
	 * @param items the items from which to delete the unwanted fields.
	 * @param fieldsString fields string, separated by ',', represents the wanted fields.
	 */
	private deleteUnwantedFieldsFromItems(items: any, fieldsString: any) {
		if (fieldsString) {
			const fields = fieldsString.split(",");
			items.forEach(item => {
				Object.keys(item).forEach(key => {
					if (!fields.includes(key)) {
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
	validateSearchPrerequisites()
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
	private translateBodyToPapiSeacrhBody()
	{
		const papiSearchBody: any = {};
		
		this.translatePapiSupportedSearchFields(papiSearchBody);

		this.trasnlateUniqueFieldQueriesToPapi(papiSearchBody);

		// If fields include property Key, remove it from the fields list and and UUID instead.
		const fields = papiSearchBody.fields?.split(',');
		if(fields?.includes("Key")){
			fields.splice(fields.indexOf("Key"), 1);
			fields.push("UUID");

			papiSearchBody.fields = fields.join(',');

		}

		return papiSearchBody;
	}

	private trasnlateUniqueFieldQueriesToPapi(papiSearchBody: any) {
		if (this.request.body.UniqueFieldID === "ExternalID") {
			papiSearchBody.where = `ExternalID in ('${this.request.body.UniqueFieldList.join('\',')}') ${papiSearchBody.where ?  `AND (${papiSearchBody.where})` : '' }`;
		}

		if (this.request.body.UniqueFieldID === "InternalID") {
			papiSearchBody.InternalIDList = this.request.body.UniqueFieldList;
		}

		if (this.request.body.UniqueFieldID === "UUID" || this.request.body.UniqueFieldID === "Key") {
			papiSearchBody.UUIDList = this.request.body.UniqueFieldList;
		}
	}

	private translatePapiSupportedSearchFields(papiSearchBody: any) {
		const papiSupportedSearchFields = ["page", "page_size", "include_deleted", "fields", "where", "InternalIDList", "UUIDList"];

		if (this.request.body.KeyList) {
			this.request.body.UUIDList = this.request.body.KeyList;
		}

		for (const supportedSearchField of papiSupportedSearchFields) {
			if (this.request.body[supportedSearchField]) {
				papiSearchBody[supportedSearchField] = this.request.body[supportedSearchField];
			}
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

		const papiItems = await this.papi.getResources(this.resource, queryCopy);

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
	 * Create a new item
	 * @returns the newly created item
	 */
	public async createResource()
	{
		// Translate the item to PAPI format
		const papiItemRequestBody = this.translateItemToPapiItem(this.request.body);
		// Create the PAPI item
		const papiItem = await this.papi.createResource(this.resource, papiItemRequestBody);
		// Transalte the PAPI item to an item
		const translatedItem = this.translatePapiItemToItem(papiItem);

		return translatedItem;
	}

	/**
	 * Translate the item to PAPI format
	 * @param body the item to translate
	 */
	protected translateItemToPapiItem(body: any)
	{
		const resItem = {...body};

		// If item has both UUID and Ket fields, make sure they are equivalent
		if (resItem.UUID && resItem.Key && resItem.UUID !== resItem.Key) 
		{
			throw new Error("The UUID and Key fields are not equivalent.");
		}

		// If item has a Key field, set the UUID field to the same value and delete the Key field
		if (resItem.Key)
		{
			resItem.UUID = resItem.Key;
			delete resItem.Key;
		}

		return resItem;
	}

	/**
	 * Translates a given Papi item to a resource item
	 * @param papiItem the papi item to translate
	 * @returns a resource item
	 */
	protected translatePapiItemToItem(papiItem: any) 
	{
		const resItem = { ...papiItem };
		resItem.Key = resItem.UUID;

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