/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { isNonEmptyString } from "../utils/basic-utils";

export interface ContractDetails {
    contractId: string;
    privateKey: string;
    redirectUri: string;
}

export interface CAScope {
    timeRanges?: TimeRange[];
    serviceGroups?: ServiceGroup[];
}

export interface ServiceGroup {
    id: number;
    serviceTypes?: Service[];
}

export interface Service {
    id: number;
    serviceObjectTypes?: ServiceObject[];
}

export interface ServiceObject {
    id: number;
}

export interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}

const ContractDetailsRawCodec: t.Type<ContractDetails> = t.type({
    contractId: t.string,
    privateKey: t.string,
    redirectUri: t.string,
});

export const ContractDetailsCodec = new t.Type<ContractDetails, ContractDetails, unknown>(
    "ContractDetails",
    (input: unknown): input is ContractDetails => isValidContractDetails(input),
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) => (isValidContractDetails(input) ? t.success(input) : t.failure(input, context)),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity
);

const isValidContractDetails = (input: unknown): input is ContractDetails => {
    if (ContractDetailsRawCodec.is(input)) {
        return (
            isNonEmptyString(input.contractId) &&
            isNonEmptyString(input.privateKey) &&
            isNonEmptyString(input.redirectUri)
        );
    }

    return false;
};

export const TimeRangeCodec: t.Type<TimeRange> = t.partial({
    from: t.number,
    last: t.string,
    to: t.number,
});

export const ServiceCodec: t.Type<Service> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        serviceObjectTypes: t.array(
            t.type({
                id: t.number,
            })
        ),
    }),
]);

export const ServiceGroupCodec: t.Type<ServiceGroup> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        serviceTypes: t.array(ServiceCodec),
    }),
]);

export const CAScopeCodec: t.Type<CAScope> = t.partial({
    timeRanges: t.array(TimeRangeCodec),
    serviceGroups: t.array(ServiceGroupCodec),
});
