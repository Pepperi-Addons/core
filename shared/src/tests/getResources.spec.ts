import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { CoreSchemaService } from '../coreSchema.service';
import { MockApiService, mockClient, usersSchema } from './consts';
import { Request } from "@pepperi-addons/debug-server";
import { BaseCoreService } from '../baseCore.service';
import deepClone from 'lodash.clonedeep'


chai.use(promised);

describe('GET resources', async () => 
{
	const resourcesList = [
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
					"UUID": "cc27dfe9-e87a-4710-ab24-8f703e167213", 
					"Name": "Admin"
				},
				"URI": "/profiles/69005"
			},
			"Role": null,
			"Key": "cc27dfe9-e87a-4710-ab24-8f703e167213"
		},
		{
			"InternalID": 11496119,
			"UUID": "dd51e0a9-83f3-49b5-9074-35f13916b340",
			"ExternalID": "",
			"CreationDateTime": "2022-05-09T13:39:18Z",
			"Email": "testing@testing.testing",
			"FirstName": "aaa",
			"Hidden": false,
			"IsInTradeShowMode": false,
			"LastName": "aa",
			"Mobile": "",
			"ModificationDateTime": "2022-05-09T13:40:31Z",
			"Phone": "",
			"Profile": {
				"Data": {
					"InternalID": 69004,
					"UUID": "dd51e0a9-83f3-49b5-9074-35f13916b340", 
					"Name": "Rep"
				},
				"URI": "/profiles/69004"
			},
			"Role": null,
			"Key": "dd51e0a9-83f3-49b5-9074-35f13916b340"
		}
	]

	const papiService = new MockApiService();
	papiService.getResources = async (resourceName: string, query: any) => 
	{
		if(query.include_deleted && Object.keys(query).length === 1)
		{
			return Promise.resolve(resourcesList);
		}
		if(query.fields == 'UUID')
		{
			return Promise.resolve(resourcesList.filter(resource => query.include_deleted || !resource.Hidden).map(resource => resource.UUID));
		}
		else
		{
			return Promise.resolve(resourcesList.filter(resource => !resource.Hidden));
		}
	}

	const request: Request = {
		method: 'GET',
		body: {},
		header: {},
		query:
        {
        	resource_name: 'users',
        }
	}

	it('should return non-hidden items', async () => 
	{

		const core = new BaseCoreService(usersSchema ,request, papiService);

		const items = await core.getResources();

		expect(items).to.be.an('Array');
		expect(items.length).to.equal(1);
		expect(items[0]).to.have.property('Key');
		expect(items[0]).to.have.property('Hidden', false);
        
	});

	it('should return hidden and non-hidden items', async () => 
	{

		const requestCopy = deepClone(request);
		requestCopy.query.include_deleted = true;
		const core = new BaseCoreService(usersSchema ,requestCopy, papiService);

		const items = await core.getResources();

		expect(items).to.be.an('Array');
		expect(items.length).to.equal(2);
		const hiddenItem = items.find(item => item.Hidden);
		const nonHiddenItem = items.find(item => !item.Hidden);

		// Should have a hidden item
		expect(hiddenItem).to.exist;
		// Should have a non-hidden item
		expect(nonHiddenItem).to.exist;
        
	});

	it("should return a non-hidden item's Key only", async () => 
	{

		const requestCopy = deepClone(request);
		requestCopy.query.fields = 'Key';
		const core = new BaseCoreService(usersSchema ,requestCopy, papiService);

		const items = await core.getResources();

		expect(items).to.be.an('Array');
		expect(items.length).to.equal(1);
		//The item's number of properties should be 1
		expect(Object.keys(items[0]).length).to.equal(1);
		expect(items[0]).to.have.property('Key');

        
	});

	it('should return an ADAL compliant reference field', async () => 
	{

		const core = new BaseCoreService(usersSchema ,request, papiService);

		const items = await core.getResources();

		expect(items).to.be.an('Array');
		expect(items.length).to.equal(1);
		expect(items[0]).to.have.property('Profile', resourcesList[1].Profile.Data.UUID );
        
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
