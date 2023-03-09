import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk';
import { ErrorWithStatus, Helper, IPapiService, PapiBatchResponse, ResourceFields, SearchResult } from 'core-shared';


export class BasePapiService implements IPapiService
{
	constructor(protected papiClient: PapiClient) 
	{}

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		const url = `/meta_data/${resourceName}/fields?include_owned=true&include_internal=false`;
		try
		{
			return await this.papiClient.get(url);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}

	}

	async createResource(resourceName: string, body: any)
	{
		return await this.upsertResource(resourceName, body);
	}

	async updateResource(resourceName: string, body: any)
	{
		return await this.upsertResource(resourceName, body);
	}

	async upsertResource(resourceName: string, body: any) 
	{
		try
		{
			return await this.papiClient.post(`/${resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async batch(resourceName: string, body: any): Promise<PapiBatchResponse>
	{
		try
		{
			return await this.papiClient.post(`/batch/${resourceName}`, body);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async getResources(resourceName: string, query: any)
	{
		let url = `/${resourceName}`;
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

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		try
		{
			return await this.papiClient.get(`/${resourceName}/UUID/${key}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async getResourceByExternalId(resourceName: string, externalId: any)
	{
		try
		{
			return await this.papiClient.get(`/${resourceName}/ExternalId/${externalId}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async getResourceByInternalId(resourceName: string, internalId: any)
	{
		try
		{
			return await this.papiClient.get(`/${resourceName}/${internalId}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	async searchResource(resourceName: string, body: any): Promise<SearchResult>
	{
		const res: SearchResult = {Objects:[]};

		this.handleUniqueFieldsQuery(body);

		try
		{
			const papiRes = await this.papiClient.apiCall("POST", `/${resourceName}/search`, body);
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

	handleUniqueFieldsQuery(papiSearchBody: any): void
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
	private translateUniqueFieldQueriesToPapi(papiSearchBody: any): void 
	{
		let shouldDeleteUniqueFields = false;
		if (papiSearchBody.UniqueFieldID === "ExternalID") 
		{
			papiSearchBody.Where = `ExternalID in ('${papiSearchBody.UniqueFieldList.join("\',\'")}') ${papiSearchBody.where ?  `AND (${papiSearchBody.where})` : '' }`;
			shouldDeleteUniqueFields = true;
		}

		if (papiSearchBody.UniqueFieldID === "InternalID") 
		{
			papiSearchBody.InternalIDList = papiSearchBody.UniqueFieldList;
			shouldDeleteUniqueFields = true;
		}

		if (papiSearchBody.UniqueFieldID === "UUID" || papiSearchBody.UniqueFieldID === "Key") 
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

	async getResourceSchema(resourceName: string): Promise<AddonDataScheme> 
	{
		return await this.papiClient.get(`/addons/data/schemes/${resourceName}`);
	}
}

export default BasePapiService;
