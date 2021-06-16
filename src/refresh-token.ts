/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { handleServerResponse, net } from "./net";
import get from "lodash.get";
import { UserAccessToken } from "./types/user-access-token";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails } from "./types/common";

export interface RefreshTokenOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
}

const refreshToken = async (options: RefreshTokenOptions, sdkConfig: SDKConfiguration): Promise<UserAccessToken> => {
    const { contractDetails, userAccessToken } = options;
    const { contractId, privateKey, redirectUri } = contractDetails;
    const jwt: string = sign(
        {
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            grant_type: "refresh_token",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            refresh_token: userAccessToken.refreshToken.value,
            timestamp: Date.now(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
    );

    const url = `${sdkConfig.baseUrl}oauth/token`;

    try {
        const response = await net.post(url, {
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json", // NOTE: we might not need this
            },
            responseType: "json",
        });

        const payload = await getPayloadFromToken(get(response.body, "token"), sdkConfig);
        return {
            accessToken: {
                value: get(payload, ["access_token", "value"]),
                expiry: get(payload, ["access_token", "expires_on"]),
            },
            refreshToken: {
                value: get(payload, ["refresh_token", "value"]),
                expiry: get(payload, ["refresh_token", "expires_on"]),
            },
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { refreshToken };
