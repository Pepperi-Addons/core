import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { CoreSchemaService } from '../coreSchema.service';
import { MockApiService, mockClient, usersSchema } from './consts';
import { Request } from '@pepperi-addons/debug-server';
import { BaseCoreService } from '../baseCore.service';
import { PapiBatchResponse } from '../constants';
import { AddonDataScheme } from '@pepperi-addons/papi-sdk';

chai.use(promised);

describe('Batch', async () => 
{
	const papiBatchResult: PapiBatchResponse = [
		{
			InternalID:21356284,
			UUID:'00000000-0000-0000-0000-000000000000',
			ExternalID:'',
			Status:'Update',
			Message:'Row updated.',
			URI:'/users/21356284'
		},
		{
			InternalID:21356294,
			UUID:'00000000-0000-0000-0000-000000000000',
			ExternalID:'',
			Status:'Ignore',
			Message:'No changes in this row. The row is being ignored.',
			URI:'/users/21356294'
		},
		{
			Key: '00000000-0000-0000-0000-000000000000',
			Status: 'Error',
			Details: 'General error: Upload file error, internal code = NUC'
		}
	];
    
	const resourcesList = [
		{
			'InternalID': 21356284,
			'UUID': '34e2eec8-ac68-460f-8672-e95c17908e9e',
			'ExternalID': 'MytestingAccount16',
			'City': 'Raanana',
			'Country': 'IL',
			'CreationDate': '2022-07-25T13:05:18Z',
			'Debts30': 0.0000,
			'Debts60': 0.0000,
			'Debts90': 0.0000,
			'DebtsAbove90': 0.0000,
			'Discount': 0.0,
			'Email': '',
			'Hidden': false,
			'Latitude': 32.184781,
			'Longitude': 34.871326,
			'Mobile': '',
			'ModificationDateTime': '2022-07-25T14:20:28Z',
			'Name': null,
			'Note': '',
			'Phone': null,
			'Prop1': '',
			'Prop2': '',
			'Prop3': '',
			'Prop4': '',
			'Prop5': '',
			'State': null,
			'Status': 2,
			'StatusName': 'Submitted',
			'Street': '',
			'Type': 'Customer',
			'TypeDefinitionID': 271182,
			'ZipCode': '',
			'Catalogs': {
				'Data': [],
				'URI': '/account_catalogs?where=AccountInternalID=21356284'
			},
			'Parent': null,
			'PriceList': null,
			'SpecialPriceList': null,
			'Users': {
				'Data': [],
				'URI': '/users?InternalWhereClause=AccountInternalID=21356284&InternalType=35'
			}
		},
		{
			'InternalID': 21356294,
			'UUID': 'd6ea001a-6f50-4253-9ac5-b3f0583acfa4',
			'ExternalID': 'MytestingAccount18',
			'City': '',
			'Country': 'IL',
			'CreationDate': '2022-07-25T14:18:21Z',
			'Debts30': 0.0000,
			'Debts60': 0.0000,
			'Debts90': 0.0000,
			'DebtsAbove90': 0.0000,
			'Discount': 0.0,
			'Email': '',
			'Hidden': false,
			'Latitude': 31.046051,
			'Longitude': 34.851612,
			'Mobile': '',
			'ModificationDateTime': '2022-07-25T14:20:29Z',
			'Name': null,
			'Note': '',
			'Phone': null,
			'Prop1': '',
			'Prop2': '',
			'Prop3': '',
			'Prop4': '',
			'Prop5': '',
			'State': null,
			'Status': 2,
			'StatusName': 'Submitted',
			'Street': '',
			'Type': 'Customer',
			'TypeDefinitionID': 271182,
			'ZipCode': '',
			'Catalogs': {
				'Data': [],
				'URI': '/account_catalogs?where=AccountInternalID=21356294'
			},
			'Parent': null,
			'PriceList': null,
			'SpecialPriceList': null,
			'Users': {
				'Data': [],
				'URI': '/users?InternalWhereClause=AccountInternalID=21356294&InternalType=35'
			}
		}
	]

	const papiService = new MockApiService('users');
	papiService.batch = async ( body: any) => 
	{
		return Promise.resolve(papiBatchResult);
	}

	papiService.searchResource = async (body: any) => 
	{
		expect(body).to.have.property('InternalIDList');
		expect(body.InternalIDList).to.be.an('array');
		expect(body.InternalIDList).to.have.lengthOf(papiBatchResult.length);
		expect(body.InternalIDList).to.include(21356284);
		expect(body.InternalIDList).to.include(21356294);
		return Promise.resolve({Objects: resourcesList});
	}

	const request: Request = {
		method: 'POST',
		body: {
			Objects: 
            [
            	{ ExternalID: 'MytestingAccount16' },
            	{ ExternalID: 'MytestingAccount18' },
            	{ dsad: 'FaultyData' }
            ]
		},
		header: {},
		query:
        {
        	resource_name: 'users',
        }
	}

	it('should perform batch', async () => 
	{

		const requestCopy = { ...request };
		const core = new BaseCoreService(usersSchema ,requestCopy, papiService);

		const items = await core.batch();

		expect(items).to.be.an('Object').with.property('DIMXObjects');
		expect(items.DIMXObjects).to.be.an('Array');
		expect(items.DIMXObjects.length).to.equal(papiBatchResult.length);
		for(const item in items.DIMXObjects)
		{
			expect(items.DIMXObjects[item]).to.have.property('Key');
			expect(items.DIMXObjects[item]).to.have.property('Status');
			if(items.DIMXObjects[item].Status === 'Error')
			{
				expect(items.DIMXObjects[item]).to.have.property('Details');
			}
		}
	});

	it('should throw a "Missing an Objects array" exception', async () => 
	{
		const requestCopy = { ...request };
		const body = {
		}
		requestCopy.body = body;

		const core = new BaseCoreService(usersSchema ,requestCopy, papiService);

		await expect(core.batch()).to.be.rejectedWith(`Missing an Objects array`);

	});

	it('should throw a "OverwriteObject parameter is not supported." exception', async () => 
	{
		const requestCopy = { ...request };
		const body = {
			Objects:[],
			OverwriteObject: true
		}
		requestCopy.body = body;

		const core = new BaseCoreService(usersSchema ,requestCopy, papiService);

		await expect(core.batch()).to.be.rejectedWith(`OverwriteObject parameter is not supported.`);

	});

	it('should throw an "invalid resource" exception', async () => 
	{
		const papiService = new MockApiService('FAULTY_RESOURCE');

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
