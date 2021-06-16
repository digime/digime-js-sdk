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

# Authorizing
In order to write or read data from digi.me, we first need to create an user access token for each user.
User access tokens are linked to a contract, and it is possible to create multiple tokens that has access to the same digi.me libary.
Authorization is the process to obtain an user access token for the user.

### When do we need to authorize?

Authorization is needed:

* For new users. You have the option to also ask the user to onboard a service during this process.
* For an existing user working with a different contract. eg, They have shared data but now we would like to write data in their digi.me.
* For an existing user when their user access token has expired and we need to renew it.

### What are the steps?

* Getting a authorization URL and a code verifier.
* Redirecting the user to this authorization URL.
* Exchanging the result for an user access token.

## Getting a authorization URL and a code verifier

```typescript
import {init} from "@digime/digime-js-sdk";

const sdk = init({ applicationId: <you-application-id> });

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
    redirectUri: <an-url-to-call-when-authorization-is-complete>,
}

// callback - A URL to call if there are any errors during authorization. If successful, the callback used will be the redirectUrl in contractDetails above.
// serviceId - (Optional) During authorization, we can also ask user to onboard a service. ID can be found from getAvailableServices()
// state - (Optional) Put anything here to identify the user when authorization completes. This will be passed back in the callback.
// userAccessToken - (Optional) User access token you may already have for this user from another contract.

const result = await sdk.getAuthorizeUrl({
    contractDetails,
    callback: <an-url-to-call-when-an-error-is-encountered>,
    state: <any-extra-info-to-identify-user>
    serviceId: toNumber(serviceId),
    userAccessToken: <access-token>,
});

// => result will contain a url and a code verifier which you will need for later.
// Calling the url returned will trigger the authorization process.
```
The [result](../../interfaces/types.getauthorizeurlresponse.html) returned will include a `url` and `codeVerifier`.
Store the `codeVerifier` against this user as this will be required for later.

## Redirecting the user to this authorization URL

The URL returned is the digi.me web onboard client, and will look something like this.

```
https://api.digi.me/apps/saas/authorize?code=<code>&callback=<callback>&service=<service-id>
```

Redirect the user to this URL, and they will be asked to onboard the service and consent to share the requested data.

On *success*, the `redirectUri` provided above will be called with the follow extra query parameters:

| Parameter | Description | Returned Always |
|-|-|-|
| `success` | Whether the call was successful. `true` or `false` | Yes |
| `state` | The same string that was passed in to the `getAuthorizationUrl` call. | Yes |
| `code` | Authorization Code. Only returned when the authorization successful. | Yes |
| `postboxId` | Returned only when authorizing a write contract. | No |
| `publicKey` | Returned only when authorizing a write contract. | No |

On *failure*, the `callbackUrl` provided will be called with the follow extra query parameters:

| Parameter | Description | Returned Always |
|-|-|-|
| `success` | Whether the call was successful. `true` or `false` | Yes |
| `errorCode` | If there was an error, an error code will be returned. Please see the error code section for a list of possible errors. | Yes |

## Exchanging the result for an user access token.

Once we have the `code` from a successful authorization, we can combine that with the `codeVerifier` to exchange a User Access Token.

```typescript
// ... initialize the SDK

// authorizationCode - The code returned in the query parameter of the returned URL.
// codeVerifier - The one returned from the result of getAuthorizeUrl().
// contractDetails - The same one passed into getAuthorizeUrl().

const userAccessToken = await sdk.exchangeCodeForToken({
    codeVerifier,
    authorizationCode,
    contractDetails,
});

// Store the userAccessToken against the current user. We can use this for future reads.
```

Once the above steps are completed, you will have an User Access Token for this user for this contract. You will be able to perform read/write tasks from their digi.me library.

Note that for the same user, if you'd like to authorize another contract, you'll need to provide the User Access Token when authorizing for the next contract.
