import { ErrorWithStatus, PapiBatchResponse } from 'core-shared';
import BasePapiService from './basePapi.service';


export class RolesPapiService extends BasePapiService
{
	public override async upsertResource(body: any) 
	{
		throw new Error('Method not implemented.');
	}

	public override async batch(body: any): Promise<PapiBatchResponse>
	{
		throw new Error('Method not implemented.');
	}

	public override async getResourceByKey(key: string, fieldsString: string): Promise<any> 
	{
		try
		{
			// Since roles doesn't have a UUID in PAPI, translate the Key
			// to a where clause on Name field.
			const whereClause = `Name='${key}'`;
			return (await this.papiClient.get(`/${this.resourceName}?where=${whereClause}&fields=${fieldsString}`))[0];
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public override async getResourceByExternalId(externalId: any)
	{
		throw new Error('Method not implemented.');
	}

	/**
	 * Translates unique field queries to PAPI search body format.
	 * This function also deletes the UniqueFieldID and UniqueFieldList
	 * if there is a UniqueFieldID property on the Search body.
	 * @param {any} papiSearchBody - The PAPI search body object that contains the unique field queries.
    */
	protected override translateUniqueFieldQueriesToPapi(papiSearchBody: any): void 
	{
		let shouldDeleteUniqueFields = false;

		if (papiSearchBody.UniqueFieldID === 'InternalID') 
		{
			papiSearchBody.InternalIDList = papiSearchBody.UniqueFieldList;
			shouldDeleteUniqueFields = true;
		}

		if (papiSearchBody.UniqueFieldID === 'Name' || papiSearchBody.UniqueFieldID === 'Key') 
		{
			papiSearchBody.Where = `Name in ('${papiSearchBody.UniqueFieldList.join("\',\'")}') ${papiSearchBody.Where ?  `AND (${papiSearchBody.Where})` : '' }`;
			shouldDeleteUniqueFields = true;
		}

		if (shouldDeleteUniqueFields) 
		{
			delete papiSearchBody.UniqueFieldID;
			delete papiSearchBody.UniqueFieldList;
		}
	}
}

export default BasePapiService;
