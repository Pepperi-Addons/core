import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import PapiService from '../papi.service';
import { CoreService } from '../core.service';
import { mockClient } from './consts';
import { Request } from "@pepperi-addons/debug-server";
import { PapiClient } from '@pepperi-addons/papi-sdk';

chai.use(promised);

describe('Create schema', async () => {
    it('should return a valid schema', async () => {
        const papiClient = new PapiClient({
            baseURL: mockClient.BaseURL,
            token: mockClient.OAuthAccessToken,
            addonUUID: mockClient.AddonUUID,
            actionUUID: mockClient.ActionUUID,
        });

        papiClient.get = async (url: string) => {
            if (url === '/meta_data/products/fields?include_owned=true&include_internal=false') {
                return {
                    "Fields": [
                        {
                            "InternalID": 0,
                            "FieldID": "CreationDateTime",
                            "Label": "CreationDateTime",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 6,
                                "Name": "DateAndTime"
                            },
                            "Type": "String",
                            "Format": "DateTime",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "Email",
                            "Label": "Email",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "String",
                            "Format": "String",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "ExternalID",
                            "Label": "ExternalID",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "String",
                            "Format": "String",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "FirstName",
                            "Label": "FirstName",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "String",
                            "Format": "String",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "Hidden",
                            "Label": "Hidden",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 10,
                                "Name": "Boolean"
                            },
                            "Type": "Boolean",
                            "Format": "Boolean",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "IsInTradeShowMode",
                            "Label": "IsInTradeShowMode",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 10,
                                "Name": "Boolean"
                            },
                            "Type": "Boolean",
                            "Format": "Boolean",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "LastName",
                            "Label": "LastName",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "String",
                            "Format": "String",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "Mobile",
                            "Label": "Mobile",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "String",
                            "Format": "String",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "ModificationDateTime",
                            "Label": "ModificationDateTime",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 6,
                                "Name": "DateAndTime"
                            },
                            "Type": "String",
                            "Format": "DateTime",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "Phone",
                            "Label": "Phone",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "String",
                            "Format": "String",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "UUID",
                            "Label": "UUID",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "String",
                            "Format": "Guid",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        },
                        {
                            "InternalID": 0,
                            "FieldID": "InternalID",
                            "Label": "InternalID",
                            "Description": null,
                            "IsUserDefinedField": false,
                            "UIType": {
                                "ID": 1,
                                "Name": "TextBox"
                            },
                            "Type": "Integer",
                            "Format": "Int64",
                            "CreationDateTime": "0001-01-01T00:00:00",
                            "ModificationDateTime": "0001-01-01T00:00:00",
                            "Hidden": false,
                            "CSVMappedColumnName": null,
                            "UserDefinedTableSource": null,
                            "CalculatedRuleEngine": null,
                            "TypeSpecificFields": null
                        }
                    ]
                }
            }

            const papiService = new PapiService(papiClient);

            const request: Request = {
                method: 'POST',
                body: {},
                header: {},
                query:
                {
                    resource_name: 'users'
                }
            }

            const core = new CoreService(request, papiService);

            const schema = await core.createSchema();

            expect(schema).to.be.an('object');
            expect(schema.Name).to.be.a('string');
            expect(schema.Type).to.be.a('string');
            expect(schema.GenericResource).to.be.a('boolean');
            expect(schema.Fields).to.be.an('object');
        }
    })

    it('should throw an "invalid resource" exception', async () => {
        const papiClient = new PapiClient({
            baseURL: mockClient.BaseURL,
            token: mockClient.OAuthAccessToken,
            addonUUID: mockClient.AddonUUID,
            actionUUID: mockClient.ActionUUID,
        });

            const papiService = new PapiService(papiClient);

            const request: Request = {
                method: 'POST',
                body: {},
                header: {},
                query:
                {
                    resource_name: 'FAULTY_RESOURCE'
                }
            }

            const core = new CoreService(request, papiService);

            await expect(core.createSchema()).eventually.to.be.rejectedWith(`The resource name is not valid. Please provide a valid resource name.`);
        }
    )
});