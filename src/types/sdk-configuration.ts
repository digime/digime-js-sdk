/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { RetryOptionsCodec, RetryOptions } from "./retry-options";
import { codecAssertion, CodecAssertion } from "../utils/codec-assertion";

export interface SDKConfiguration {
    /**
     * Your customised application ID from digi.me
     */
    applicationId: string;

    /**
     * Root URL for the digi.me API. Default is https://api.digi.me/v1.6/
     */
    baseUrl?: string;

    /**
     * Root URL for the digi.me web onboard. Default is https://api.digi.me/apps/saas/
     */
    onboardUrl?: string;

    /**
     * Options to specify retry logic for failed API calls. By default we retry any failed API calls five times.
     * See {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/got/index.d.ts#L267 | here} for all possible options
     */
    retryOptions?: RetryOptions;
}

export const SDKConfigurationCodec: t.Type<SDKConfiguration> = t.intersection([
    t.type({
        applicationId: t.string,
    }),
    t.partial({
        baseUrl: t.string,
        onboardUrl: t.string,
        retryOptions: RetryOptionsCodec,
    }),
]);

export const isSDKConfiguration = SDKConfigurationCodec.is;

export const assertIsSDKConfiguration: CodecAssertion<SDKConfiguration> = codecAssertion(SDKConfigurationCodec);
