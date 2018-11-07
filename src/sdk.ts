/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import isFunction from "lodash.isfunction";
import isInteger from "lodash.isinteger";
import isPlainObject from "lodash.isplainobject";
import isString from "lodash.isstring";
import NodeRSA from "node-rsa";
import { decryptData } from "./crypto";
import { net } from "./net";

interface DigiMeSDKConfiguration {
    host: string;
    version: string;
}

interface Session {
    expiry: number;
    sessionKey: string;
}

type FileCallback = (fileData: any) => void;

// TODO: replace with build step
const SDK_VERSION = "0.1.0";

const _establishSession = async (
    appId: string,
    contractId: string,
    options: DigiMeSDKConfiguration,
): Promise<Session> => {
    if (!isString(appId)) {
        throw new Error("Parameter appId should be string");
    }
    if (!isString(contractId)) {
        throw new Error("Parameter contractId should be string");
    }
    const url = `https://${options.host}/${options.version}/permission-access/session`;

    const response = await net.post(url, {
        json: true,
        body: { appId, contractId },
    });

    return response.body;
};

const _getWebURL = (session: Session, callbackURL: string, options: DigiMeSDKConfiguration) => {
    if (!_isSessionValid(session)) {
        throw new Error("Session should be an object that contains expiry as number and sessionKey property as string");
    }
    if (!isString(callbackURL)) {
        throw new Error("Parameter callbackURL should be string");
    }
    // tslint:disable-next-line:max-line-length
    return `https://${options.host}/apps/quark/direct-onboarding?sessionKey=${session.sessionKey}&callbackUrl=${encodeURIComponent(callbackURL)}`;
};

const _getAppURL = (appId: string, session: Session, callbackURL: string) => {
    if (!_isSessionValid(session)) {
        throw new Error("Session should be an object that contains expiry as number and sessionKey property as string");
    }
    if (!isString(callbackURL)) {
        throw new Error("Parameter callbackURL should be string");
    }
    if (!isString(appId)) {
        throw new Error("Parameter appId should be string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://consent-access?sessionKey=${session.sessionKey}&callbackURL=${encodeURIComponent(callbackURL)}&appId=${appId}&sdkVersion=${SDK_VERSION}`;
};

const _getFileList = async (sessionKey: string, options: DigiMeSDKConfiguration): Promise<string[]> => {
    const url = `https://${options.host}/${options.version}/permission-access/query/${sessionKey}`;
    const response = await net.get(url, {json: true});

    return response.body.fileList;
};

const _getFile = async (sessionKey: string, fileName: string, options: DigiMeSDKConfiguration): Promise<string> => {
    const url = `https://${options.host}/${options.version}/permission-access/query/${sessionKey}/${fileName}`;
    const response = await net.get(url, {json: true});

    return response.body.fileContent;
};

const _getDataForSession = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    fileCallback: FileCallback,
    options: DigiMeSDKConfiguration,
): Promise<any> => {

    if (!isString(sessionKey)) {
        throw new Error("Parameter sessionKey should be string");
    }

    if (!isFunction(fileCallback)) {
        throw new Error("Parameter fileCallback should be a function");
    }

    // Set up key
    const key: NodeRSA = new NodeRSA(
        privateKey,
        "pkcs1-private-pem",
    );

    const fileList = await _getFileList(sessionKey, options);

    const filePromises = fileList.map((fileName) => {
        return _getFile(sessionKey, fileName, options).then((fileData: string) => {

            const readableData = JSON.parse(decryptData(key, fileData).toString("utf8"));

            if (fileCallback) {
                fileCallback(readableData);
            }

            return;

        });
    });

    await Promise.all(filePromises);

    return;
};

const _isSessionValid = (session: unknown): session is Session => (
    _isPlainObject(session) && isInteger(session.expiry) && isString(session.sessionKey)
);

const _areOptionsValid = (options: unknown): options is DigiMeSDKConfiguration => (
    _isPlainObject(options) && isString(options.host) && isString(options.version)
);

const _isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObject(o);

const createSDK = (sdkOptions?: Partial<DigiMeSDKConfiguration>) => {

    if (sdkOptions !== undefined && !_isPlainObject(sdkOptions)) {
        throw new Error("SDK options should be object that contains host and version properties");
    }

    const options: DigiMeSDKConfiguration = {
        host: "api.digi.me",
        version: "v1.0",
        ...sdkOptions,
    };

    if (!_areOptionsValid(options)) {
        throw new Error("SDK options should be object that contains host and version properties as string");
    }

    return {
        establishSession: (appId: string, contractId: string) => _establishSession(appId, contractId, options),
        getDataForSession: (sessionKey: string, privateKey: NodeRSA.Key, fileCallback: FileCallback) => (
            _getDataForSession(sessionKey, privateKey, fileCallback, options)
        ),
        getWebURL: (session: Session, callbackURL: string) => _getWebURL(session, callbackURL, options),
        getAppURL:  (appId: string, session: Session, callbackURL: string) => _getAppURL(appId, session, callbackURL),
    };
};

export {
    createSDK,
    Session,
    DigiMeSDKConfiguration,
};
