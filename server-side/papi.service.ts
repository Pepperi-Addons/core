import { PapiClient } from '@pepperi-addons/papi-sdk';
import typescript from 'rollup-plugin-typescript2';
import { PapiBatchResponse, ResourceFields } from './constants';
import { Helper } from './helper';

export class PapiService 
{
	constructor(protected papiClient: PapiClient) 
	{}

	async getResourceFields(resourceName: string): Promise<ResourceFields> 
	{
		const url = `/meta_data/${resourceName}/fields?include_owned=true&include_internal=false`;
		try{
			return this.papiClient.get(url);
		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<ResourceFields>(() => {});
		}

	}

	private throwWrappedError(error: unknown) {
		if (error instanceof Error) {
			// Copy error message
			const errorWrapper: any = new Error(error.message);

			// Copry error code
			errorWrapper.status = ((Object)(error)).status;

			throw errorWrapper;
		}
	}

	createResource(resourceName: string, body: any)
	{
		try
		{
			return this.papiClient.post(`/${resourceName}`, body);
		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<any>(() => {});
		}
		
	}

	batch(resourceName: string, body: any): Promise<PapiBatchResponse>
	{
		try{
			return this.papiClient.post(`/batch/${resourceName}`, body);
		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<PapiBatchResponse>(() => {});
		}
	}

	async getResources(resourceName: string, query: any)
	{
		let url = `/${resourceName}`;
		const encodedQeury = Helper.encodeQueryParams(query);
		url = `${url}?${encodedQeury}`;
		try{
			return this.papiClient.get(url);
		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<any>(() => {});
		}
	}

	async getResourceByKey(resourceName: string, key: string): Promise<any> 
	{
		try{
			return this.papiClient.get(`/${resourceName}/UUID/${key}`);
		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<any>(() => {});
		}
	}

	async getResourceByExternalId(resourceName: string, externalId: any)
	{
		try{
			return this.papiClient.get(`/${resourceName}/ExternalId/${externalId}`);
		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<any>(() => {});
		}
	}

	async getResourceByInternalId(resourceName: string, internalId: any)
	{
		try{
			return this.papiClient.get(`/${resourceName}/${internalId}`);
		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<any>(() => {});
		}
	}

	async searchResource(resourceName: string, body: void)
	{
		try{
			return this.papiClient.post(`/${resourceName}/search`, body);

		}
		catch(error)
		{
			this.throwWrappedError(error);

			// This line will never run, since we either return the actual response or throw an error.
			// But it's here to make typescript happy.
			return new Promise<any>(() => {});
		}
	}
}

export default PapiService;