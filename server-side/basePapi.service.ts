import { AddonDataScheme, FindOptions, PapiClient } from '@pepperi-addons/papi-sdk';
import { ErrorWithStatus, Helper, IPapiService, PapiBatchResponse, ResourceFields, SearchResult } from 'core-shared';


export class BasePapiService implements IPapiService
{
	protected cachedSchemaMap: {[key: string]: AddonDataScheme} = {};

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

	// getResourceByKey(key: string, fieldsString: string): Promise<any>;
    // getResourceByExternalId(externalId: any, fieldsString: string): Promise<any>;
    // getResourceByInternalId(internalId: any, fieldsString: string): Promise<any>;

	public async getResourceByKey(key: string, fieldsString: string): Promise<any> 
	{
		try
		{
			return await this.papiClient.get(`/${this.resourceName}/UUID/${key}?fields=${fieldsString}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async getResourceByExternalId(externalId: any, fieldsString: string)
	{
		try
		{
			return await this.papiClient.get(`/${this.resourceName}/ExternalId/${externalId}?fields=${fieldsString}`);
		}
		catch(error)
		{
			throw new ErrorWithStatus(error)
		}
	}

	public async getResourceByInternalId(internalId: any, fieldsString: string)
	{
		try
		{
			return await this.papiClient.get(`/${this.resourceName}/${internalId}?fields=${fieldsString}`);
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
		let shouldDeleteUniqueFieldsProperties = false;
		if (papiSearchBody.UniqueFieldID === 'ExternalID') 
		{
			papiSearchBody.ExternalIDList = papiSearchBody.UniqueFieldList;
			shouldDeleteUniqueFieldsProperties = true;
		}

		if (papiSearchBody.UniqueFieldID === 'InternalID') 
		{
			papiSearchBody.InternalIDList = papiSearchBody.UniqueFieldList;
			shouldDeleteUniqueFieldsProperties = true;
		}

		if (papiSearchBody.UniqueFieldID === 'UUID' || papiSearchBody.UniqueFieldID === 'Key') 
		{
			papiSearchBody.UUIDList = papiSearchBody.UniqueFieldList;
			shouldDeleteUniqueFieldsProperties = true;
		}

		if (shouldDeleteUniqueFieldsProperties) 
		{
			delete papiSearchBody.UniqueFieldID;
			delete papiSearchBody.UniqueFieldList;
		}
		
	}

	public async getResourceSchema(resourceName: string = this.resourceName): Promise<AddonDataScheme> 
	{
		if(!this.cachedSchemaMap.hasOwnProperty(resourceName))
		{
			// Use GET so we don't have to use a papiClient with owner ID.
			const findOptions: FindOptions = {
				where: `Name='${resourceName}'`
			};

			const resArray =  await this.papiClient.addons.data.schemes.get(findOptions);

			if(resArray.length === 0)
			{
				const errorMessage = `failed with status: 404 - Resource ${resourceName} not found`;
				console.error(errorMessage);

				const error = new Error(errorMessage);
				throw new ErrorWithStatus(error);

			}

			this.cachedSchemaMap[resourceName] = resArray[0];
		}
		
		return this.cachedSchemaMap[resourceName];
	}
}

export default BasePapiService;
