import { BaseResourceFetcherService } from './baseResourceFetcher.service';

export class ResourceFetcherByKeyService extends BaseResourceFetcherService
{
	protected override getResources(request: any): Promise<any>
	{
		return this.coreService.getResourceByKey();
	}
}
