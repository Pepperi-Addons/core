import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk';
import { ErrorWithStatus, Helper, IPapiService, PapiBatchResponse, ResourceFields, SearchResult } from 'core-shared';


export class BasePapiService implements IPapiService
{
	constructor(protected resourceName: string, protected papiClient: PapiClient) 
	{}

	public async getResourceFields(): Promise<ResourceFields> 
	{
		const url = `/meta_data/${this.resourceName}/fields?include_owned=true&include_internal=false`;
		try
		{
			return await this.papiClient.get(url);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}

	}

	public async createResource(body: any)
	{
		return await this.upsertResource(body);
	}

	public async updateResource(body: any)
	{
		return await this.upsertResource(body);
	}

	public async upsertResource(body: any) 
	{
		try
		{
			return await this.papiClient.post(`/${this.resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async batch(body: any): Promise<PapiBatchResponse>
	{
		try
		{
			return await this.papiClient.post(`/batch/${this.resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async getResources(query: any)
	{
		let url = `/${this.resourceName}`;
		const encodedQuery = Helper.encodeQueryParams(query);
		url = `${url}?${encodedQuery}`;
		try
		{
			return await this.papiClient.get(url);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async getResourceByKey(key: string): Promise<any> 
	{
		try
		{
			return await this.papiClient.get(`/${this.resourceName}/UUID/${key}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async getResourceByExternalId(externalId: any)
	{
		try
		{
			return await this.papiClient.get(`/${this.resourceName}/ExternalId/${externalId}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async getResourceByInternalId(internalId: any)
	{
		try
		{
			return await this.papiClient.get(`/${this.resourceName}/${internalId}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async searchResource(body: any): Promise<SearchResult>
	{
		const res: SearchResult = {Objects:[]};

		this.handleUniqueFieldsQuery(body);

		try
		{
			const papiRes = await this.papiClient.apiCall('POST', `/${this.resourceName}/search`, body);
			res.Objects = await papiRes.json();

			if(body.IncludeCount)
			{
				res.Count = parseInt(papiRes.headers.get('x-pepperi-total-records'))
			}
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}

		return res;
	}

	protected handleUniqueFieldsQuery(papiSearchBody: any): void
	{
		// Set PageSize to support UniqueFieldLists with more than 100 objects
		// For more information see: https://pepperi.atlassian.net/browse/DI-22607
		this.setPageSizeToMatchUniqueFieldListSize(papiSearchBody);

		// Translate UniqueField queries to supported PAPI interface.
		this.translateUniqueFieldQueriesToPapi(papiSearchBody);
	}

	/**
	 * Sets the PageSize property of the papiSearchBody object to match the size of its UniqueFieldList.
	 * If UniqueFieldList is present and PageSize is not set, the function sets PageSize to the length of UniqueFieldList.
	 * @param papiSearchBody The object containing the UniqueFieldList and PageSize properties
    */
	private setPageSizeToMatchUniqueFieldListSize(papiSearchBody: any): void 
	{
		if(papiSearchBody.UniqueFieldList && !papiSearchBody.PageSize)
		{
			papiSearchBody.PageSize = papiSearchBody.UniqueFieldList.length;
		}
	}

	/**
	 * Translates unique field queries to PAPI search body format.
	 * This function also deletes the UniqueFieldID and UniqueFieldList
	 * if there is a UniqueFieldID property on the Search body.
	 * @param {any} papiSearchBody - The PAPI search body object that contains the unique field queries.
    */
	protected translateUniqueFieldQueriesToPapi(papiSearchBody: any): void 
	{
		let shouldDeleteUniqueFields = false;
		if (papiSearchBody.UniqueFieldID === 'ExternalID') 
		{
			papiSearchBody.Where = `ExternalID in ('${papiSearchBody.UniqueFieldList.join("\',\'")}') ${papiSearchBody.Where ?  `AND (${papiSearchBody.Where})` : '' }`;
			shouldDeleteUniqueFields = true;
		}

		if (papiSearchBody.UniqueFieldID === 'InternalID') 
		{
			papiSearchBody.InternalIDList = papiSearchBody.UniqueFieldList;
			shouldDeleteUniqueFields = true;
		}

		if (papiSearchBody.UniqueFieldID === 'UUID' || papiSearchBody.UniqueFieldID === 'Key') 
		{
			papiSearchBody.UUIDList = papiSearchBody.UniqueFieldList;
			shouldDeleteUniqueFields = true;
		}

		if (shouldDeleteUniqueFields) 
		{
			delete papiSearchBody.UniqueFieldID;
			delete papiSearchBody.UniqueFieldList;
		}
		
	}

	public async getResourceSchema(): Promise<AddonDataScheme> 
	{
		return await this.papiClient.get(`/addons/data/schemes/${this.resourceName}`);
	}
}

export default BasePapiService;
