import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { CoreSchemaService } from '../coreSchema.service';
import { MockApiService, mockClient } from './consts';
import { Request } from "@pepperi-addons/debug-server";
import { BaseCoreService } from '../baseCore.service';

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
        	"Profile": {
        		"Data": {
        			"InternalID": 69005,
        			"Name": "Admin"
        		},
        		"URI": "/profiles/69005"
        	},
        	"Role": null,
        };

	// const papiClient = new PapiClient({
	//     baseURL: mockClient.BaseURL,
	//     token: mockClient.OAuthAccessToken,
	//     addonUUID: mockClient.AddonUUID,
	//     actionUUID: mockClient.ActionUUID,
	// });

	// papiClient.post = async (url: string) => {
	//     return Promise.resolve(createPapiItem);
	// }

	const papiService = new MockApiService();

	papiService.upsertResource = async (resourceName: string, body: any) => 
	{
		return Promise.resolve(createPapiItem);
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

		const core = new BaseCoreService(request.query.resource_name ,request, papiService);

		const item = await core.upsertResource();

		expect(item).to.be.an('Object');
		expect(item).to.have.property('Key', createPapiItem.UUID);
        
	});

	it('should throw "The UUID and Key fields are not equivalent." exception', async () => 
	{

		const requestCopy = { ...request };
		requestCopy.body.Key = '123';
		const core = new BaseCoreService(request.query.resource_name ,requestCopy, papiService);

		// expect(async () => await core.createResource()).to.throw('The UUID and Key fields are not equivalent.');
		// await core.createResource().should.be.rejectedWith('The UUID and Key fields are not equivalent.');     
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