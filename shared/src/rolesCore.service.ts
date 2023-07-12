import { BaseCoreService } from './baseCore.service';

export class RolesCoreService extends BaseCoreService
{
	protected override get uniqueFields(): string[]
	{
		return ['InternalID', 'Key'];
	}

	protected override get papiKeyPropertyName(): string
	{
		return 'Name';
	}

	protected override filterHiddenObjects(where: string | undefined, includeDeleted: boolean): string | undefined
	{
		// Since roles doesn't Hidden property, we can't filter out hidden objects.
		// Simply return the where clause as is.

		return where;
	}
}
