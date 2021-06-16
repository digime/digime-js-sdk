![](https://securedownloads.digi.me/partners/digime/SDKReadmeBanner.png)
<p align="center">
    <a href="https://developers.digi.me/slack/join">
        <img src="https://img.shields.io/badge/chat-slack-blueviolet.svg" alt="Developer Chat">
    </a>
    <a href="LICENSE">
        <img src="https://img.shields.io/badge/license-apache 2.0-blue.svg" alt="Apache 2.0 License">
    </a>
    <a href="#">
    	<img src="https://img.shields.io/badge/build-passing-brightgreen.svg">
    </a>
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/language-typescript-ff69b4.svg" alt="Typescript">
    </a>
    <a href="https://developers.digi.me/">
        <img src="https://img.shields.io/badge/web-digi.me-red.svg" alt="Web">
    </a>
</p>

<br>

# Writing data - Step by step guide

Use this guide to write data to your user's library in digi.me.

In order to access the digi.me platform, you need to obtain an application ID, a contract for writing data and its private key.

Please check out [Getting Started](./start.html) for more details.

## 1. Onboarding and Authorization
Before we can write data to user, we need go through the authorization flow and obtain a user access token.

*If you already have an user access token for this user for another contract, you will still need to go through this process. Make sure to include any user access tokens you already have so we can link to the same library.*

### Getting an authorization URL and a code verifier
Start this process by getting the authorization URL by calling `getAuthorizeUrl`:

```typescript
import { init } from "@digime/digime-js-sdk";

const sdk = init({ applicationId });

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
    redirectUri: <an-url-to-call-when-authorization-is-complete>,
}

const { url, codeVerifier } = await sdk.getAuthorizeUrl({
    contractDetails,
    callback: <an-url-to-call-when-an-error-is-encountered>,
    serviceId: toNumber(serviceId),
    state: <any-details-to-help-you-identify-user-on-return>,
    userAccessToken: <if-you-already-have-one>
});

// Store the codeVerifier against the current user, and redirect them to the url returned.
// This will kick start the authorization process.
```

### Redirect the user

From the step above, you will have received a URL to which you can redirect your users to to start the authorization process.
Don't forget to also store the code verifier against this user as you'll need it later!

An authorization URL should look something like:

```
https://api.digi.me/apps/saas/authorize?code=<code>&callback=<callback>
```

### Redirect back to your application

After the user has onboarded and finished with the authorization, the `redirectUri` provided in `contractDetails` will be called.
For a write contract, a `postboxId` and a `publicKey` will also be returned which will need to be stored.

An example URL might be:

```
https://your-website.com/return?success=true&code=<authorization-code>&state=<state-passed-in-from-before>&postboxId=<postbox-id>&publicKey=<public-key>
```


## 2. Exchange for an User Access Token
The `code` returned in step 2 above can be used with the `codeVerifier` to exchange for a user access token. This allows you to request updated data from this user in the future for as long as the user access token is valid. Read more about the user access token [here](../fundamentals/access-token.html).

```typescript
// ... initialize the SDK

// authorizationCode - The code returned in the query parameter of the returned URL.
// codeVerifier - The one stored from step 2.
// contractDetails - The same one used in getAuthorizeUrl().

const userAccessToken = await sdk.exchangeCodeForToken({
    codeVerifier,
    authorizationCode,
    contractDetails,
});

// Store the userAccessToken against the current user. We can use this for future reads.
```

## 3. Write Data
Once you have the `postboxId`, `publicKey` and the `userAccessToken` from the steps above, we can push data!

Please take a look at write data to find out more about how to format the data to push.

```typescript
// ... initialize the SDK

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// postboxId - The postboxId from the authorization step.
// publicKey - The public key from the authorization step.
// data - An object containing the buffer of the file to upload and some meta data.

const result = await sdk.write({
    contractDetails,
    userAccessToken,
    postboxId,
    publicKey,
    data: {
        fileData: req.file.buffer,
        fileName: req.file.originalname,
        fileDescriptor: JSON.parse(fileMeta),
    },
});

// A status will be returned.
// An update user access token will also be returned if the SDK needed to refresh it.
```

If we need to write other files to the users in the future, we can keep writing as long as the user access token is valid.

## 4. Reading files back out

If you've written data to the user, you can read it back out using the [same process for reading user data](./read-data-overview.html). You will need a new contract which reads out raw data, so please contact digi.me [here](https://go.digi.me/developers/register) to get yours.

Make sure you pass in the user access token which you obtained in step 3 above when authorizing the new contract.
