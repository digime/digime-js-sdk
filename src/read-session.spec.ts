/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as SDK from ".";
import { SAMPLE_TOKEN, TEST_BASE_URL, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";
import { ServerError, TypeValidationError } from "./errors";
import { ReadSessionResponse } from "./read-session";
import { ContractDetails } from "./types/common";
import { sign } from "jsonwebtoken";

/* eslint-disable @typescript-eslint/no-explicit-any */

const digime = SDK.init({
    applicationId: "test-application-id",
});

const customSDK = SDK.init({
    applicationId: "test-application-id",
    baseUrl: TEST_CUSTOM_BASE_URL,
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

const CONTRACT_DETAILS: ContractDetails = {
    contractId: "test-contract-id",
    redirectUri: "test-redirect-url",
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", digime, TEST_BASE_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL],
])("%s", (_title, sdk, baseUrl) => {
    describe("Throws TypeValidationError when contractDetails is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (contractDetails: any) => {
                const promise = sdk.readSession({
                    contractDetails,
                    userAccessToken: SAMPLE_TOKEN,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when contractId is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (contractId: any) => {
                const contractDetails = {
                    ...CONTRACT_DETAILS,
                    contractId,
                };

                const promise = sdk.readSession({
                    contractDetails,
                    userAccessToken: SAMPLE_TOKEN,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when redirectUri is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (redirectUri: any) => {
                const contractDetails = {
                    ...CONTRACT_DETAILS,
                    redirectUri,
                };

                const promise = sdk.readSession({
                    contractDetails,
                    userAccessToken: SAMPLE_TOKEN,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when privateKey is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (privateKey: any) => {
                const contractDetails = {
                    ...CONTRACT_DETAILS,
                    privateKey,
                };

                const promise = sdk.readSession({
                    contractDetails,
                    userAccessToken: SAMPLE_TOKEN,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when scope is ", () => {
        it.each([true, false, null, [], 0, NaN, "", () => null, Symbol("test")])("%p", async (scope: any) => {
            const promise = sdk.readSession({
                contractDetails: CONTRACT_DETAILS,
                userAccessToken: SAMPLE_TOKEN,
                scope,
            });

            return expect(promise).rejects.toThrowError(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when scope is a malformed object", () => {
        it.each([
            {
                timeRanges: ["notAnObject"],
            },
            {
                serviceGroups: [{ noIdSet: 18 }],
            },
        ])("%p", async (scope: any) => {
            const promise = sdk.readSession({
                contractDetails: CONTRACT_DETAILS,
                userAccessToken: SAMPLE_TOKEN,
                scope,
            });

            return expect(promise).rejects.toThrowError(TypeValidationError);
        });
    });

    describe(`Calling readSession with a valid auth token`, () => {
        let response: ReadSessionResponse;
        const dataTriggerCall = jest.fn();
        const session = {
            expiry: 9999,
            key: "session-key",
        };

        beforeAll(async () => {
            const scope = nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}permission-access/trigger`)
                .reply(202, {
                    session,
                });
            // Request event only fires when the scope target has been hit
            scope.on("request", dataTriggerCall);

            response = await sdk.readSession({
                contractDetails: CONTRACT_DETAILS,
                userAccessToken: SAMPLE_TOKEN,
            });
        });

        it("returns the session returned from digi.me", () => {
            expect(response.session).toEqual(session);
        });

        it("returns the same user access token", () => {
            expect(response.userAccessToken).toEqual(SAMPLE_TOKEN);
        });

        it("triggers the data trigger query", () => {
            expect(dataTriggerCall).toHaveBeenCalled();
        });
    });

    describe(`Calling readSession with an invalid auth token`, () => {
        let response: ReadSessionResponse;
        const dataTriggerCall = jest.fn();
        const refreshCall = jest.fn();

        const session = {
            expiry: 9999,
            key: "session-key",
        };

        beforeAll(async () => {
            const jwt: string = sign(
                {
                    access_token: {
                        expires_on: 1000000,
                        value: "refreshed-sample-token",
                    },
                    refresh_token: {
                        expires_on: 1000000,
                        value: "refreshed-refresh-token",
                    },
                },
                testKeyPair.exportKey("pkcs1-private-pem").toString(),
                {
                    algorithm: "PS512",
                    noTimestamp: true,
                    header: {
                        alg: "PS512",
                        jku: `${baseUrl}test-jku-url`,
                        kid: "test-kid",
                    },
                }
            );

            const triggerScope = nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}permission-access/trigger`)
                .reply(401, {
                    error: {
                        code: "InvalidToken",
                        message: "The token (${tokenType}) is invalid",
                    },
                })
                .post(`${new URL(baseUrl).pathname}permission-access/trigger`)
                .reply(202, {
                    session,
                });

            const refreshScope = nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}oauth/token`)
                .reply(201, {
                    token: jwt,
                })
                .get(`${new URL(baseUrl).pathname}test-jku-url`)
                .reply(201, {
                    keys: [
                        {
                            kid: "test-kid",
                            pem: testKeyPair.exportKey("pkcs1-public"),
                        },
                    ],
                })
                .post(`${new URL(baseUrl).pathname}permission-access/trigger`)
                .reply(202);

            // Request event only fires when the scope target has been hit
            triggerScope.on("request", dataTriggerCall);
            refreshScope.on("request", refreshCall);

            response = await sdk.readSession({
                contractDetails: CONTRACT_DETAILS,
                userAccessToken: SAMPLE_TOKEN,
            });
        });

        it("triggers the data trigger query", () => {
            expect(dataTriggerCall).toHaveBeenCalled();
        });

        it("triggers the refresh token query", () => {
            expect(refreshCall).toHaveBeenCalled();
        });

        it("returns the refreshed user access token", () => {
            expect(response.userAccessToken).toEqual({
                accessToken: {
                    expiry: 1000000,
                    value: "refreshed-sample-token",
                },
                refreshToken: {
                    expiry: 1000000,
                    value: "refreshed-refresh-token",
                },
            });
        });

        it("returns the session returned from digi.me", () => {
            expect(response.session).toEqual(session);
        });
    });

    describe(`readSession throws error when access token refresh fails`, () => {
        let error: ServerError;

        beforeAll(async () => {
            nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}permission-access/trigger`)
                .reply(401)
                .post(`${new URL(baseUrl).pathname}oauth/token`)
                .reply(401, {
                    error: {
                        code: "InvalidToken",
                        message: "The token (${tokenType}) is invalid",
                    },
                });

            try {
                await sdk.readSession({
                    contractDetails: CONTRACT_DETAILS,
                    userAccessToken: SAMPLE_TOKEN,
                });
            } catch (e) {
                error = e;
            }
        });

        it("expect error thrown to be Server error with the right message", () => {
            expect(error).toBeInstanceOf(ServerError);
            expect(error.message).toEqual("The token (${tokenType}) is invalid");
            expect(error.error).toEqual({
                code: "InvalidToken",
                message: "The token (${tokenType}) is invalid",
            });
        });
    });
});
