import { BaseCoreService } from "./baseCore.service";
import { UNIQUE_FIELDS } from "./constants";

export class UsersCoreService extends BaseCoreService
{
	/**
	 * Create a new item
	 * @returns the newly created item
	 */
	public override async upsertResource()
	{
		console.log(`Core - Users - Trying to upsert the resource...`);
		// Translate the item to PAPI format
		const papiItemRequestBody = this.translateItemToPapiItem(this.request.body);

		// Choose the appropriate papi function to call
		let papiItem;
		if(await this.doesUserExist())
		{
			console.log(`Core - Users - User already exist. Try to update it...`);
			
			papiItem = await this.papi.updateResource(this.schema.Name, papiItemRequestBody);

			console.log(`Core - Users - Successfully updated the user.`);

		}
		else
		{
			console.log(`Core - Users - User does not exist. Try to create it...`);
			
			papiItem = await this.papi.createResource(this.schema.Name, papiItemRequestBody);

			console.log(`Core - Users - Successfully created a user.`);
			
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
		console.log(`Core - Users - Trying to decide whether this resource already exists or not...`);
		
		let res = false;

		try
		{
			console.log(`Core - Users - Trying to get user by some unique field...`);
			
			res = !!(await this.getUser());
		}
		catch(error)
		{
			if(error instanceof Error)
			{
				console.log(`Core - Users - Failed to get the user: ${error.message}`);
			}
		}
		return res;
	}

	/**
	 * Returns a user if such exists.
	 */
	private async getUser(): Promise<any>
	{
		let user: undefined | any = undefined;
		// If the body contains any of the unique fields, try to get the User by their value.
		const { field_id, value } = this.extractUniqueFieldIdAndValueFromRequest();
		console.log(`Core - Users - Upserted resource can be identified by the passed '${field_id}' value, of '${value}'. Trying to getResourceByUniqueField...`);


		if(field_id && value)
		{
			user = await this.getResourceByUniqueField(field_id, value);
		}

		console.log(`Core - Users - ${user ? `Found user with Key ${user.UUID}` : 'Could not find user.'}`);
		
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
