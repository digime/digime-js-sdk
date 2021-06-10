/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { net } from "./net";
import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import get from "lodash.get";
import { assertIsSession, Session } from "./types/api/session";
import { UserAccessToken } from "./types/user-access-token";
import { refreshToken } from "./refresh-token";
import { SDKConfiguration } from "./types/dme-sdk-configuration";
import { CAScope } from "./types/common";

interface ReadSessionOptions {
    userAccessToken: UserAccessToken;
    scope?: CAScope;
}

interface ReadSessionResponse {
    session: Session;
    updatedAccessToken?: UserAccessToken;
}

const readSession = async (
    options: ReadSessionOptions,
    sdkConfig: SDKConfiguration
): Promise<ReadSessionResponse> => {

    const { userAccessToken, scope } = options

    let session: Session;

    // 1. We have an access token, try and trigger a data request
    try {
        session = await triggerDataQuery({
            accessToken: userAccessToken.accessToken.value,
            scope
        },  sdkConfig);

        return { session };
    } catch (error) { /* Invalid tokens */ }

    const newTokens: UserAccessToken = await refreshToken( {userAccessToken}, sdkConfig );

    session = await triggerDataQuery({
        accessToken: newTokens.accessToken.value,
        scope
    }, sdkConfig);

    return {
        session,
        updatedAccessToken: newTokens,
    };
};

interface TriggerDataQueryProps {
    accessToken: string,
    scope?: CAScope;
}

const triggerDataQuery = async (
    options: TriggerDataQueryProps,
    sdkConfig: SDKConfiguration
): Promise<Session> => {

    const { accessToken, scope } = options;
    const { applicationId, contractId, privateKey, redirectUri } = sdkConfig.authorizationConfig;
    const jwt: string = sign(
        {
            access_token: accessToken,
            client_id: `${applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const url = `${sdkConfig.baseUrl}permission-access/trigger`;

    const response = await net.post(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json", // NOTE: we might not need this
        },
        json: {
            scope
        },
        responseType: "json",
    });

    const session: unknown = get(response, "body.session");
    assertIsSession(session);

    return session;
};

export {
    readSession,
    ReadSessionOptions,
    ReadSessionResponse
}