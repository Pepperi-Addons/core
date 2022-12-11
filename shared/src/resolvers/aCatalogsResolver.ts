import IResolver from "./iResolver";
import AResolver from "./aResolver";
import { Request } from "@pepperi-addons/debug-server"

export default abstract class ACatalogsResolver extends AResolver implements IResolver
{
    abstract resolve(objects: Array<Request>): Array<Request>;

    protected replaceCreationDateWithCreationDateTime(str: string): string
    {
    	const regex = /(^|\s+)(?!(CreationDate([a-zA-Z0-9])+))CreationDate/g;
    	return str.replace(regex, 'CreationDateTime');
    }
}
