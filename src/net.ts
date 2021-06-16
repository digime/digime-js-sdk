/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import fs from "fs";
import got, { HTTPError } from "got";
import type { ExtendOptions, Got } from "got";
import memoize from "lodash.memoize";
import path from "path";
import pkgDir from "pkg-dir";
import { PeerCertificate } from "tls";
import { DigiMeSDKError, ServerIdentityError, ServerError, SDKInvalidError } from "./errors";
import { isApiErrorResponse } from "./types/api/api-error-response";
import isString from "lodash.isstring";

type ExtendedGotExtendOptions = ExtendOptions & {
    checkServerIdentity?: (host: string, cert: PeerCertificate) => void;
};

type ExtendedInstancesOrOptions = Array<Got | ExtendedGotExtendOptions>;

type ExtendedGot = typeof got & {
    extend(...instancesOrOptions: ExtendedInstancesOrOptions): Got;
};

interface PinnedHosts {
    [key: string]: PinnedHostCertificate[];
}

type PinnedHostCertificate = Buffer;

const getCertificate = (certPath: string): Buffer => {
    const pem = fs
        .readFileSync(certPath)
        .toString()
        .replace("-----BEGIN CERTIFICATE-----", "")
        .replace("-----END CERTIFICATE-----", "")
        .replace(/\s+|\n\r|\n|\r$/gm, "");

    return Buffer.from(pem, "base64");
};

const getPinningData = memoize(
    (directory: string): PinnedHosts =>
        fs.readdirSync(directory).reduce((acc, hostName) => {
            try {
                return {
                    ...acc,
                    [hostName]: fs
                        .readdirSync(path.resolve(directory, hostName))
                        .map((cert) => getCertificate(path.resolve(directory, hostName, cert))),
                };
            } catch {
                return acc;
            }
        }, {})
);

const packageDir = (): string => {
    const packageDirectory = pkgDir.sync(__dirname);

    if (!packageDirectory) {
        throw new DigiMeSDKError("Unable to determine digime-js-sdk package root");
    }

    return packageDirectory;
};

const defaultPinningDataPath: string = path.resolve(packageDir(), "certificates");

export const net: Got = (got as ExtendedGot).extend({
    checkServerIdentity: (host: string, cert: PeerCertificate) => {
        const pinnedHosts: PinnedHosts = getPinningData(defaultPinningDataPath);
        const pinnedHost: Buffer[] | undefined = pinnedHosts[host];

        // Host not pinned
        if (!pinnedHost) {
            return;
        }

        if (pinnedHost.length <= 0) {
            throw new ServerIdentityError("Certificate pinning failed!");
        }

        const hasValidPin = pinnedHost.find((pin) => pin.equals(cert.raw));

        if (!hasValidPin) {
            throw new ServerIdentityError("Certificate pinning failed!");
        }
    },
});

export const handleServerResponse = (error: Error): void => {
    if (!(error instanceof HTTPError)) {
        return;
    }

    let body: unknown = error.response.body;

    if (Buffer.isBuffer(body)) {
        body = body.toString("utf8");
    }

    // Attempt to parse body in case it's a string
    if (isString(body)) {
        try {
            body = JSON.parse(body);
        } catch {
            return;
        }
    }

    if (!isApiErrorResponse(body)) {
        return;
    }

    const { code, message } = body.error;

    if (code === "SDKInvalid" || code === "SDKVersionInvalid") {
        throw new SDKInvalidError(message, body.error);
    }

    throw new ServerError(message, body.error);
};
