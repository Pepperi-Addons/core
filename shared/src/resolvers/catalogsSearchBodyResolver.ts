import IResolver from './iResolver';
import { Request } from '@pepperi-addons/debug-server'
import ACatalogsResolver from './aCatalogsResolver';

export default class CatalogsSearchBodyResolver extends ACatalogsResolver implements IResolver
{
	resolve(objects: Array<Request>): Array<Request> 
	{
		return this.applyFunctionToAllObjects(this.objectManipulator, objects);
	}

	private objectManipulator(request: Request): void
	{
    
		// Handle Search body
		if(request.body.Where)
		{
			request.body.Where = super.replaceCreationDateWithCreationDateTime(request.body.Where);
		}

		if(request.body.Fields && Array.isArray(request.body.Fields))
		{
			for (const index in request.body.Fields) 
			{
				if(request.body.Fields[index] === 'CreationDate')
				{
					request.body.Fields[index] = 'CreationDateTime';
				}
			}
		}
	}
}
