import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { Request } from '@pepperi-addons/debug-server';
import { PageKey, ResourceFetcherExportService } from '../resourceFetcherServices';
import { MockCoreService } from './constants';


chai.use(promised);

describe('Export resources', async () => 
{
	const resourcesList = [
		{
			'InternalID': 11443826,
			'UUID': 'cc27dfe9-e87a-4710-ab24-8f703e167213',
			'ExternalID': 'User0',
			'CreationDateTime': '2020-01-05T08:29:23Z',
			'Email': 'pumddnx@hjqfiy.com',
			'FirstName': 'test',
			'Hidden': true,
			'IsInTradeShowMode': false,
			'LastName': 'Test',
			'Mobile': '',
			'ModificationDateTime': '2022-03-22T01:07:25Z',
			'Phone': '',
			'Profile': {
				'Data': {
					'InternalID': 69005,
					'Name': 'Admin'
				},
				'URI': '/profiles/69005'
			},
			'Role': null,
		},
		{
			'InternalID': 11496119,
			'UUID': 'dd51e0a9-83f3-49b5-9074-35f13916b340',
			'ExternalID': 'User1',
			'CreationDateTime': '2022-05-09T13:39:18Z',
			'Email': 'testing@testing.testing',
			'FirstName': 'aaa',
			'Hidden': false,
			'IsInTradeShowMode': false,
			'LastName': 'aa',
			'Mobile': '',
			'ModificationDateTime': '2022-05-09T13:40:31Z',
			'Phone': '',
			'Profile': {
				'Data': {
					'InternalID': 69004,
					'Name': 'Rep'
				},
				'URI': '/profiles/69004'
			},
			'Role': null,
		}
	];

	const request: Request = {
		method: 'GET',
		body: {},
		header: {},
		query:
        {
        	resource_name: 'users',
        }
	}

	it('No Page or PageKey passed should return NextPageKey', async () => 
	{
		const requestCopy = { ...request};
		const queryCopy = { 
			...requestCopy.query,
			page_size: 1, 
		};
		requestCopy.query = queryCopy;

		const core = new MockCoreService(requestCopy);
		const resourceFetcherService = new ResourceFetcherExportService(core);

		core.getResources = async () =>
		{
			return Promise.resolve(resourcesList.slice(0, 1));
		}

		const res = await resourceFetcherService.fetch(requestCopy);

		expect(res).to.be.an('Object').with.property('NextPageKey');
		expect(res.NextPageKey).to.be.a('string');

		const parsedPageKey = JSON.parse(res.NextPageKey);
		expect(parsedPageKey).to.be.an('Object').with.property('Page');
		expect(parsedPageKey.Page).to.equal(2);
		expect(parsedPageKey).to.be.an('Object').with.property('PageSize');
		expect(parsedPageKey.PageSize).to.equal(1);

		expect(res).to.be.an('Object').with.property('Objects');
		expect(res.Objects).to.be.an('Array');
		expect(res.Objects.length).to.equal(1);
        
	});

	it('Passed PageKey should return NextPageKey', async () => 
	{
		const pageKey: PageKey = {
			Page: 1,
			PageSize: 1,
		};
		const requestCopy = { ...request};
		const queryCopy = { 
			...requestCopy.query,
			page_key: JSON.stringify(pageKey), 
		};
		requestCopy.query = queryCopy;

		const core = new MockCoreService(requestCopy);
		const resourceFetcherService = new ResourceFetcherExportService(core);

		core.getResources = async () =>
		{
			return Promise.resolve(resourcesList.slice(0, 1));
		}

		const res = await resourceFetcherService.fetch(requestCopy);

		expect(res).to.be.an('Object').with.property('NextPageKey');
		expect(res.NextPageKey).to.be.a('string');

		const parsedPageKey = JSON.parse(res.NextPageKey);
		expect(parsedPageKey).to.be.an('Object').with.property('Page');
		expect(parsedPageKey.Page).to.equal(2);
		expect(parsedPageKey).to.be.an('Object').with.property('PageSize');
		expect(parsedPageKey.PageSize).to.equal(1);

		expect(res).to.be.an('Object').with.property('Objects');
		expect(res.Objects).to.be.an('Array');
		expect(res.Objects.length).to.equal(1);
        
	});

	it('Passed Page should return NextPageKey', async () => 
	{
		const page = 1;
		const requestCopy = { ...request};
		const queryCopy = { 
			...requestCopy.query,
			page: page,
		};
		requestCopy.query = queryCopy;

		const core = new MockCoreService(requestCopy);
		const resourceFetcherService = new ResourceFetcherExportService(core);

		core.getResources = async () =>
		{
			return Promise.resolve(resourcesList.slice(0, 1));
		}

		const res = await resourceFetcherService.fetch(requestCopy);

		expect(res.hasOwnProperty('NextPageKey')).to.be.false;

		expect(res).to.be.an('Object').with.property('Objects');
		expect(res.Objects).to.be.an('Array');
		expect(res.Objects.length).to.equal(1);
        
	});
});
