import IResolver from "./iResolver";
import { Request } from "@pepperi-addons/debug-server"
import ACatalogsResolver from "./aCatalogsResolver";

export default class CatalogsGetQueryResolver extends ACatalogsResolver implements IResolver
{
    resolve(objects: Array<Request>): Array<Request> 
    {
        return this.applyFunctionToAllObjects(this.objectManipulator, objects);
    }

    private objectManipulator(request: Request): void
    {
        if(request.query.where)
        {
            request.query.where = super.replaceCreationDateWithCreationDateTime(request.query.where);
        }

        if(request.query.fields)
        {
            const fieldsArray = request.query.fields.split(',');
            for (const index in fieldsArray) {
                if(fieldsArray[index] === "CreationDate")
                {
                    fieldsArray[index] = "CreationDateTime";
                }
            }
            request.query.fields = fieldsArray.join();
        }

        if(request.query.order_by)
        {
            request.query.order_by = super.replaceCreationDateWithCreationDateTime(request.query.order_by);
        }
    }
}
