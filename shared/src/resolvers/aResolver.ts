import IResolver from "./iResolver";
import cloneDeep from 'lodash.clonedeep'

export default abstract class AResolver implements IResolver
{
    abstract resolve(objs: any[]): any[];

    protected applyFunctionToAllObjects(objectManipulator: (object: any) => void, objects: Array<any>) : Array<any>
    {
    	const resolvedObjects = new Array<any>();
        
    	for (const obj of objects) 
    	{
    		const objCopy = cloneDeep(obj);

    		objectManipulator(objCopy);

    		resolvedObjects.push(objCopy);
    	}

    	return resolvedObjects;
    }
}
