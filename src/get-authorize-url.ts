/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { URL, URLSearchParams } from "url";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { TypeValidationError } from "./errors";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import * as t from "io-ts";
import base64url from "base64url";
import { getRandomAlphaNumeric, hashSha256 } from "./crypto";
import { sign } from "jsonwebtoken";
import { handleServerResponse, net } from "./net";
import get from "lodash.get";
import { SDKConfiguration } from "./types/sdk-configuration";
import { CAScope, ContractDetails, ContractDetailsCodec } from "./types/common";
import { isNonEmptyString } from "./utils/basic-utils";
import sdkVersion from "./sdk-version";

export interface GetAuthorizeUrlOptions {
    /**
     * Any contract related details here.
     */
    contractDetails: ContractDetails;

    /**
     * A URL to call if an error occurs. The redirect URL in contractDetails will be called if the authorization was successful.
     */
    callback: string;

    /**
     * Onboard a service while authorizing.
     */
    serviceId?: number;

    /**
     * User access token you may already have for this user from this or from another contract.
     */
    userAccessToken?: UserAccessToken;

    /**
     * For read contracts, you can limit to scope of data to query.
     */
    scope?: CAScope;

    /**
     * Any extra data you want to be passed back after a authorization flow.
     */
    state?: string;
}

export const GetAuthorizeUrlOptionsCodec: t.Type<GetAuthorizeUrlOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        callback: t.string,
    }),
    t.partial({
        serviceId: t.number,
        userAccessToken: UserAccessTokenCodec,
        state: t.string,
    }),
]);

export interface GetAuthorizeUrlResponse {
    /**
     * The URL to redirect users to to trigger the authorization process.
     */
    url: string;

    /**
     * A string that will be required when exchanging for an user access token
     */
    codeVerifier: string;

    /**
     * A session that can be used to read data. Can only be used after a successful authorization
     */
    session: Session;
}

/**
 * getAuthorizeUrl()
 * A function to call to kick start the authorization process.
 */
const getAuthorizeUrl = async (
    props: GetAuthorizeUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<GetAuthorizeUrlResponse> => {
    if (!GetAuthorizeUrlOptionsCodec.is(props) || !isNonEmptyString(props.callback)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains the properties contractDetails and callback."
        );
    }

    const { code, codeVerifier, session } = await _authorize(props, sdkConfig);
    const { serviceId } = props;

    const result: URL = new URL(`${sdkConfig.onboardUrl}authorize`);
    result.search = new URLSearchParams({
        code,
        callback: props.callback,
        ...(serviceId && { service: serviceId.toString() }),
    }).toString();

    return {
        url: result.toString(),
        codeVerifier,
        session,
    };
};

interface AuthorizeResponse {
    codeVerifier: string;
    code: string;
    session: Session;
}

const _authorize = async (
    { contractDetails, state, userAccessToken }: GetAuthorizeUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<AuthorizeResponse> => {
    const { contractId, privateKey, redirectUri } = contractDetails;

    const codeVerifier: string = base64url(getRandomAlphaNumeric(32));
    const jwt: string = sign(
        {
            access_token: userAccessToken?.accessToken.value,
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            code_challenge: base64url(hashSha256(codeVerifier)),
            code_challenge_method: "S256",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            response_mode: "query",
            response_type: "code",
            state,
            timestamp: Date.now(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
    );

    try {
        const { body } = await net.post(`${sdkConfig.baseUrl}oauth/authorize`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            json: {
                agent: {
                    sdk: {
                        name: "js",
                        version: sdkVersion,
                        meta: {
                            node: process.version,
                        },
                    },
                },
            },
            responseType: "json",
            retry: sdkConfig.retryOptions,
        });

        const payload = await getPayloadFromToken(get(body, "token"), sdkConfig);
        return {
            codeVerifier,
            code: `${get(payload, ["preauthorization_code"])}`,
            session: get(body, "session"),
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { getAuthorizeUrl };
