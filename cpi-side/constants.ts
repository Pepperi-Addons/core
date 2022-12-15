export type TypeIdentifier = {
    Name: string;
} | {
    InternalID: number;
};

export type CreateResourceParams = {
    type?: TypeIdentifier;
    object?: {
        [key: string]: any;
    };
}