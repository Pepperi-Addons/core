import { PapiBatchResponse, ResourceFields, SearchResult } from './constants';

export interface IPapiService 
{

	getResourceFields(resourceName: string): Promise<ResourceFields>;

	createResource(resourceName: string, body: any): Promise<any>;

	updateResource(resourceName: string, body: any): Promise<any>;

	upsertResource(resourceName: string, body: any): Promise<any>;

	batch(resourceName: string, body: any): Promise<PapiBatchResponse>;

	getResources(resourceName: string, query: any): Promise<Array<any>>;

	getResourceByKey(resourceName: string, key: string): Promise<any>;

	getResourceByExternalId(resourceName: string, externalId: any): Promise<any>;

	getResourceByInternalId(resourceName: string, internalId: any): Promise<any>;

	searchResource(resourceName: string, body: void): Promise<SearchResult>;
}

export default IPapiService;
