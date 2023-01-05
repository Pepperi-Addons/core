import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { CoreSchemaService } from '../coreSchema.service';
import { MockApiService, mockClient, usersSchema } from './consts';
import { Request } from "@pepperi-addons/debug-server";
import { BaseCoreService } from '../baseCore.service';
import deepClone from 'lodash.clonedeep'


chai.use(promised);

describe('POST resource', async () => 
{
	const createPapiItem =
        {
        	"InternalID": 11443826,
        	"UUID": "cc27dfe9-e87a-4710-ab24-8f703e167213",
        	"ExternalID": "",
        	"CreationDateTime": "2020-01-05T08:29:23Z",
        	"Email": "pumddnx@hjqfiy.com",
        	"FirstName": "test",
        	"Hidden": true,
        	"IsInTradeShowMode": false,
        	"LastName": "Test",
        	"Mobile": "",
        	"ModificationDateTime": "2022-03-22T01:07:25Z",
        	"Phone": "",
        	"Profile": "cc27dfe9-e87a-4710-ab24-8f703e167213",
        	"Role": null,
        };

	const papiService = new MockApiService();

	papiService.upsertResource = async (resourceName: string, body: any) => 
	{
		const papiItem = deepClone(createPapiItem);
		papiItem.Profile = 
		{
			Data: 
			{
				UUID: papiItem.Profile
			}
		};

		return Promise.resolve(papiItem);
	}

	const request: Request = {
		method: 'POST',
		body: createPapiItem,
		header: {},
		query:
        {
        	resource_name: 'users',
        }
	}

	it('should return a standard Pepperi resource item', async () => 
	{

		const core = new BaseCoreService(usersSchema ,request, papiService);

		const item = await core.upsertResource();

		expect(item).to.be.an('Object');
		expect(item).to.have.property('Key', createPapiItem.UUID);
        
	});

	it('should return an ADAL compliant reference', async () => 
	{

		const core = new BaseCoreService(usersSchema ,request, papiService);

		const item = await core.upsertResource();

		expect(item).to.be.an('Object');
		expect(item).to.have.property('Profile', createPapiItem.Profile);
        
	});

	it('should throw "The UUID and Key fields are not equivalent." exception', async () => 
	{

		const requestCopy = deepClone(request);
		requestCopy.body.Key = '123';
		const core = new BaseCoreService(usersSchema ,requestCopy, papiService);
   
		await expect(core.upsertResource()).to.be.rejectedWith('The UUID and Key fields are not equivalent.'); 
	});

	it('should throw an "invalid resource" exception', async () => 
	{

		const papiService = new MockApiService();

		const request: Request = {
			method: 'POST',
			body: {},
			header: {},
			query:
                {
                	resource_name: 'FAULTY_RESOURCE',
                }
		}

		expect(() => new CoreSchemaService(request.query.resource_name, request, mockClient, papiService)).to.throw('The resource name is not valid. Please provide a valid resource name.');
	}
	)
});
