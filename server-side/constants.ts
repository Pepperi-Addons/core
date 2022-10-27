export type ResourceField = {
    "InternalID": number,
    "FieldID": string,
    "Label": string,
    "IsUserDefinedField": boolean,
    "UIType": {
        "ID": number,
        "Name": string
    },
    "Type": string,
    "Format": string,
    "CreationDateTime": string,
    "ModificationDateTime": string,
    "Hidden": boolean,
    [any: string]: any
};

export type PapiBatchResponse = [
    { InternalID: number, UUID: string, ExternalID: string, Status: 'Update' | 'Insert' | 'Ignore' | 'Error', Message: string, URI: string }
]

export type ResourceFields = Array<ResourceField>;

export const RESOURCE_TYPES = ['accounts', 'items', 'users', 'account_users'];
export const UNIQUE_FIELDS = ['InternalID', 'UUID', 'ExternalID', 'Key'];

export const DIMX_ADDON_UUID = '44c97115-6d14-4626-91dc-83f176e9a0fc';
