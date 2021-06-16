/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import FormData from "form-data";
import NodeRSA from "node-rsa";
import { encryptData, getRandomAlphaNumeric, getRandomHex } from "./crypto";
import { sign } from "jsonwebtoken";
import { TypeValidationError } from "./errors";
import { net, handleServerResponse } from "./net";
import { areNonEmptyStrings } from "./utils/basic-utils";
import { assertIsPushDataStatusResponse, WriteDataAPIResponse } from "./types/api/postbox-response";
import { assertIsPushedFileMeta, PushedFileMetaCodec } from "./types/postbox";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { refreshToken } from "./refresh-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";

interface WriteOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
    data: FileMeta;
    publicKey: string;
    postboxId: string;
}

export const WriteOptionsCodec: t.Type<WriteOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    userAccessToken: UserAccessTokenCodec,
    postboxId: t.string,
    publicKey: t.string,
    data: PushedFileMetaCodec,
});

export interface FileMeta {
    fileData: Buffer;
    fileName: string;
    fileDescriptor: {
        mimeType: string;
        accounts: Array<{
            accountId: string;
        }>;
        reference?: string[];
        tags?: string[];
    };
}

interface WriteResponse extends WriteDataAPIResponse {
    userAccessToken: UserAccessToken;
}

const write = async (options: WriteOptions, sdkConfig: SDKConfiguration): Promise<WriteResponse> => {
    if (!WriteOptionsCodec.is(options)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains the properties contractDetails, userAccessToken, postboxId, publicKey and data."
        );
    }

    const { contractDetails, userAccessToken, data, publicKey, postboxId } = options;

    if (!areNonEmptyStrings([publicKey, postboxId])) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError(
            "pushDataToPostbox requires the following properties to be set: postboxId, publicKey, sessionKey"
        );
    }

    assertIsPushedFileMeta(data);

    // We have an access token, try and trigger a push request
    const result = await triggerPush(
        {
            accessToken: userAccessToken?.accessToken.value,
            contractDetails,
            data,
            publicKey,
            postboxId,
        },
        sdkConfig
    );

    // If an access token was provided and the status is pending, it means the access token may have expired.
    if (result.status === "pending") {
        const newTokens: UserAccessToken = await refreshToken({ contractDetails, userAccessToken }, sdkConfig);
        const secondPushResult = await triggerPush(
            {
                accessToken: newTokens.accessToken.value,
                contractDetails,
                data,
                publicKey,
                postboxId,
            },
            sdkConfig
        );

        return {
            ...secondPushResult,
            userAccessToken: newTokens,
        };
    }

    return {
        ...result,
        userAccessToken,
    };
};

interface TriggerPushProps extends Omit<WriteOptions, "userAccessToken"> {
    accessToken: string | undefined;
}

const triggerPush = async (options: TriggerPushProps, sdkConfig: SDKConfiguration): Promise<WriteDataAPIResponse> => {
    const { accessToken, contractDetails, postboxId, publicKey, data } = options;
    const { contractId, privateKey, redirectUri } = contractDetails;

    const key: string = getRandomHex(64);
    const rsa: NodeRSA = new NodeRSA(publicKey, "pkcs1-public");
    const encryptedKey: Buffer = rsa.encrypt(Buffer.from(key, "hex"));
    const ivString: string = getRandomHex(32);
    const iv: Buffer = Buffer.from(ivString, "hex");
    const encryptedData: Buffer = encryptData(iv, Buffer.from(key, "hex"), data.fileData);
    const encryptedMeta: Buffer = encryptData(
        iv,
        Buffer.from(key, "hex"),
        Buffer.from(JSON.stringify(data.fileDescriptor), "utf8")
    );
    const url = `${sdkConfig.baseUrl}permission-access/postbox/${postboxId}`;
    const form: FormData = new FormData();
    form.append("file", encryptedData, data.fileName);

    const jwt: string = sign(
        {
            ...(accessToken && { access_token: accessToken }),
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            iv: ivString,
            metadata: encryptedMeta.toString("base64"),
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            symmetrical_key: encryptedKey.toString("base64"),
            timestamp: Date.now(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
    );

    try {
        const { body } = await net.post(url, {
            headers: {
                contentType: "multipart/form-data",
                Authorization: `Bearer ${jwt}`,
            },
            body: form,
            retry: sdkConfig.retryOptions,
            responseType: "json",
        });

        assertIsPushDataStatusResponse(body);
        return body;
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { WriteOptions, write, WriteResponse };
