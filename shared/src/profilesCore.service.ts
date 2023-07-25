import { FindOptions } from '@pepperi-addons/papi-sdk';
import { BaseCoreService } from './baseCore.service';
import { ErrorWithStatus } from './errorWithStatus';

export class ProfilesCoreService extends BaseCoreService
{
	protected override async handleGetResourceByInternalID(requestedValue: any)
	{
		const findOptions: FindOptions = {
			where: `InternalID=${requestedValue}`
		};

		const papiItems = await this.papi.getResources(findOptions);

		this.validateGetBeInternalIDResult(papiItems);

		const translatedItem = this.translatePapiItemToItem(papiItems[0]);

		return translatedItem;
	}

	protected validateGetBeInternalIDResult(papiItems: any[])
	{
		if(papiItems.length === 0)
		{
			const error = new Error('failed with status: 404 - Could not find the request InternalID');
			console.error(error.message);
			throw new ErrorWithStatus(error);
		}
		else if(papiItems.length > 1)
		{
			// Shouldn't happen...
			const error = new Error('failed with status: 500 - Found more than one profile with given InternalID.');
			console.error(error.message);
			throw new ErrorWithStatus(error);
		}
	}
}
