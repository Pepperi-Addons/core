import { Request } from '@pepperi-addons/debug-server';
import { DIMXObject, AddonDataScheme } from '@pepperi-addons/papi-sdk';
import { FieldType, JSONBaseFilter, JSONFilter, parse, transform, toApiQueryString } from '@pepperi-addons/pepperi-filters';
import { NodeTransformer } from '@pepperi-addons/pepperi-filters/build/json-filter-transformer';

import { getDefaultSchemaFields, getPapiKeyPropertyName, PapiBatchResponse, RESOURCE_TYPES, SearchResult, UNIQUE_FIELDS } from './constants';
import IPapiService from './IPapi.service';
import { ReferenceTranslationManager } from './referenceTranslators/referenceTranslationExecutioner';
import { SchemaFieldsGetterService } from './schemaFieldsGetter.service';

export class BaseCoreService 
{
	protected schemaFieldsGetterService: SchemaFieldsGetterService;

	protected get uniqueFields(): string[]
	{
		return UNIQUE_FIELDS;
	}

	protected get papiKeyPropertyName(): string
	{
		return getPapiKeyPropertyName(this.schema.Name);
	}

	constructor(protected schema: AddonDataScheme, protected request: Request, protected papi: IPapiService) 
	{
		this.validateResource();
		this.schemaFieldsGetterService = new SchemaFieldsGetterService(this.papi);
	}

	/**
	 * Throws an error if the requested resource is not supported
	 */
	protected validateResource() 
	{
		if(this.schema.Name in RESOURCE_TYPES)
		// if (!RESOURCE_TYPES.includes(this.schema.Name)) 
		{
			const errorMessage = `The resource name is not valid. Please provide a valid resource name.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	/**
	 * Return the item with the given key
	 */
	public async getResourceByKey(key?: string): Promise<any>
	{
		const requestedKey = key ?? this.request.query.key;

		this.validateKey(requestedKey);
		const translatedFields = await this.translateFieldsToPapi();
		const papiItem = await this.papi.getResourceByKey(requestedKey, translatedFields.join(','));
		const translatedItem = await this.translatePapiItemToItem(papiItem);
		this.deleteUnwantedFieldsFromItems(translatedItem, this.getSchemasFields());

		return translatedItem;
	}

	/**
	 * Returns an item by the unique field
	 */
	public async getResourceByUniqueField(field_id?: string, value?: string)
	{
		const requestedFieldId = field_id ?? this.request.query.field_id;
		const requestedValue = value ?? this.request.query.value;

		//validate field_id and value query parameters are present
		this.validateUniqueKeyPrerequisites(requestedFieldId, requestedValue);

		let translatedItem: any;

		switch(requestedFieldId)
		{
		case 'UUID':
		case 'Key':
		{
			translatedItem = await this.getResourceByKey(requestedValue);
			break;
		}
		case 'InternalID':
		{
			translatedItem = await this.handleGetResourceByInternalID(requestedValue);
			break;
		}
		case 'ExternalID':
		{
			const translatedFields = await this.translateFieldsToPapi();
			const papiItem = await this.papi.getResourceByExternalId(requestedValue, translatedFields.join(','));
			translatedItem = await this.translatePapiItemToItem(papiItem);
			break;
		}
		default:
		{
			// Something weird happened, since the field_id is not one of the above
			// and it is validated in the validateUniqueKeyPrerequisites function...
			const errorMessage = `The field_id is not valid. Please provide a valid field_id.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
		}
		
		this.deleteUnwantedFieldsFromItems(translatedItem, this.getSchemasFields());
		return translatedItem;

	}

	protected async handleGetResourceByInternalID(requestedValue: any) 
	{
		const translatedFields = await this.translateFieldsToPapi();
		
		const papiItem = await this.papi.getResourceByInternalId(requestedValue, translatedFields.join(','));
		const translatedItem = await this.translatePapiItemToItem(papiItem);

		return translatedItem;
	}

