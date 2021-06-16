/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

/**
 * This interface specifies all the functions available after the SDK is initialised.
 * @module SDK
 */

import { DeleteUserOptions, DeleteUserResponse } from "./delete-user";
import { ExchangeCodeForTokenOptions } from "./exchange-code-for-token";
import { GetAuthorizeUrlResponse, GetAuthorizeUrlOptions } from "./get-authorize-url";
import { GetAvailableServicesResponse } from "./get-available-services";
import { GetOnboardServiceUrlOptions, GetOnboardServiceUrlResponse } from "./get-onboard-service-url";
import { ReadAccountsOptions, ReadAccountsResponse } from "./read-accounts";
import { ReadAllFilesOptions, ReadAllFilesResponse } from "./read-all-files";
import { ReadFileOptions, ReadFileResponse } from "./read-file";
import { ReadFileListOptions, ReadFileListResponse } from "./read-file-list";
import { ReadSessionOptions, ReadSessionResponse } from "./read-session";
import { UserAccessToken } from "./types/user-access-token";
import { WriteOptions, WriteResponse } from "./write";

export interface DigimeSDK {
    /**
     * In order to write or read data from digi.me, we first need to create an access token. Access tokens are linked to a contract, and it is possible to create multiple access tokens that access to the same digi.me libary. This function is called when:
     * * Authorize a new user. You have the option to also onboard a service during this process.
     * * An existing user authorizing a new contract.
     * * Existing user’s refresh token has expired and we need to extend it.
     *
     * ```typescript
     * // run typedoc --help for a list of supported languages
     * const instance = new MyClass();
     * ```
     *
     * @category Authorization
     */
    getAuthorizeUrl: (props: GetAuthorizeUrlOptions) => Promise<GetAuthorizeUrlResponse>;

    /**
     * This is called when we already have a valid user access token for this user and we want to add more services to this user’s library.
     *
     * @category Authorization
     */
    getOnboardServiceUrl: (props: GetOnboardServiceUrlOptions) => Promise<GetOnboardServiceUrlResponse>;

    /**
     * This is called when authorization flow successfully completed, and you have been given an authorization code. We can then use this function to exchange for an access token.
     *
     * @category Authorization
     */
    exchangeCodeForToken: (props: ExchangeCodeForTokenOptions) => Promise<UserAccessToken>;

    /**
     * Write something to the user's digi.me
     *
     * @category Write
     */
    write: (props: WriteOptions) => Promise<WriteResponse>;

    /**
     * Start a new read session. When we already have an user access token.
     *
     * @category Read
     */
    readSession: (props: ReadSessionOptions) => Promise<ReadSessionResponse>;

    /**
     * Download a file.
     *
     * @category Read
     */
    readFile: (props: ReadFileOptions) => Promise<ReadFileResponse>;

    /**
     * Get a list of files that are ready to be downloaded.
     *
     * @category Read
     */
    readFileList: (props: ReadFileListOptions) => Promise<ReadFileListResponse>;

    /**
     * Handy util function to download all available user files.
     *
     * @category Read
     */
    readAllFiles: (props: ReadAllFilesOptions) => ReadAllFilesResponse;

    /**
     * Get a list of accounts that exist of current user's library.
     *
     * @category Read
     */
    readAccounts: (props: ReadAccountsOptions) => Promise<ReadAccountsResponse>;

    /**
     * Deletes user data on digi.me
     *
     * @category Delete
     */
    deleteUser: (props: DeleteUserOptions) => Promise<DeleteUserResponse>;

    /**
     * Get a list of possible services a user can onboard to their digi.me
     *
     * @category Read
     */
    getAvailableServices: (contractId?: string) => Promise<GetAvailableServicesResponse>;
}
