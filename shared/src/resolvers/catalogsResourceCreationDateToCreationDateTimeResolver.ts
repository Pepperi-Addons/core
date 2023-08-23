import IResolver from './iResolver';
import ACatalogsResolver from './aCatalogsResolver';


export default class CatalogsResourceCreationDateToCreationDateTimeResolver extends ACatalogsResolver implements IResolver
{
	resolve(objects: Array<any>): Array<any> 
	{
		return this.applyFunctionToAllObjects(this.objectManipulator, objects);
	}

	private objectManipulator(object: any): void
	{
		if(object.hasOwnProperty('CreationDate'))
		{
			if(!object.hasOwnProperty('CreationDateTime'))
			{
				object.CreationDateTime = object.CreationDate;
			}
			
			delete object.CreationDate;
		}
	}
}