	/**
	 * Throws an exception if field_id and value query parameters are not present
	 */
	protected validateUniqueKeyPrerequisites(requestedFieldId: string, requestedValue: string)
	{
		if (!(requestedFieldId && requestedValue))
		{
			throw new Error(`Missing the required field_id and value query parameters.`);
		}

		if(!this.uniqueFields.includes(requestedFieldId))
		{
			throw new Error(`The field_id query parameter is not valid. Supported field_ids are: ${this.uniqueFields.join(', ')}`);
		}
	}

	/**
	 * Perform a search like a GET endpoint, but given a body to overcome the URL size limitation to get list of objects.
	 * @returns a list of items that match the required parameters
	 */
	public async search()
	{
		this.validateSearchPrerequisites();
		// Create a papi Search body
		const papiSearchBody = await this.translateBodyToPapiSearchBody();

		const res: SearchResult = await this.papi.searchResource(papiSearchBody);
		
		res.Objects = await this.translatePapiItemToItem(res.Objects);

		// if Fields are requested, drop any other fields
		// PAPI handles this for us, but this should be done
		// for any fields that were added during the translation.
		this.deleteUnwantedFieldsFromItems(res.Objects, this.request.body.Fields);

		return res;
	}

	/**
	 * Given a list of wanted fields and a list of items, deletes unwanted fields from the items.
	 * @param items the items from which to delete the unwanted fields.
	 * @param fieldsArray an array of string representing the wanted fields.
	 */
	private deleteUnwantedFieldsFromItems(items: any, fieldsArray: Array<string> | string) 
	{
		if (fieldsArray) 
		{
			fieldsArray = Array.isArray(fieldsArray) ? fieldsArray : fieldsArray.split(',');
			items = Array.isArray(items) ? items : [items];
			items.forEach(item => 
			{
				Object.keys(item).forEach(key => 
				{
					if (!fieldsArray.includes(key)) 
					{
						delete item[key];
					}
				});
			}
			);
		}
	}

