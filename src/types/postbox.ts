/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import get from "lodash.get";
import { Stream } from "stream";
import { codecAssertion, CodecAssertion } from "../utils/codec-assertion";

export interface PushedFileMeta {
    fileData: NodeJS.ReadableStream | Buffer;
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

export const buffer = new t.Type<Buffer, Buffer, unknown>(
    "Buffer",
    (input: unknown): input is Buffer => Buffer.isBuffer(input),
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) =>
        Buffer.isBuffer(input) ? t.success(input) : t.failure(input, context, "Cannot parse into Buffer"),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity
);

const readableStream = new t.Type<NodeJS.ReadableStream, NodeJS.ReadableStream, unknown>(
    "ReadableStream",
    (input: unknown): input is NodeJS.ReadableStream => isReadableStream(input),
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) =>
        isReadableStream(input) ? t.success(input) : t.failure(input, context, "Cannot parse into Readable"),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity
);

export const isReadableStream = (obj: unknown): obj is NodeJS.ReadableStream => {
    return obj instanceof Stream && typeof get(obj, "read") === "function";
};

export const PushedFileMetaCodec: t.Type<PushedFileMeta> = t.type({
    fileData: t.union([readableStream, buffer]),
    fileName: t.string,
    fileDescriptor: t.intersection([
        t.type({
            mimeType: t.string,
            accounts: t.array(
                t.type({
                    accountId: t.string,
                })
            ),
        }),
        t.partial({
            reference: t.array(t.string),
            tags: t.array(t.string),
        }),
    ]),
});

export const isPushedFileMeta = PushedFileMetaCodec.is;

export const assertIsPushedFileMeta: CodecAssertion<PushedFileMeta> = codecAssertion(PushedFileMetaCodec);
