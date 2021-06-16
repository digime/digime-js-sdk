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

# Handling Errors

By default, the SDK retries to make calls twice before giving up. This is something that can be configured when the SDK is [initialised](./initialise-sdk.html).

## Errors Returned From digi.me API

These are errors that have been thrown by the digi.me API. These errors will be thrown as `ServerError` and it will contain an error object specifying the error.

```
import { ServerError } from "@digime/digime-js-sdk";

// ... init the sdk

try {
    const response = await sdk.getAuthorizeUrl(parameters);
} catch (e) {

    // Check if it's a server error
    if (e instanceof ServerError) {

        // e.error is an object containing a code and a message
        const {code, message} = e.error
        return res.status(500).json({ code, message });

        // For example when the redirect URL is invalid:
        // code: InvalidRedirectUri
        // message: "The redirect_uri (${redirectUri}) is invalid"
    }

    res.status(500).json({ error });
}
```

Some common errors returned from digi.me:

| Code | Message | Description |
|-|-|-|
| `InvalidRedirectUri` | `The redirect_uri (${redirectUri}) is invalid` | The redirect URL that was supplied in the contract details was not valid. |
| `InvalidToken` | `The token (${tokenType}) is invalid` | The user access token or refresh token was invalid. |
| `InvalidClient` | `The client_id (${clientId}) is invalid` | The contract and/or application ID is invalid for this environment. |
| `InsufficientScope` | `The request requires higher privileges than provided by the access token` | The contract used is only for one off read. |
| `SDKVersion` | | This SDK is not recognised. |
| `SDKVersionInvalid` | | This SDK version is no longer supported. |


## Type Validation Errors

`TypeValidationError` are thrown when the parameters passed in fail runtime type checks.


## Decryption Errors

When decrypting files from digi.me, if an incorrect private key is provided, `FileDecryptionError` will be thrown.


## Other Errors

`ServerIdentityError` - Thrown if there's a mismatch of certificates when communicating with our production server.

`DigiMeSDKError` - Thrown for other generic errors in the SDK.


## Further Issues

If, after reading this section, your issue persists, please contact digi.me developer support. You can find FAQs and create a support ticket by visiting [digi.me support](http://digi.me/support). Alternatively you can email dev support by sending an email to support@digi.me
