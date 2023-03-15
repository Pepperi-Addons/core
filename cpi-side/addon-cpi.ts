import '@pepperi-addons/cpi-node';
import { BaseCoreService, CatalogsAndAccountsCoreService, IPapiService, UsersCoreService } from 'core-shared';
import { Request } from '@pepperi-addons/debug-server';import BaseCpiSideApiService from './baseCpiSideApiService';
import { IClientApiService } from './iClientApiService';
import ClientApiService from './clientApiService';
import CatalogsAndUsersCpiSideApiService from './catalogsAndUsersCpiSideApiService';
import AccountsCpiSideApiService from './accountsCpiSideApiService';
import { AddonDataScheme } from '@pepperi-addons/papi-sdk';
import NoCreationDateCpiSideApiService from './noCreationDateCpiSideApiService';


export const router = Router();

export async function load(configuration: any) 
{
}

router.use('/:resourceName', async (req, res, next) => 
{
	try
	{
		validateResourceSupportedInCpiSide(req.params.resourceName);
	} 
	catch (err)
	{
		console.log(err);
		next(err)
	}

	req.query.resource_name = req.params.resourceName;
	next();
});

function validateResourceSupportedInCpiSide(resourceName: string)
{
	const supportedResources = ['catalogs', 'accounts', 'users', 'items'];

	if(!supportedResources.includes(resourceName))
	{
		throw new Error();
	}
}

router.get('/:resourceName/key/:key', async (req, res, next) => 
{
	req.query.key = req.params.key;

	try 
	{
		const resourceService = await getCoreService(req);
		const resource = await resourceService.getResourceByKey();

		res.json(resource);
	}
	catch (err) 
	{
		console.log(err);
		next(err)
	}
});

router.get('/:resourceName/unique/:fieldID/:fieldValue', async (req, res, next) => 
{
	req.query.field_id = req.params.fieldID;
	req.query.value = req.params.fieldValue;

	try 
	{
		const resourceService = await getCoreService(req);
		const resource = await resourceService.getResourceByUniqueField();

		res.json(resource);
	}
	catch (err) 
	{
		console.log(err);
		next(err)
	}
});


router.post('/:resourceName/search', async (req, res, next) => 
{
	try 
	{
		const resourceService = await getCoreService(req);
		const resource = await resourceService.search();

		res.json(resource);
	}
	catch (err) 
	{
		console.log(err);
		next(err)
	}
});

router.post('/:resourceName', async (req, res, next) => 
{
	try 
	{
		const genericResourceService = await getCoreService(req);
		const createdResource = await genericResourceService.upsertResource();

		res.json(createdResource);
	}
	catch (err) 
	{
		console.log(err);
		next(err)
	}
});

async function getCoreService(request: Request): Promise<BaseCoreService>
{
	let core: BaseCoreService;
	const papiService: IPapiService = getPapiService(request);
	const resourceSchema: AddonDataScheme = await getResourceSchema(request);

	switch(request.query?.resource_name)
	{
	case "users":
	case "employees":
	{
		core = new UsersCoreService(resourceSchema, request, papiService);
		break;
	}
	case "catalogs":
	case "accounts":
	{
		core = new CatalogsAndAccountsCoreService(resourceSchema, request, papiService);
		break;
	}
	default:
	{
		core = new BaseCoreService(resourceSchema, request, papiService);
	}
	}

	return core;
}

async function getResourceSchema(request: Request): Promise<AddonDataScheme>
{
	const shouldGetBaseApiService = true;
	const baseCpiSideApiService = getPapiService(request, shouldGetBaseApiService);
	return await baseCpiSideApiService.getResourceSchema();
}

function getPapiService(request: Request, getBaseApiService = false) : IPapiService
{
	const iClientApi: IClientApiService = new ClientApiService();

	let papiService: IPapiService;

	if(getBaseApiService)
	{
		papiService = new BaseCpiSideApiService(request.query?.resource_name, request.query.addon_uuid, iClientApi); 
	}
	else
	{
		switch(request.query?.resource_name)
		{
		case "catalogs":
		case "users":
		case "employees":
		{
			papiService = new CatalogsAndUsersCpiSideApiService(request.query?.resource_name, request.query.addon_uuid, iClientApi);
			break;
		}
		case "accounts":
		{
			papiService = new AccountsCpiSideApiService(request.query.addon_uuid, iClientApi);
			break;
		}
		case "items":
		{
			papiService = new NoCreationDateCpiSideApiService(request.query?.resource_name, request.query.addon_uuid, iClientApi);
			break;
		}
		default:
		{
			papiService = new BaseCpiSideApiService(request.query?.resource_name, request.query.addon_uuid, iClientApi);
		}
		}	
	}
	
	return papiService;
}
