import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { Addon, AddonDataScheme } from '@pepperi-addons/papi-sdk';

import { SchemaFieldsGetterService, SchemaFieldsResult } from '../schemaFieldsGetter.service';
import { ISchemaGetter } from '../iSchemaGetter';

chai.use(promised);

describe('Schema fields getter service', async () => 
{
	const referredSchema: AddonDataScheme = {
		Name: 'Referred',
		Type: 'papi',
		Fields: {
			'ReferredField': {
				Type: 'String',
			},
		}
	}

	const referringSchema: AddonDataScheme = {
		Name: 'Referring',
		Type: 'papi',
		Fields: {
			'ReferringField': {
				Type: 'Resource',
				Resource: 'Referred',
			},
		}
	}

	const twiceReferringSchema: AddonDataScheme = {
		Name: 'TwiceReferring',
		Type: 'papi',
		Fields: {
			'ReferringField1': {
				Type: 'Resource',
				Resource: 'Referring',
			},
		}
	}

	const referringAndKeyTranslatedToNameSchema: AddonDataScheme = {
		Name: 'roles',
		Type: 'papi',
		Fields: {
			'Key': {
				Type: 'String',
			},
			'ReferringField': {
				Type: 'Resource',
				Resource: 'users',
			},
		}
	}

	const referredAndKeyTranslatedToUUIDSchema: AddonDataScheme = {
		Name: 'users',
		Type: 'papi',
		Fields: {
			'Key': {
				Type: 'String',
			},
		}
	}

	const schemas: AddonDataScheme[] = [
		referredSchema,
		referringSchema,
		twiceReferringSchema,
		referringAndKeyTranslatedToNameSchema,
		referredAndKeyTranslatedToUUIDSchema
	];

	class MockSchemaGetter implements ISchemaGetter
	{
		getResourceSchema(resourceName?: string | undefined): Promise<AddonDataScheme>
		{
			return Promise.resolve(schemas.find(s => s.Name === resourceName)!);
		}
	}

	const mockSchemaGetter = new MockSchemaGetter();

	it("Should return the non-referring schema's fields", async () => 
	{
		await fieldsGetterTestLogic(referredSchema, 'ReferredField');
	});

	it("Should return the single reference schema's fields", async () => 
	{
		await fieldsGetterTestLogic(referringSchema, 'ReferringField.ReferredField');
	});

	it("Should return the internally referenced schema's fields", async () => 
	{
		await fieldsGetterTestLogic(twiceReferringSchema, 'ReferringField1.ReferringField.ReferredField');
	});

	it('Should translate Key to UUID', async () =>
	{
		await fieldsGetterTestLogic(referredAndKeyTranslatedToUUIDSchema, 'Key', 'UUID');
	});

	it('Should translate Key to Name', async () =>
	{
		await fieldsGetterTestLogic(referringAndKeyTranslatedToNameSchema, 'Key', 'Name');
	});

	it('Should translate referenced field to referencedField.UUID', async () =>
	{
		await fieldsGetterTestLogic(referringAndKeyTranslatedToNameSchema, 'ReferringField', 'ReferringField.UUID');
	});

	it("Should translate referenced schema's Key to UUID", async () =>
	{
		await fieldsGetterTestLogic(referringAndKeyTranslatedToNameSchema, 'ReferringField.Key', 'ReferringField.UUID');
	});

	async function fieldsGetterTestLogic(addonDataScheme: AddonDataScheme, fieldName: string, translatedFieldName: string = fieldName)
	{
		const schemaFieldsGetter = new SchemaFieldsGetterService(mockSchemaGetter);
		const res = await schemaFieldsGetter.getSchemaFields(addonDataScheme);

		basicFieldsGetterTests(res, fieldName, translatedFieldName);
	}

	function basicFieldsGetterTests(schemaFields: SchemaFieldsResult, fieldName: string, translatedFieldName: string = fieldName)
	{
		expect(schemaFields).to.be.an('Object');
		expect(schemaFields).to.have.property(fieldName);
		expect(schemaFields[fieldName]).to.have.property('FieldType').and.to.equal('String');
		expect(schemaFields[fieldName]).to.have.property('TranslatedFieldName').and.to.equal(translatedFieldName);
	}
});
