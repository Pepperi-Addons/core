import 'mocha';
import chai, { expect } from 'chai';
import promised from 'chai-as-promised';
import { CoreSchemaService } from '../coreSchema.service';
import { MockApiService, mockClient } from './consts';
import { Request } from "@pepperi-addons/debug-server";
import { BaseCoreService } from '../baseCore.service';
import { CatalogsCoreService } from '../catalogsCore.service';

chai.use(promised);

const catalogWithCreationDate = {
    "InternalID": 75022,
    "UUID": "f16583db-d6e4-4823-9e84-ed37d04c4c3f",
    "ExternalID": "Default Catalog",
    "CreationDate": "2020-01-05T08:29:07Z",
    "Description": "",
    "ExpirationDate": "2020-01-05Z",
    "Hidden": false,
    "IsActive": true,
    "ModificationDateTime": "2020-01-05T08:29:07Z",
    "TSAImage": null,
    "Key": "f16583db-d6e4-4823-9e84-ed37d04c4c3f"
}

const catalogsWithCreationDateTime : {
                                    InternalID: number,
                                    UUID: string,
                                    ExternalID: string,
                                    CreationDate?: string,
                                    CreationDateTime?: string,
                                    Description: string,
                                    ExpirationDate: string,
                                    Hidden: boolean,
                                    IsActive: boolean,
                                    ModificationDateTime: string,
                                    TSAImage: any,
                                    Key: string                                    
                                    } = {...catalogWithCreationDate}
catalogsWithCreationDateTime['CreationDateTime'] = catalogsWithCreationDateTime.CreationDate;
delete catalogsWithCreationDateTime.CreationDate; 

describe('GET resource by key', async () => {
    const requestedKey = 'dd51e0a9-83f3-49b5-9074-35f13916b340';

    it('should return a valid item', async () => {

        const papiService = new MockApiService();

        papiService.getResourceByKey = async (resourceName: string, key: string) => {
            if(resourceName === 'users' && key === 'dd51e0a9-83f3-49b5-9074-35f13916b340')
            {
                return Promise.resolve(
                    JSON.parse('{"InternalID":11496119,"UUID":"dd51e0a9-83f3-49b5-9074-35f13916b340","ExternalID":"","CreationDateTime":"2022-05-09T13:39:18Z","Email":"testing@testing.testing","FirstName":"aaa","Hidden":false,"IsInTradeShowMode":false,"LastName":"aa","Mobile":"","ModificationDateTime":"2022-05-09T13:40:31Z","Phone":"","Profile":{"Data":{"InternalID":69004,"Name":"Rep"},"URI":"/profiles/69004"},"Role":null}')
                )
            }
            else
            {
                return Promise.reject(new Error('404 - could not find such a resource'));
            }
        }

        const request: Request = {
            method: 'GET',
            body: {},
            header: {},
            query:
            {
                resource_name: 'users',
                key: requestedKey
            }
        }

        const core = new BaseCoreService(request.query.resource_name ,request, papiService);

        const item = await core.getResourceByKey();

        expect(item).to.be.an('object');
        expect(item).to.have.property('Key', requestedKey);
    });

    it('should return a valid catalog with CreationDateTime', async () => {

        const papiService = new MockApiService();

        papiService.getResourceByKey = async (resourceName: string, key: string) => {
            if(resourceName === 'catalogs' && key === catalogWithCreationDate.Key)
            {
                return Promise.resolve(catalogWithCreationDate);
            }
            else
            {
                return Promise.reject(new Error('404 - could not find such a resource'));
            }
        }

        const request: Request = {
            method: 'GET',
            body: {},
            header: {},
            query:
            {
                resource_name: 'catalogs',
                key: catalogWithCreationDate.Key
            }
        }

        const core = new CatalogsCoreService(request.query.resource_name ,request, papiService);

        const item = await core.getResourceByKey();

        expect(item).to.be.an('object');
        expect(item).to.have.property('Key', catalogWithCreationDate.Key);
        expect(item).to.have.a.property('CreationDateTime', catalogWithCreationDate.CreationDate);
    })


    it('should throw an "invalid resource" exception', async () => {
            const papiService = new MockApiService();

            const request: Request = {
                method: 'POST',
                body: {},
                header: {},
                query:
                {
                    resource_name: 'FAULTY_RESOURCE',
                    key: requestedKey
                }
            }

            expect(() => new CoreSchemaService(request.query.resource_name, request, mockClient, papiService)).to.throw('The resource name is not valid. Please provide a valid resource name.');
        }
    )
});