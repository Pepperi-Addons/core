import { AddonDataScheme } from '@pepperi-addons/papi-sdk';
import { BaseCoreService } from './baseCore.service';
import { UNIQUE_FIELDS } from './constants';
import { SchemaManipulator } from './schemaManipulator';
import { Request } from '@pepperi-addons/debug-server';
import IPapiService from './IPapi.service';


export class UsersCoreService extends BaseCoreService
{
	constructor(schema: AddonDataScheme, request: Request, papiService: IPapiService)
	{
		super(schema, request, papiService);
		
		// Add Key and Hidden fields to the schema, so when GETting from PAPI, we will get them
		const schemaManipulator = new SchemaManipulator(this.schema);
		schemaManipulator.addStandardFields();
	}

	/**
	 * Create a new item
	 * @returns the newly created item
	 */
	public override async upsertResource()
	{
		console.log(`Core - Employees - Trying to upsert the resource...`);
		// Translate the item to PAPI format
		const papiItemRequestBody = this.translateItemToPapiItem(this.request.body);

		// Choose the appropriate papi function to call
		let papiItem;
		if(await this.doesUserExist())
		{
			console.log(`Core - Employees - User already exist. Try to update it...`);
			
			papiItem = await this.papi.updateResource(papiItemRequestBody);

			console.log(`Core - Employees - Successfully updated the user.`);

		}
		else
		{
			console.log(`Core - Employees - User does not exist. Try to create it...`);
			
			papiItem = await this.papi.createResource(papiItemRequestBody);

			console.log(`Core - Employees - Successfully created a user.`);
			
		}

		// Translate the PAPI item to an item
		const translatedItem = await this.translatePapiItemToItem(papiItem);

		return translatedItem;
	}

	/**
	 * Returns true if the user already exists, false otherwise.
	 */
	private async doesUserExist(): Promise<boolean>
	{
		console.log(`Core - Employees - Trying to decide whether this resource already exists or not...`);
		
		let res = false;

		try
		{
			console.log(`Core - Employees - Trying to get user by some unique field...`);
			
			res = !!(await this.getUser());
		}
		catch(error)
		{
			if(error instanceof Error)
			{
				console.log(`Core - Employees - Failed to get the user: ${error.message}`);
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
		console.log(`Core - Employees - Upserted resource can be identified by the passed '${field_id}' value, of '${value}'. Trying to getResourceByUniqueField...`);


		if(field_id && value)
		{
			user = await this.getResourceByUniqueField(field_id, value);
		}

		console.log(`Core - Employees - ${user ? `Found user with Key ${user.UUID}` : 'Could not find user.'}`);
		
		return user;
	}

	/**
	 * Extract a field_id and value of that field that identify the passed User in this.request.body.
	 * @returns field_id and value that identify the passed User
	 */
	private extractUniqueFieldIdAndValueFromRequest()
	{
		let field_id = '';
		let value = '';

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
