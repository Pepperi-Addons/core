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

		this.translateUniqueFieldQueriesToPapi(body);

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

	private translateUniqueFieldQueriesToPapi(papiSearchBody: any) 
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