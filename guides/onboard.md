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

# Onboarding Additional Services
Once a user is authorized, you can onboard additional services to their library before reading them all at once.

To trigger a new service onboard, you can do the following:
```typescript
// Initialize the SDK
import {init} from "@digime/digime-js-sdk";

const sdk = init({ applicationId: <you-application-id> });

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

The `url` returned might look something like this:

```
https://api.digi.me/apps/saas/onboard?code=<code>&callback=<callback>&service=<service-id>
```

Redirect the user to this URL, and they will be asked to onboard the service and consent to share the requested data.

At the end of the process, the `callback` provided above will be called with the follow extra query parameters:

| Parameter | Description | Returned Always |
|-|-|-|
| `success` | Whether the call was successful. `true` or `false` | Yes |
| `errorCode` | If there was an error, an error code will be returned. Please see the error code section for a list of possible errors. | Yes |