	/**
	 * Throws an exception if the search body is not valid
	 */
	protected validateSearchPrerequisites()
	{
		if(this.request.body.UniqueFieldID && !this.uniqueFields.includes(this.request.body.UniqueFieldID))
		{
			const errorMessage = `The passed UniqueFieldID is not supported: '${this.request.body.UniqueFieldID}'. Supported UniqueFieldID values are: ${JSON.stringify(this.uniqueFields)}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		if(this.request.body.KeyList && (this.request.body.UniqueFieldID || this.request.body.UniqueFieldList))
		{
			const errorMessage = `Sending both KeyList and UniqueFieldList is not supported.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		if(this.request.body.UniqueFieldList && !this.request.body.UniqueFieldID)
		{
			const errorMessage = `Missing UniqueFieldID parameter.`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	/**
	 * Returns a papi compliant search body
	 */
	private async translateBodyToPapiSearchBody()
	{
		const papiSearchBody: any = {};
		
		await this.translatePapiSupportedSearchFields(papiSearchBody);

		papiSearchBody.Where = await this.translateWhereClauseKeyToUUID(papiSearchBody.Where);

		// If the query passed a page_size=-1, remove it.
		// Resources with a lot of objects might time out otherwise.
		// For more information see: https://pepperi.atlassian.net/browse/DI-21943
		if(papiSearchBody.PageSize === -1)
		{
			delete papiSearchBody.PageSize;
		}

		// If not IncludeDeleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// In order for Nebula (which works via ADAL directly with Core) to work
		// as intended and get the filtered account_users, it was decided that the
		// filtering will be done in Core for all resources, since it should have
		// no real impact.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		papiSearchBody.Where = this.filterHiddenObjects(papiSearchBody.Where, papiSearchBody.IncludeDeleted);

		return papiSearchBody;
	}

	/**
	 * Filters out hidden objects from the search query.
	 * 
	 * @param {string} where - The search query.
	 * @param {boolean} includeDeleted - Whether to include deleted objects.
	 * @returns {string} The filtered search query.
	 */
	protected filterHiddenObjects(where: string | undefined, includeDeleted: boolean): string | undefined
	{
		const res = includeDeleted ? where : `Hidden=0${where ? ` AND (${where})` : ''}`;

		return res;
	}

	protected async translatePapiSupportedSearchFields(papiSearchBody: any) 
	{
		// populate papiSearchBody with the properties on the request's body, keeping any existing properties on the papiSearchBody.
		Object.keys(this.request.body).map(key => papiSearchBody[key] = this.request.body[key]);
		// Key isn't supported by PAPI natively. We have to use UUID instead.
		if (papiSearchBody.KeyList) 
		{
			papiSearchBody.UUIDList = papiSearchBody.KeyList;
			delete papiSearchBody.KeyList;
		}

		if(papiSearchBody.UniqueFieldID === 'Key')
		{
			papiSearchBody.UniqueFieldID = this.papiKeyPropertyName;
		}

		const fieldsToTranslate: string[] = papiSearchBody.Fields ?? this.getSchemasFields().split(',');
		const translatedFields = await this.translateFieldsToPapi(fieldsToTranslate);
		papiSearchBody.Fields = translatedFields;

		// Fields are passed as an array of strings, while PAPI supports a string that is separated by commas.
		papiSearchBody.Fields = papiSearchBody.Fields.join(',');
	}

	private async translateFieldsToPapi(fieldsToTranslate?: string[])
	{
		fieldsToTranslate = fieldsToTranslate ?? this.getSchemasFields().split(',');
		const schemaFieldsResult = await this.schemaFieldsGetterService.getSchemaFields(this.schema);
		const translatedFields = fieldsToTranslate.map(field => schemaFieldsResult[field] ? schemaFieldsResult[field].TranslatedFieldName : field);

		return translatedFields;
	}

	/**
	 * 
	 * @returns {string} A string of all the fields in the schema, separated by commas.
	 * 
	 * @example
	 * // returns 'Name,Key,Hidden,CustomField1,CustomField2'
	 * this.getSchemasFields();
	 * 
	 */
	protected getSchemasFields(): string
	{
		const schemaFields = Object.keys(this.schema.Fields!);
		const defaultSchemaFields = Object.keys(getDefaultSchemaFields());
		// Add default fields to the fields array
		const fieldsArray = [...schemaFields, ...defaultSchemaFields];
		return fieldsArray.join(',');
	}

	/**
	 * Return a list of items
	 */
	public async getResources() 
	{
		// Pass a query without resource_name
		const queryCopy = { ...this.request.query };
		delete queryCopy.resource_name;

		// Set the fields to be returned by PAPI
		// For more information see: https://pepperi.atlassian.net/browse/DI-23169

		const fieldsToTranslate = (queryCopy.fields ? queryCopy.fields : this.getSchemasFields()).split(',');
		const schemaFieldsResult = await this.schemaFieldsGetterService.getSchemaFields(this.schema);

		queryCopy.fields = fieldsToTranslate.map(field => schemaFieldsResult[field] ? schemaFieldsResult[field].TranslatedFieldName : field);

		// pass the fields as a string, separated by commas
		queryCopy.fields = queryCopy.fields.join(',');

		queryCopy.where = await this.translateWhereClauseKeyToUUID(queryCopy.where);

		// If the query passed a page_size=-1, remove it.
		// Resources with a lot of objects might time out otherwise.
		// For more information see: https://pepperi.atlassian.net/browse/DI-21943
		if(queryCopy.page_size === '-1')
		{
			delete queryCopy.page_size;
		}

		// If not include_deleted=true, add 'Hidden=0' to where clause.
		// Otherwise PAPI returns NULL values for hidden account_users.
		// In order for Nebula (which works via ADAL directly with Core) to work
		// as intended and get the filtered account_users, it was decided that the
		// filtering will be done in Core for all resources, since it should have
		// no real impact.
		// For more information see: https://pepperi.atlassian.net/browse/DI-22222
		queryCopy.where = this.filterHiddenObjects(queryCopy.where, this.request.query.include_deleted);

		const papiItems = await this.papi.getResources(queryCopy);

		const translatedItems = await this.translatePapiItemToItem(papiItems);

		// if Fields are requested, drop any other fields
		// PAPI handles this for us, but this should be done
		// for any fields that were added during the translation.
		this.deleteUnwantedFieldsFromItems(translatedItems, this.request.query.fields)

		return translatedItems;
	}

	
	/**
	 * Translate each reference to Key in the where clause to UUID
	 * @param whereClause
	 * @returns
	 * 
	 */ 
	private async translateWhereClauseKeyToUUID(whereClause: string | undefined): Promise<string | undefined>
	{
		let newWhereClause: string | undefined = undefined;
		
		if(whereClause)
		{
			// Create the JSON filter from the SQL where clause
			const schemaFields = await this.schemaFieldsGetterService.getSchemaFields(this.schema);
			// create a [key: string]: FieldType object from the schema fields
			const schemaFieldsObject = Object.keys(schemaFields).reduce((acc, curr) => 
			{
				acc[curr] = schemaFields[curr].FieldType;
				return acc;
			}, {} as {[key: string]: FieldType});


			const jsonFilter: JSONFilter = parse(whereClause, schemaFieldsObject)!;

			const nodeTransformers: {[key: string]: NodeTransformer} = Object.keys(schemaFields).reduce((acc, curr) => 
			{
				acc[curr] = (node: JSONBaseFilter) => 
				{
					node.ApiName = schemaFields[curr]?.TranslatedFieldName ?? node.ApiName;
				}
				return acc;
			}, {} as {[key: string]: NodeTransformer});

			// Replace all Key fields with this.papiKeyPropertyName fields
			const transformedJsonFilter = transform(jsonFilter, nodeTransformers);

			// Transform the JSON filter back to SQL where clause
			newWhereClause = toApiQueryString(transformedJsonFilter);
		}

		// Return the new where clause
		return newWhereClause;

	}

	/**
	 * Upserts a resource
	 * @returns the updated resource
	 */
	public async upsertResource()
	{
		// Translate the item to PAPI format
		const papiItemRequestBody = this.translateItemToPapiItem(this.request.body);
		const fields = await this.getPapiTranslatedSchemaFields();
		// Create the PAPI item
		const papiItem = await this.papi.upsertResource(papiItemRequestBody, fields);
		// Translate the PAPI item to an item
		const translatedItem = await this.translatePapiItemToItem(papiItem);

		return translatedItem;
	}

	protected async getPapiTranslatedSchemaFields(): Promise<string>
	{
		const fieldsToTranslate = this.getSchemasFields().split(',');
		const schemaFieldsResult = await this.schemaFieldsGetterService.getSchemaFields(this.schema);

		const fields = fieldsToTranslate.map(field => schemaFieldsResult[field] ? schemaFieldsResult[field].TranslatedFieldName : field);
		return fields.join(',');
	}

	/**
	 * Batch upserts a list of items
	 * @returns a list of upserted items
	 */
	public async batch(): Promise<{DIMXObjects: DIMXObject[]}>
	{
		this.validateBatchPrerequisites();

		const batchObjects = [...this.request.body.Objects];
		// Translate the items to PAPI format
		const papiItems = batchObjects.map(batchObject => this.translateItemToPapiItem(batchObject));
		const papiBatchResult: PapiBatchResponse = await this.papi.batch(papiItems);
		// PAPI batch objects are returned with empty UUIDs. We have to get the
		// actual UUIDs from PAPI and replace the empty UUIDs with the actual UUIDs.
		await this.fillPapiBatchResultWithUUIDs(papiBatchResult);

		// To comply with DIMX Batch operations, we have to return DIMXObjects
		const batchDimxObjects = this.translatePapiBatchResponseToDimxObjects(papiBatchResult)

		return batchDimxObjects;
	}

	/**
	 * Throws an error in case the body is missing an Objects array, or if a OverwriteObject=true is passed.
	 */
	protected validateBatchPrerequisites()
	{
		let errorMessage = '';
		if(!(this.request.body?.Objects && Array.isArray(this.request.body?.Objects)))
		{
			errorMessage = 'Missing an Objects array';
		}

		if(this.request.body.OverwriteObject)
		{
			errorMessage = 'OverwriteObject parameter is not supported.'
		}

		if(errorMessage)
		{
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	/**
	 * Create an Array of DIMXObject based on a PapiBatchResponse
	 * @param papiBatchResult The papiBatchResult from which to create DIMXObjects
	 * @returns an Array of DIMXObject based on a PapiBatchResponse
	 */
	protected translatePapiBatchResponseToDimxObjects(papiBatchResult: PapiBatchResponse): {DIMXObjects: Array<DIMXObject>}
	{
		const res: {DIMXObjects: DIMXObject[]} = {DIMXObjects: []};
		res.DIMXObjects = papiBatchResult.map(papiItem => 
		{
			return {
				Key: papiItem.UUID!,
				Status: papiItem.Status,
				...(papiItem.Status === 'Error' && {Details: papiItem.Message})
			}
		});

		return res;
	}

	/**
	 * PAPI batch objects are returned with empty UUIDs. We have to set the
	 * actual UUIDs based on the original batch request - DIMX validates that each item has a Key.
	 * @param papiBatchResult the PapiBatchResponse object on which to add UUIDs
	 */
	protected async fillPapiBatchResultWithUUIDs(papiBatchResult: PapiBatchResponse)
	{
		const batchObjects = [...this.request.body.Objects];
		const batchObjectKeys = batchObjects.map(batchObject => batchObject.Key);

		papiBatchResult.forEach((papiItem, index) => 
		{
			papiItem[this.papiKeyPropertyName] = batchObjectKeys[index];
		});
	}

	/**
	 * Translate the item to PAPI format
	 * @param item the item to translate
	 */
	protected translateItemToPapiItem(item: any | any[]) 
	{
		const isArray = Array.isArray(item);
		const items = isArray ? item : [item];
		// Add a UUID property equal to Key.
		let resItems = this.AddUUIDPropertyEqualToKey(items);

		// Translate ADAL references to PAPI references.
		resItems = this.translateAdalReferencesToPapiReferences(resItems);

		return isArray ? resItems : resItems[0];
	}

	private AddUUIDPropertyEqualToKey(items: any[])
	{
		// Copy items so changes won't effect the original input objects
		const resItems = items.map(element => 
		{
			return {...element}
		});

		for(const resItem of resItems)
		{
			// If item has both UUID and Key fields, make sure they are equivalent
			if (resItem[this.papiKeyPropertyName] && resItem.Key && resItems[this.papiKeyPropertyName] !== resItem.Key) 
			{
				throw new Error(`The ${this.papiKeyPropertyName} and Key fields are not equivalent.`);
			}

			// If item has a Key field, set the UUID field to the same value and delete the Key field
			if (resItem.Key) 
			{
				resItems[this.papiKeyPropertyName] = resItem.Key;
				delete resItem.Key;
			}
		}
		
		return resItems;
	}

	private translateAdalReferencesToPapiReferences(adalItems: any[]): any[]
	{

		const referenceTranslationManager = new ReferenceTranslationManager(this.schema);
		const resItem = referenceTranslationManager.adalToPapi(adalItems);

		return resItem;
	}

	/**
	 * Translates a given Papi item to a resource item
	 * @param papiItem the papi item to translate
	 * @returns a resource item
	 */
	protected async translatePapiItemToItem(papiItem: any | any[], fields?: string[]) 
	{
		fields = fields ?? this.getSchemasFields().split(',');

		const isArray = Array.isArray(papiItem);
		const papiItems = isArray ? papiItem : [papiItem];

		// Add Key property, equal to UUID.
		let resItems = await this.translateKeyProperty(papiItems);

		// Translate PAPI references to ADAL references.
		resItems = await this.translatePapiReferencesToAdalReferences(resItems, fields);

		// Add ms to DateTime fields. 
		// For more information see: https://pepperi.atlassian.net/browse/DI-23237
		// As the function relies on the original schema field names, it must be called
		// after the call to translatePapiReferencesToAdalReferences.
		resItems = await this.addMsToDateTimeFields(resItems);

		return isArray ? resItems : resItems[0];
	}

	/**
	 * Add Key property, equal to papiKeyPropertyName.
	 * @param papiItem 
	 * @returns 
	 */
	private translateKeyProperty(papiItems: any[]): any[]
	{
		const resItems = papiItems.map(papiItem => 
		{
			return {...papiItem};
		});
		const requestedFields: string[] = this.request.body?.Fields ?? (this.request.query.fields ? this.request.query.fields.split(',') : []);

		resItems.map(papiItem => 
		{
			if(Object.keys(papiItem).includes(this.papiKeyPropertyName))
			{
				const keyValue = papiItem[this.papiKeyPropertyName];
				papiItem.Key = keyValue ? keyValue.toString() : '';

				if(!requestedFields.includes(this.papiKeyPropertyName))
				{
					delete papiItem[this.papiKeyPropertyName];
				}
			}
		});

		return resItems;
	}

	/**
	 * Add milliseconds to DateTime fields on the PAPI item.
	 */
	private async addMsToDateTimeFields(papiItems: any[]): Promise<any[]>
	{
		const resItems = this.shallowCopyObjects(papiItems);

		if(resItems.length > 0)
		{
			// Arbitrarily work on the fields of the first item.
			// Since all items belong to the same resource, they have the same fields

			const resItemFields = Object.keys(resItems[0]);

			// Keep fields that are part of the schema, and are of type DateTime
			const schemaFields = await this.schemaFieldsGetterService.getSchemaFields(this.schema);
			const dateTimeFields = resItemFields.filter(field => schemaFields[field]?.FieldType === 'DateTime');

			// Set a new Date on the resItem
			dateTimeFields.map(dateTimeField => resItems.map(resItem => 
			{
				//The date might be null, in that case we don't need to create a new date.
				if(resItem[dateTimeField])
				{
					resItem[dateTimeField] = new Date(resItem[dateTimeField]).toISOString();
				}
			}));
		}
		
		return resItems;
	}

	private shallowCopyObjects(objects: any[]) 
	{
		return objects.map(object => 
		{
			return { ...object };
		});
	}


	private async translatePapiReferencesToAdalReferences(papiItems: any[], fields: string[]): Promise<any[]>
	{
		const schemaFieldsResult = await this.schemaFieldsGetterService.getSchemaFields(this.schema);
		const resItems = papiItems.map(papiItem =>
		{
			const papiItemShallowCopy = {...papiItem};
			const papiItemKeys = Object.keys(papiItemShallowCopy);
			const papiItemReferences = papiItemKeys.filter(key => key.includes('.'));
			for (const papiItemKey of papiItemReferences)
			{
				const originalFieldName = fields.find(field => schemaFieldsResult[field]?.TranslatedFieldName === papiItemKey);
				if (originalFieldName && originalFieldName !== papiItemKey)
				{
					papiItemShallowCopy[originalFieldName] = papiItemShallowCopy[papiItemKey];
					delete papiItemShallowCopy[papiItemKey];
				}
			}

			return papiItemShallowCopy;
		});

		return resItems;
	}

	/**
	 * Throws an error if no key is provided
	 */
	private validateKey(key: string) 
	{
		if (!key) 
		{
			throw new Error('No key provided');
		}
	}
}
