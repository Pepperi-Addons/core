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

export type ResourceFields = Array<ResourceField>;

export const RESOURCE_TYPES = ['accounts', 'items', 'users'];