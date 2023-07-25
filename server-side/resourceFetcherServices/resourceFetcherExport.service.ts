import { Request } from '@pepperi-addons/debug-server/dist';
import { BaseResourceFetcherService } from './baseResourceFetcher.service';

export interface PageKey {
    Page: number;
    PageSize: number;
}

export class ResourceFetcherExportService extends BaseResourceFetcherService
{
	protected readonly PAPI_PAGE_SIZE_HARD_LIMIT = 1000;
	protected pageKey: PageKey | undefined;

	protected override formatResponse(response: any): any
	{
		const res: {Objects: any[], NextPageKey?: string} = {Objects: response};

		// If there's a page key and the response is full, set the next page key
		if(this.pageKey && response.length === this.pageKey.PageSize)
		{
			this.pageKey.Page++;
			res.NextPageKey = JSON.stringify(this.pageKey);
		}

		return res;
	}

	protected override async getResources(request: Request): Promise<any>
	{
		this.setPagination(request);
		return await this.coreService.getResources();
	}

	protected setPagination(request: Request)
	{
		this.validateParameters(request);

		// If a page is provided, use it. Otherwise, use PageKey - either a provided one or a default one
		if(!request.query?.page)
		{
			// If page_size is provided and is between 1 and PAPI_PAGE_SIZE_HARD_LIMIT, use it. Otherwise, use PAPI_PAGE_SIZE_HARD_LIMIT
			const pageSize = (request.query?.hasOwnProperty('page_size') && request.query.page_size <= this.PAPI_PAGE_SIZE_HARD_LIMIT && request.query?.page_size > 0) ?
				request.query.page_size : this.PAPI_PAGE_SIZE_HARD_LIMIT;

			// If page_key is provided, use it. Otherwise, use as default page 1 and the page_size we just determined
			this.pageKey = request.query?.page_key ? JSON.parse(request.query.page_key) : {
				Page: 1,
				PageSize: pageSize
			};
            
			// Set the query parameters
			// We now know that this.pageKey is defined
			request.query.page = this.pageKey!.Page;
			request.query.page_size = this.pageKey!.PageSize;

			// Delete page_key from the query
			delete request.query.page_key;
		}
        
	}

	protected validateParameters(request: Request)
	{
		// Page and PageKey are mutually exclusive
		if (request.query?.page && request.query?.page_key)
		{
			throw new Error('Page and PageKey are mutually exclusive, but both were provided');
		}

		// If page_size is provided and there's a page_key, make sure page_key.pageSize matches page_size
		if(request.query?.page_key && request.query?.page_size)
		{
			const parsedPageKey: PageKey = JSON.parse(request.query?.page_key);
			if(parsedPageKey.PageSize !== request.query.page_size)
			{
				throw new Error('PageKey pageSize does not match the pageSize in the request');
			}
		}
	}
}
