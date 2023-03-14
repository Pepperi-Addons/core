import { IPapiService } from 'core-shared';
import { IClientApiService } from './iClientApiService';
import BaseCpiSideApiService from './baseCpiSideApiService';


export default class AccountsCpiSideApiService extends BaseCpiSideApiService implements IPapiService
{
	protected filterFieldsToMatchCpi(schemaFields: string[]): string[]
	{
		schemaFields = super.filterFieldsToMatchCpi(schemaFields);
		
		// CreationDateTime is synced as CreationDate for accounts
		return schemaFields.map(field => field === 'CreationDateTime' ? 'CreationDate' : field);
	}
}
