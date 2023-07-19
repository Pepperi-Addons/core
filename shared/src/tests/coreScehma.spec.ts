import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { CoreSchemaService } from '../coreSchema.service';
import { MockApiService, mockClient } from './consts';
import { Request } from '@pepperi-addons/debug-server';
import { Helper } from '../helper';

chai.use(promised);

describe('Create schema', async () => 
{
	const request: Request = {
		method: 'POST',
		body: {},
		header: {},
		query:
        {
        	addon_uuid: '00000000-0000-0000-0000-000000000000',
        }
	}

	// Override the default validation function to not throw an error
	Helper.validateAddonSecretKey = async () => 
	{
		return Promise.resolve()
	};

	const papiService = new MockApiService('users');

	it('should return a valid schema', async () => 
	{
		const requestCopy = { ...request };
		requestCopy.body.Name = 'users';
		requestCopy.body.Type = 'papi';

		const core = new CoreSchemaService(requestCopy.body.Name, request, mockClient, papiService);

		papiService.getResourceFields = async () => 
		{
			return Promise.resolve(JSON.parse(`[{"InternalID":0,"FieldID":"CreationDateTime","Label":"CreationDateTime","Description":null,"IsUserDefinedField":false,"UIType":{"ID":6,"Name":"DateAndTime"},"Type":"String","Format":"DateTime","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"Email","Label":"Email","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"String","Format":"String","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"ExternalID","Label":"ExternalID","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"String","Format":"String","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"FirstName","Label":"FirstName","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"String","Format":"String","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"Hidden","Label":"Hidden","Description":null,"IsUserDefinedField":false,"UIType":{"ID":10,"Name":"Boolean"},"Type":"Boolean","Format":"Boolean","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"IsInTradeShowMode","Label":"IsInTradeShowMode","Description":null,"IsUserDefinedField":false,"UIType":{"ID":10,"Name":"Boolean"},"Type":"Boolean","Format":"Boolean","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"LastName","Label":"LastName","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"String","Format":"String","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"Mobile","Label":"Mobile","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"String","Format":"String","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"ModificationDateTime","Label":"ModificationDateTime","Description":null,"IsUserDefinedField":false,"UIType":{"ID":6,"Name":"DateAndTime"},"Type":"String","Format":"DateTime","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"Phone","Label":"Phone","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"String","Format":"String","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"UUID","Label":"UUID","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"String","Format":"Guid","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null},{"InternalID":0,"FieldID":"InternalID","Label":"InternalID","Description":null,"IsUserDefinedField":false,"UIType":{"ID":1,"Name":"TextBox"},"Type":"Integer","Format":"Int64","CreationDateTime":"0001-01-01T00:00:00","ModificationDateTime":"0001-01-01T00:00:00","Hidden":false,"CSVMappedColumnName":null,"UserDefinedTableSource":null,"CalculatedRuleEngine":null,"TypeSpecificFields":null}]`));
		}

		const schema = await core.createSchema();

		expect(schema).to.be.an('object');
		expect(schema.Name).to.be.a('string');
		expect(schema.Name).to.equal(requestCopy.body.Name);
		expect(schema.Type).to.equal(requestCopy.body.Type);
		expect(schema.GenericResource).to.be.true;
		expect(schema.Fields).to.be.an('object');
	})

	it('should throw a "The schema must be of type `papi`" exception', async () => 
	{
		const requestCopy = { ...request };
		requestCopy.body.Name = 'users';
		requestCopy.body.Type = 'UNSUPPORTED';

		const core = new CoreSchemaService(requestCopy.body.Name, request, mockClient, papiService);

		await expect(core.createSchema()).to.be.rejectedWith("The schema must be of type 'papi'");
	})

	it('should throw an "invalid resource" exception', async () => 
	{

		const papiService = new MockApiService('FAULTY_RESOURCE');

		const request: Request = {
			method: 'POST',
			body: {},
			header: {},
			query:
            {
            	resource_name: 'FAULTY_RESOURCE'
            }
		}

		expect(() => new CoreSchemaService(request.query.resource_name, request, mockClient, papiService)).to.throw('The resource name is not valid. Please provide a valid resource name.');
	}
	)
});
