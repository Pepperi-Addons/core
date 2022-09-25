import { Request } from "@pepperi-addons/debug-server";
import { BaseCoreService } from "./baseCore.service";
import { UNIQUE_FIELDS } from "./constants";
import IPapiService from "./IPapi.service";

export class UsersCoreService extends BaseCoreService
{
	constructor(protected resource: string, protected request: Request, protected papi: IPapiService) 
	{
		super(resource, request, papi);
	}

	/**
	 * Create a new item
	 * @returns the newly created item
	 */
	public async upsertResource()
	{
		
		// Translate the item to PAPI format
		const papiItemRequestBody = this.translateItemToPapiItem(this.request.body);

		// Choose the appropriate papi function to call
		// const papiFunction = await this.doesUserExist() ? this.papi.updateResource : this.papi.createResource;
		let papiItem;
		if(await this.doesUserExist())
		{
			papiItem = await this.papi.updateResource(this.resource, papiItemRequestBody);
		}
		else
		{
			papiItem = await this.papi.createResource(this.resource, papiItemRequestBody);
		}

		// Create the PAPI item
		// const papiItem = await papiFunction(this.resource, papiItemRequestBody);

		// Translate the PAPI item to an item
		const translatedItem = this.translatePapiItemToItem(papiItem);

		return translatedItem;
	}

	/**
	 * Returns true if the user already exists, false otherwise.
	 */
	private async doesUserExist(): Promise<boolean>
	{
		let res = false;

		try
		{
			res = !!(await this.getUser());
		}
		catch(error)
		{
			// Do nothing...
		}

		return res;
	}

	/**
	 * Returns a user if such exists.
	 */
	private async getUser(): Promise<any>
	{
		let user = undefined;
		// If the body contains any of the unique fields, try to get the User by their value.
		const { field_id, value } = this.extractUniqueFieldIdAndValueFromRequest();

		if(field_id && value)
		{
			user = await this.getResourceByUniqueField(field_id, value);
		}
		
		return user;
	}

	/**
	 * Extract a field_id and value of that field that identify the passed User in this.request.body.
	 * @returns field_id and value that identify the passed User
	 */
	private extractUniqueFieldIdAndValueFromRequest()
	{
		let field_id = "";
		let value = "";

		for (const uniqueField of UNIQUE_FIELDS) 
		{
			if (this.request.body[uniqueField]) 
			{
				field_id = uniqueField;
				value = this.request.body[uniqueField];

				break;
			}
		}

		return { field_id, value };
	}
}