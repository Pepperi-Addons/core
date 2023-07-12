import { DIMXObject } from '@pepperi-addons/papi-sdk';
import { BaseCoreService } from './baseCore.service';
import CatalogsGetQueryResolver from './resolvers/catalogsGetQueryResolver';
import CatalogsResourceCreationDateTimeToCreationDateResolver from './resolvers/catalogsResourceCreationDateTimeToCreationDateResolver';
import CatalogsResourceCreationDateToCreationDateTimeResolver from './resolvers/catalogsResourceCreationDateToCreationDateTimeResolver';
import CatalogsSearchBodyResolver from './resolvers/catalogsSearchBodyResolver';

export class CatalogsAndAccountsCoreService extends BaseCoreService
{
	/**
	 * Return the item with the given key
	 */
	public override async getResourceByKey(key?: string): Promise<any>
	{
		const res = await super.getResourceByKey(key);

		return (new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve([res]))[0];
	}

	/**
	 * Returns an item by the unique field
	 */
	public override async getResourceByUniqueField(field_id?: string, value?: string)
	{
		const requestedFieldId = field_id ?? this.request.query.field_id;
		const requestedValue = value ?? this.request.query.value;

		const res = await super.getResourceByUniqueField(requestedFieldId, requestedValue)
		return (new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve([res]))[0];
	}

	/**
	 * Perform a search like a GET endpoint, but given a body to overcome the URL size limitation to get list of objects.
	 * @returns a list of items that match the required parameters
	 */
	public override async search()
	{
		this.request = new CatalogsSearchBodyResolver().resolve([this.request])[0];
		const res = await super.search();
		res.Objects = new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve(res.Objects);

		return res;
	}

	/**
	 * Return a list of items
	 */
	public override async getResources() 
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
	public override async upsertResource()
	{
		this.request.body = (new CatalogsResourceCreationDateTimeToCreationDateResolver().resolve([this.request.body]))[0];
		const res = await super.upsertResource();

		return (new CatalogsResourceCreationDateToCreationDateTimeResolver().resolve([res]))[0];
	}

	/**
	 * Batch upserts a list of items
	 * @returns a list of upserted items
	 */
	public override async batch(): Promise<{DIMXObjects: DIMXObject[]}>
	{
		this.request.body.Objects = (new CatalogsResourceCreationDateTimeToCreationDateResolver().resolve(this.request.body.Objects));

		return await super.batch();
	}

	// CreationDate shouldn't be deleted, as it will be translated to CreationDateTime, which is a part of the schema.
	protected override shouldFieldBeDeleted(field: string, schemaFields: string[]): boolean
	{
		return super.shouldFieldBeDeleted(field, schemaFields) && field !== 'CreationDate'
	}
}
