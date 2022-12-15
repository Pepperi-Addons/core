import '@pepperi-addons/cpi-node';
import { BaseCoreService, CatalogsAndAccountsCoreService, IPapiService, UsersCoreService } from 'core-shared';
import { Request } from '@pepperi-addons/debug-server';import BaseCpiSideApiService from './baseCpiSideApiService';
import { IClientApiService } from './iClientApiService';
import ClientApiService from './clientApiService';
import CatalogsCpiSideApiService from './catalogsCpiSideApiService';
import AccountsCpiSideApiService from './accountsCpiSideApiService';


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
	const supportedResources = ['catalogs', 'accounts'];

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
		const resourceService = getCoreService(req);
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
		const resourceService = getCoreService(req);
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
		const resourceService = getCoreService(req);
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
		const genericResourceService = getCoreService(req);
		const createdResource = await genericResourceService.upsertResource();

		res.json(createdResource);
	}
	catch (err) 
	{
		console.log(err);
		next(err)
	}
});

function getCoreService(request: Request): BaseCoreService
{
	let core: BaseCoreService | undefined = undefined;
	const papiService: IPapiService = getPapiService(request);

	const resourceName = request.query?.resource_name ?? request.body.Resource;

	switch(request.query?.resource_name)
	{
	case "users":
	{
		core = new UsersCoreService(resourceName, request, papiService);
		break;
	}
	case "catalogs":
	case "accounts":
	{
		core = new CatalogsAndAccountsCoreService(resourceName, request, papiService);
		break;
	}
	default:
	{
		core = new BaseCoreService(resourceName, request, papiService);
	}
	}

	return core;
}

function getPapiService(request: Request) : IPapiService
{
	const iClientApi: IClientApiService = new ClientApiService();

	let papiService: IPapiService;

	switch(request.query?.resource_name)
	{
	case "catalogs":
	{
		papiService = new CatalogsCpiSideApiService(request.query.addon_uuid, iClientApi);
		break;
	}
	case "accounts":
	{
		papiService = new AccountsCpiSideApiService(request.query.addon_uuid, iClientApi);
		break;
	}
	default:
	{
		papiService = new BaseCpiSideApiService(request.query.addon_uuid, iClientApi);
	}
	}

	return papiService;
}