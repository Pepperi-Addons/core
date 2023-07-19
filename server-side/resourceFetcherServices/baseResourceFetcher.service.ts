import { Request } from '@pepperi-addons/debug-server/dist';
import { BaseCoreService } from 'core-shared';

export class BaseResourceFetcherService
{
	constructor(protected coreService: BaseCoreService)
	{}

	public async fetch(request: Request): Promise<any>
	{
		const response = await this.getResources(request);
		return this.formatResponse(response);
	}

	protected formatResponse(response: any): any
	{
		return response;
	}

	protected async getResources(request: Request): Promise<any>
	{
		return await this.coreService.getResources();
	}
}
