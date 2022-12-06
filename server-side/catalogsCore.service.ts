import { Request } from "@pepperi-addons/debug-server";
import { DIMXObject } from "@pepperi-addons/papi-sdk";
import { BaseCoreService } from "./baseCore.service";
import { PapiBatchResponse, RESOURCE_TYPES, UNIQUE_FIELDS } from "./constants";
import IPapiService from "./IPapi.service";
import CatalogsGetQueryResolver from "./resolvers/catalogsGetQueryResolver";
import CatalogsResourceCreationDateTimeToCreationDateResolver from "./resolvers/catalogsResourceCreationDateTimeToCreationDateResolver";
import CatalogsResourceCreationDateToCreationDateTimeResolver from "./resolvers/catalogsResourceCreationDateToCreationDateTimeResolver";
import CatalogsSearchBodyResolver from "./resolvers/catalogsSearchBodyResolver";

export class CatalogsCoreService extends BaseCoreService
{
	constructor(protected resource: string, protected request: Request, protected papi: IPapiService) 
	{
		super(resource, request, papi);
	}

	/**
	 * Return the item with the given key
	 */
	public async getResourceByKey(key?: string): Promise<any>
	{
		const res = await super.getResourceByKey();

		return (new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve([res]))[0];
	}

	/**
	 * Returns an item by the unique field
	 */
	public async getResourceByUniqueField(field_id?: string, value?: string)
	{
		const requestedFieldId = field_id ?? this.request.query.field_id;
		const requestedValue = value ?? this.request.query.value;

		const res = await super.getResourceByUniqueField(requestedFieldId, requestedValue)
		return (new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve([res]));
	}

	/**
	 * Perform a search like a GET endpoint, but given a body to overcome the URL size limitation to get list of objects.
	 * @returns a list of items that match the required parameters
	 */
	public async search()
	{
		this.request = new CatalogsSearchBodyResolver().resolve([this.request])[0];
		const res = await super.search();
		res.Objects = new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve(res.Objects);

		return res;
	}

	/**
	 * Return a list of items
	 */
	public async getResources() 
	{
		this.request = (new CatalogsGetQueryResolver().resolve([this.request]))[0];
		let res = await super.getResources();

		res = (new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve(res));
		return res;
	}
	/**
	 * Upserts a resource
	 * @returns the updated resource
	 */
	public async upsertResource()
	{
		this.request.body = (new CatalogsResourceCreationDateTimeToCreationDateResolver().resolve([this.request.body]))[0];
		const res = await super.upsertResource();

		return (new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve([res]))[0];
	}

	/**
	 * Batch upserts a list of items
	 * @returns a list of upserted items
	 */
	public async batch(): Promise<{DIMXObjects: DIMXObject[]}>
	{
		this.request.body.Objects = (new CatalogsResourceCreationDateTimeToCreationDateResolver().resolve(this.request.body.Objects));

		return await super.batch();
	}
}
