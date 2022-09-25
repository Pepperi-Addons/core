
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { PapiClient, Relation } from '@pepperi-addons/papi-sdk'
import semver from 'semver';

export async function install(client: Client, request: Request): Promise<any> 
{
	const papiClient = createPapiClient(client);
	await createDimxRelations(papiClient, client);
	return {success:true,resultObject:{}}
}

export async function uninstall(client: Client, request: Request): Promise<any> 
{
	const papiClient = createPapiClient(client);
	await removeDimxRelations(papiClient, client);
	
	return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> 
{
	if (request.body.FromVersion && semver.compare(request.body.FromVersion, '0.0.8') < 0) 
	{
		await createDimxRelations(createPapiClient(client), client);
	}
	return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> 
{
	return {success:true,resultObject:{}}
}

function createPapiClient(Client: Client) 
{
	return new PapiClient({
		token: Client.OAuthAccessToken,
		baseURL: Client.BaseURL,
		addonUUID: Client.AddonUUID,
		addonSecretKey: Client.AddonSecretKey,
		actionUUID: Client.ActionUUID,
	});
}

async function createDimxRelations(papiClient: PapiClient, client: Client) 
{
	const isHidden = false;
	await upsertDimxRelations(client, isHidden, papiClient);
}

async function removeDimxRelations(papiClient: PapiClient, client: Client) 
{
	const isHidden = true;
	await upsertDimxRelations(client, isHidden, papiClient);
}

async function upsertDimxRelations(client: Client, isHidden: boolean, papiClient: PapiClient) 
{
	const { importRelation, exportRelation }: { importRelation: Relation; exportRelation: Relation; } = getDimxRelationsBodies(client, isHidden);

	await upsertRelation(papiClient, importRelation);
	await upsertRelation(papiClient, exportRelation);
}

function getDimxRelationsBodies(client: Client, isHidden: boolean) 
{
	const importRelation: Relation = {
		RelationName: "DataImportSource",
		AddonUUID: client.AddonUUID,
		Name: 'papi',
		KeyName: 'Key',
		Type: 'AddonAPI',
		AddonRelativeURL: '/data_source_api/batch',
		Hidden: isHidden
	};

	const exportRelation: Relation = {
		RelationName: 'DataExportSource',
		AddonUUID: client.AddonUUID,
		Name: 'papi',
		Type: 'AddonAPI',
		AddonRelativeURL: '/data_source_api/papi_export',
		Hidden: isHidden
	};
	return { importRelation, exportRelation };
}

async function upsertRelation(papiClient: PapiClient, relation: Relation) 
{
	return papiClient.post('/addons/data/relations', relation);
}