import { PapiBatchResponse, ResourceFields, SearchResult } from './constants';
import { ISchemaGetter } from './iSchemaGetter';

export interface IPapiService extends ISchemaGetter
{
	getResourceFields(): Promise<ResourceFields>;

	createResource(body: any, fieldsString: string): Promise<any>;

	updateResource(body: any, fieldsString: string): Promise<any>;

	upsertResource(body: any, fieldsString: string): Promise<any>;

	batch(body: any): Promise<PapiBatchResponse>;

	getResources(query: any): Promise<Array<any>>;

	getResourceByKey(key: string, fieldsString: string): Promise<any>;

	getResourceByExternalId(externalId: any, fieldsString: string): Promise<any>;

	getResourceByInternalId(internalId: any, fieldsString: string): Promise<any>;

	searchResource(body: void): Promise<SearchResult>;
}

export default IPapiService;
