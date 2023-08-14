import { PapiBatchResponse, ResourceFields, SearchResult } from './constants';
import { ISchemaGetter } from './iSchemaGetter';

export interface IPapiService extends ISchemaGetter
{
	getResourceFields(): Promise<ResourceFields>;

	createResource(body: any): Promise<any>;

	updateResource(body: any): Promise<any>;

	upsertResource(body: any): Promise<any>;

	batch(body: any): Promise<PapiBatchResponse>;

	getResources(query: any): Promise<Array<any>>;

	getResourceByKey(key: string): Promise<any>;

	getResourceByExternalId(externalId: any): Promise<any>;

	getResourceByInternalId(internalId: any): Promise<any>;

	searchResource(body: void): Promise<SearchResult>;
}

export default IPapiService;
