/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { decode, Secret, verify } from "jsonwebtoken";
import { DigiMeSDKError, TypeValidationError } from "../errors";
import { isPlainObject } from "./basic-utils";
import { handleServerResponse, net } from "../net";
import isString from "lodash.isstring";
import { isJWKS } from "../types/api/jwks";
import { SDKConfiguration } from "../types/sdk-configuration";

const getPayloadFromToken = async (token: string, options: SDKConfiguration): Promise<unknown> => {
    const decodedToken = decode(token, { complete: true });

    if (!isPlainObject(decodedToken)) {
        throw new TypeValidationError("Token passed in to getPayloadFromToken is not an object.");
    }

    const jku: unknown = decodedToken?.header?.jku;
    const kid: unknown = decodedToken?.header?.kid;

    if (!isString(jku) || !isString(kid)) {
        throw new DigiMeSDKError("Unexpected JWT payload in token. No jku or kid found.");
    }

    try {
        const jkuResponse = await net.get(jku, {
            responseType: "json",
            retry: options.retryOptions,
        });

        if (!isJWKS(jkuResponse.body)) {
            throw new DigiMeSDKError("Server returned non-JWKS response");
        }

        const pem = jkuResponse.body.keys.filter((key) => key.kid === kid).map((key) => key.pem);

        // NOTE: Casting to any as pem is unknown and this will throw anyway
        return verify(token, pem[0] as Secret, { algorithms: ["PS512"] });
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { getPayloadFromToken };
