import { Request } from "@pepperi-addons/debug-server";
import { RESOURCE_TYPES } from "./constants";
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
	public async getByKey() 
	{
		this.validateKey();

		const key = this.request.query.key;
		const papiItem = await this.papi.getResourceByKey(this.resource, key);
		const transaltedItem = this.translatePapiItemToItem(papiItem);

		return transaltedItem;
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
		if (this.request.query.fields) 
		{
			const fields = this.request.query.fields.split(",");
			translatedItems.forEach(item => 
			{
				Object.keys(item).forEach(key => 
				{
					if (!fields.includes(key)) 
					{
						delete item[key];
					}
				});
			}
			);
		}

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
	private validateKey() 
	{
		if (!this.request.query.key) 
		{
			throw new Error("No key provided");
		}
	}

}