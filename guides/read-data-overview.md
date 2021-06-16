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

# Reading data - Step by step guide

Requesting user data using digi.me is easy!

On this page, we will learn how to receive data from your users using the digi.me Private Share platform.

In order to access the digi.me platform, you need to obtain an application ID, a contract ID for reading data and its private key.

Please check out [Getting Started](./start.html) for more details.

## 1. Available Services
To start reading user data, we first need to ask the user to onboard a service.

To see a list of services available for users to onboard:

```typescript
import { init } from "@digime/digime-js-sdk";

const sdk = init({ applicationId });

// Contract Id of your READ contract
const availableServices = await sdk.getAvailableServices(contractId);

// => Result will be an object with available services for your contract ID.
```

See [Available Services](../fundamentals/available-services.html) for more explanation.

## 2. Onboarding and Authorization
To start reading user data, we need to ask the user to onboard a service and authorize us to access it.

*If you already have an user access token for this user from another contract, you will still need to go through this process. Make sure to include any user access tokens you already have so we can link to the same library.*

### Getting an authorization URL and a code verifier
Start this process by getting the authorization URL by calling `getAuthorizeUrl`:

```typescript
// ... initialize the SDK

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
https://api.digi.me/apps/saas/authorize?code=<code>&callback=<callback>&service=<service-id>
```

### Redirect back to your application

After the user has onboarded and finished with the authorization, the `redirectUri` provided in `contractDetails` will be called.
An example URL might be:

```
https://your-website.com/return?success=true&code=<authorization-code>&state=<state-passed-in-from-before>
```

Extra query parameter `code` will be attached which can be used to exchange for an user access token.

## 4. Exchange for an User Access Token
The `code` returned in the query parameters in the step above can be used with the `codeVerifier` to exchange for a user access token. This allows you to request updated data from this user in the future for as long as the user access token is valid. Read more about the user access token [here](../fundamentals/access-token.html).

```typescript
// ... initialize the SDK

// authorizationCode - The code returned in the query parameter of the returned URL.
// codeVerifier - The one stored from step above.
// contractDetails - The same one used in getAuthorizeUrl().

const userAccessToken = await sdk.exchangeCodeForToken({
    codeVerifier,
    authorizationCode,
    contractDetails,
});

// Store the userAccessToken against the current user. We can use this for future reads.
```
You now have a user access token for this user which you can use to read data from this user in the future.

## (Optional) Onboarding More Services.
If you need to ask the user to onboard more services, you can use call:

```typescript
// ... initialize the SDK

// callback - The URL to call after user is onboarded.
// contractDetails - The same one used in getAuthorizeUrl().
// serviceId - The service to onboard
// userAccessToken - The user access token from the authorization step.

const { url } = await sdk.getOnboardServiceUrl({
    callback,
    contractDetails,
    serviceId,
    userAccessToken,
});

// Redirect the user to the url returned and this will kick start the onboarding process.
```

After the user has onboarded and finished with the authorization, the `callback` provided will be called. You are welcome to populate the `callback` with any query parameters to help you identify the user. An example of a returned URL might be:

```
https://your-website.com/onboard-return?userId=<user-id>&success=true
```


## 5. Start a Read Session
When your user has onboarded all the services you require, we can kick off a read session:

```typescript
// ... initialize the SDK

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.

const { session, updatedAccessToken }  = await sdk.readSession({
    contractDetails,
    userAccessToken,
});

// A session object will be returned which can then be used to query data.
// If the user access token needed to be refreshed, the SDK will handle that automatically and the new one will be returned
```

The `session` object can be used to query the data from this user.


## 6. Query user data.
Once we have a session, we can query the data.

```typescript
// ... initialize the SDK

// session - The session we received from readSession().
// privateKey - The private key for this contract.
// onFileData - A function that will be called when a file is successfully downloaded.
// onFileError - A function that will be called when an error occurs when downloading a file.

const { stopPolling, filePromise } = await sdk.readAllFiles({
    sessionKey: session.key,
    privateKey: <private-key-of-contract>,
    onFileData: onFileDownloaded,
    onFileError: onFileError
});

// filePromise is a promise that will resolve when data fetching is complete.
// stopPolling is a function that you can call if you would like to stop the process when it's still running.
```

And that's it, you've successfully received data from the user using digi.me!

Next time you want to get data from the same user, you can reuse the User Access Token and go straight to step 5 of the process!
