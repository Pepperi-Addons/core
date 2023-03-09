import { IPapiService } from 'core-shared';
import BaseCpiSideApiService from './baseCpiSideApiService';


export default class NoCreationDateCpiSideApiService extends BaseCpiSideApiService implements IPapiService
{
	protected filterFieldsToMatchCpi(schemaFields: string[]): string[]
	{
		schemaFields = super.filterFieldsToMatchCpi(schemaFields);
		
		// CreationDate isn't synced for catalogs and users resources
		return schemaFields.filter(field => field !== 'CreationDate' && field !== 'CreationDateTime');
	}
}
