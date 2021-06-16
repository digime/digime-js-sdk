/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { net } from "./net";
import { assertIsDiscoveryApiServicesData, DiscoveryServiceCountry } from "./types/api/get-discovery-api-services";
import { SDKConfiguration } from "./types/sdk-configuration";
import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import omit from "lodash.omit";

export interface GetAvailableServicesResponse {
    countries: DiscoveryServiceCountry[];
    serviceGroups: DiscoveryServiceGroup[];
    services: DiscoveryService[];
}

export interface DiscoveryService {
    id: number;
    name: string;
    serviceGroups: Array<{ id: number }>;
}

interface DiscoveryServiceGroup {
    id: number;
    name: string;
}

const getAvailableServices = async (
    sdkConfig: SDKConfiguration,
    contractId?: string
): Promise<GetAvailableServicesResponse> => {
    if (contractId !== undefined && !isNonEmptyString(contractId)) {
        throw new TypeValidationError("Contract Id must be a string.");
    }

    const response = await net
        .get(`${sdkConfig.baseUrl}discovery/services`, {
            headers: { contractId },
        })
        .json();

    assertIsDiscoveryApiServicesData(response);

    return {
        ...response.data,
        services: response.data.services.map((service) => formatService(service)),
    };
};

const formatService = (service: DiscoveryService): DiscoveryService => {
    // Remove redundant fields that are not relevant to externals
    return omit(service, [
        "authorisation",
        "platform",
        "providerId",
        "reference",
        "serviceId",
        "sync",
    ]) as DiscoveryService;
};

export { getAvailableServices };
