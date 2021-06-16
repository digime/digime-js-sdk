/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

/**
 * @module Errors
 */

import { ApiError } from "./types/api/api-error-response";

// tslint:disable:max-classes-per-file

/**
 * Generic Error thrown by the SDK.
 */
class DigiMeSDKError extends Error {
    public name = "DigiMeSDKError";

    constructor(message: Error["message"]) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Thrown when an error response is received from digi.me API.
 * Error field will be populated with the response from digi.me.
 */
class ServerError extends DigiMeSDKError {
    public name = "DigiMeServerError";
    public error?: ApiError;

    constructor(message: Error["message"], error?: ApiError) {
        super(message);
        this.error = error;
    }
}

/**
 * Thrown if the current SDK or its version is invalid.
 */
class SDKInvalidError extends ServerError {
    public name = "SDKInvalidError";
}

/**
 * Thrown if the parameter passed in fails type check.
 */
class TypeValidationError extends DigiMeSDKError {
    public name = "TypeValidationError";
}

/**
 * Thrown if there was an error decrypting a file.
 */
class FileDecryptionError extends DigiMeSDKError {
    public name = "FileDecryptionError";
}

/**
 * Thrown if there's a mismatch of certificates when communicating with our production server.
 */
class ServerIdentityError extends DigiMeSDKError {
    public name = "ServerIdentityError";
}

export { DigiMeSDKError, SDKInvalidError, TypeValidationError, FileDecryptionError, ServerIdentityError, ServerError };
