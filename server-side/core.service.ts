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

	protected translatePapiItemToItem(papiItem: any)
	{
		const resItem = {...papiItem};
		resItem.Key = resItem.UUID;

		return resItem;
	}

	/**
	 * Throws an error if no key is provided
	 */
	private validateKey()
	{
		if(!this.request.query.key)
		{
			throw new Error("No key provided");
		}
	}

}