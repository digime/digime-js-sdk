/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import crypto from "crypto";
import NodeRSA from "node-rsa";
import { Readable } from "stream";
import { FileDecryptionError } from "./errors";

const BYTES = {
    DSK: [0, 256],
    DIV: [256, 272],
    HASH_DATA: [272],
    HASH: [0, 64],
    DATA: [64],
};

const ALPHA_LOWER = `abcdefghijklmnopqrstuvwxyz`;
const ALPHA_UPPER: string = ALPHA_LOWER.toUpperCase();
const NUMERIC = `0123456789`;
const ALPHA_NUMERIC = `${ALPHA_LOWER}${ALPHA_UPPER}${NUMERIC}`;

const isValidSize = (data: Buffer): boolean => {
    const bytes = data.length;
    return bytes >= 352 && bytes % 16 === 0;
};

const decryptData = (key: NodeRSA, file: Buffer): Buffer => {
    // Verify file data is of correct length
    if (!isValidSize(file)) {
        throw new FileDecryptionError("File size not valid");
    }

    // Recover DSK and DIV
    const dsk: Buffer = key.decrypt(file.slice(...BYTES.DSK));
    const div: Buffer = file.slice(...BYTES.DIV);

    // Recover concated hash and data
    const decipher = crypto.createDecipheriv("aes-256-cbc", dsk, div);
    const hashAndData = Buffer.concat([decipher.update(file.slice(...BYTES.HASH_DATA)), decipher.final()]);

    // Separate hash and data
    const hash: Buffer = hashAndData.slice(...BYTES.HASH);
    const data: Buffer = hashAndData.slice(...BYTES.DATA);

    // Validate data
    const dataHash: Buffer = crypto.createHash("sha512").update(data).digest();

    if (!dataHash.equals(hash)) {
        throw new FileDecryptionError("Hash is not valid");
    }

    return data;
};

const encryptBuffer = (iv: Buffer, key: Buffer, input: Buffer): Buffer => {
    const cipher: crypto.Cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([cipher.update(input), cipher.final()]);
};

const encryptStream = (iv: Buffer, key: Buffer, input: Readable): Readable => {
    const cipher: crypto.Cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    return input.pipe(cipher);
};

const getRandomHex = (size: number): string =>
    crypto
        .randomBytes(Math.ceil(size / 2))
        .toString("hex")
        .slice(0, size);

const getRandomAlphaNumeric = (size: number): string => {
    const charsLength: number = ALPHA_NUMERIC.length;
    const value: string[] = Array.from({ length: size });
    for (let i = 0; i < size; i++) {
        let random: number;
        do {
            random = crypto.randomBytes(1).readUInt8(0);
        } while (random > 256 - (256 % charsLength));
        value[i] = ALPHA_NUMERIC[random % charsLength];
    }
    return value.join("");
};

const hashSha256 = (data: string | Buffer): Buffer => crypto.createHash("sha256").update(data).digest();

export { encryptBuffer, encryptStream, decryptData, getRandomHex, getRandomAlphaNumeric, hashSha256 };
