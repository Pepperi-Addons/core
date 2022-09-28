// import { PapiClientOptions } from '@pepperi-addons/papi-sdk';

import { Client } from "@pepperi-addons/debug-server/dist";

export const mockClient : Client/*: PapiClientOptions*/ = {
    AddonUUID: 'NotUsed',
    BaseURL: 'NotUsed',
    AddonSecretKey: 'NotUsed',
    ActionUUID: 'NotUsed',
    AssetsBaseUrl: 'NotUsed',
    Retry: () => { return 'NotUsed' },
    // Token is fake, only has distributor UUID which is mendatory for constructors
    OAuthAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXBwZXJpLmRpc3RyaWJ1dG9ydXVpZCI6IjEyMzQ1Njc4OTAifQ.JcRiubA-ZGJsCJfDfU8eQqyZq8FAULgeLbXfm3-aQhs',
    ValidatePermission(policyName) {
        // return true;
        return Promise.resolve();
    }
}