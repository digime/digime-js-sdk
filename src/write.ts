/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import NodeRSA from "node-rsa";
import { encryptBuffer, getRandomAlphaNumeric, getRandomHex } from "./crypto";
import { sign } from "jsonwebtoken";
import { TypeValidationError } from "./errors";
import { handleServerResponse, net } from "./net";
import { areNonEmptyStrings } from "./utils/basic-utils";
import { assertIsPushDataStatusResponse, WriteDataAPIResponse } from "./types/api/postbox-response";
import { assertIsPushedFileMeta, isReadableStream, PushedFileMeta, PushedFileMetaCodec } from "./types/postbox";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { refreshToken } from "./refresh-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import FormData from "form-data";
import crypto from "crypto";
import * as https from "https";
import urijs from "urijs";

interface WriteOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
    data: PushedFileMeta;
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

interface WriteResponse extends WriteDataAPIResponse {
    userAccessToken: UserAccessToken;
}

const write = async (options: WriteOptions, sdkConfig: SDKConfiguration): Promise<WriteResponse> => {
    const { contractDetails, userAccessToken, data, publicKey, postboxId } = options;

    if (!areNonEmptyStrings([publicKey, postboxId])) {
        throw new TypeValidationError(
            "pushDataToPostbox requires the following properties to be set: postboxId, publicKey, sessionKey"
        );
    }

    if (!ContractDetailsCodec.is(contractDetails)) {
        throw new TypeValidationError("Contract Details failed type validation.");
    }

    if (!UserAccessTokenCodec.is(userAccessToken)) {
        throw new TypeValidationError("User access token failed type validation.");
    }

    if (!PushedFileMetaCodec.is(data)) {
        throw new TypeValidationError(
            "Data object failed type validation. Is fileData, fileName, fileDescriptor set correctly?"
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
    const { data } = options;

    if (Buffer.isBuffer(data.fileData)) {
        return pushByBuffer(options, sdkConfig);
    }

    if (isReadableStream(data.fileData)) {
        return pushByStream(options, sdkConfig);
    }

    throw new TypeError("Unknown type. fileData needs to be a buffer or a readable stream.");
};

const pushByBuffer = async (options: TriggerPushProps, sdkConfig: SDKConfiguration): Promise<WriteDataAPIResponse> => {
    const { accessToken, contractDetails, postboxId, publicKey, data } = options;

    if (!Buffer.isBuffer(data.fileData)) {
        throw new TypeError("fileData needs to be a Buffer");
    }

    const { contractId, privateKey, redirectUri } = contractDetails;

    const key: string = getRandomHex(64);
    const rsa: NodeRSA = new NodeRSA(publicKey, "pkcs1-public");
    const encryptedKey: Buffer = rsa.encrypt(Buffer.from(key, "hex"));
    const ivString: string = getRandomHex(32);
    const iv: Buffer = Buffer.from(ivString, "hex");

    const encryptedData: Buffer = encryptBuffer(iv, Buffer.from(key, "hex"), data.fileData);
    const encryptedMeta: Buffer = encryptBuffer(
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

const pushByStream = async (options: TriggerPushProps, sdkConfig: SDKConfiguration): Promise<WriteDataAPIResponse> => {
    const { accessToken, contractDetails, postboxId, publicKey, data } = options;

    if (!isReadableStream(data.fileData)) {
        throw new TypeError("fileData needs to be a readable stream");
    }

    const { contractId, privateKey, redirectUri } = contractDetails;
    const fileStream: NodeJS.ReadableStream = data.fileData;
    const key: string = getRandomHex(64);
    const rsa: NodeRSA = new NodeRSA(publicKey, "pkcs1-public");
    const encryptedKey: Buffer = rsa.encrypt(Buffer.from(key, "hex"));
    const ivString: string = getRandomHex(32);
    const iv: Buffer = Buffer.from(ivString, "hex");

    const cipher: crypto.Cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), iv);
    const encryptedMeta: Buffer = encryptBuffer(
        iv,
        Buffer.from(key, "hex"),
        Buffer.from(JSON.stringify(data.fileDescriptor), "utf8")
    );

    const requestPath = urijs(`${sdkConfig.baseUrl}permission-access/postbox/${postboxId}`);

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

    const stream = fileStream.pipe(cipher);
    const form: FormData = new FormData();
    form.append("file", stream, {
        filename: data.fileName,
    });

    try {
        return new Promise((resolve, reject) => {
            const requestToSend = https.request({
                method: "post",
                host: requestPath.host(),
                path: requestPath.path(),
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    ...form.getHeaders(),
                },
            });

            form.pipe(requestToSend);
            requestToSend.on("response", (res) => {
                const responseBody: Uint8Array[] = [];
                res.on("data", (chunk) => responseBody.push(chunk));
                res.on("end", () => {
                    const response = Buffer.concat(responseBody);
                    const statusCode: number = res.statusCode || 400;
                    const isOK: boolean = (statusCode >= 200 && statusCode <= 399) || statusCode === 304;

                    try {
                        const parsed = JSON.parse(response.toString());
                        isOK ? resolve(parsed) : reject(parsed);
                    } catch (e) {
                        // Unexpected response, return whole response
                        reject(res);
                    }
                });
            });

            requestToSend.on("error", (e) => {
                reject(e);
            });
        });
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { WriteOptions, write, WriteResponse };
