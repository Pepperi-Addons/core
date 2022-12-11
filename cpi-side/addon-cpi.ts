import '@pepperi-addons/cpi-node';
import { BaseCoreService, CatalogsCoreService, IPapiService, UsersCoreService } from 'core-shared';
import { Request } from '@pepperi-addons/debug-server';import ClientApiService from './clientApiService';


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
	const supportedResources = ['catalogs'];

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
	{
		core = new CatalogsCoreService(resourceName, request, papiService);
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
	const papiService: IPapiService = new ClientApiService(request.query.addon_uuid);

	return papiService;
}