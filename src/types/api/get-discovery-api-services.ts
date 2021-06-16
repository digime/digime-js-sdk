/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

interface DiscoveryService {
    id: number;
    name: string;
    serviceGroups: Array<{ id: number }>;
}

export interface DiscoveryServiceCountry {
    id: number;
    name: string;
    code: string;
}

export interface DiscoveryServiceGroup {
    id: number;
    name: string;
}

export interface DiscoveryApiServicesData {
    countries: DiscoveryServiceCountry[];
    serviceGroups: DiscoveryServiceGroup[];
    services: DiscoveryService[];
}

export const DiscoveryServiceCodec: t.Type<DiscoveryService> = t.strict({
    id: t.number,
    name: t.string,
    serviceGroups: t.array(
        t.strict({
            id: t.number,
        })
    ),
});

export const DiscoveryServiceCountryCodec: t.Type<DiscoveryServiceCountry> = t.strict({
    code: t.string,
    id: t.number,
    name: t.string,
});

export const DiscoverySourceGroupCodec: t.Type<DiscoveryServiceGroup> = t.strict({
    id: t.number,
    name: t.string,
});

export const DiscoveryApiServicesDataCodec: t.Type<DiscoveryApiServicesData> = t.strict({
    countries: t.array(DiscoveryServiceCountryCodec),
    serviceGroups: t.array(DiscoverySourceGroupCodec),
    services: t.array(DiscoveryServiceCodec),
});

export const DiscoveryApiServicesDataResponseCodec: t.Type<DiscoveryApiServicesDataResponse> = t.strict({
    data: DiscoveryApiServicesDataCodec,
});

export interface DiscoveryApiServicesDataResponse {
    data: DiscoveryApiServicesData;
}

export const assertIsDiscoveryApiServicesData: CodecAssertion<DiscoveryApiServicesDataResponse> = codecAssertion(
    DiscoveryApiServicesDataResponseCodec
);
