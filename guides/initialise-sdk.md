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

# Initializing the SDK

In order to use the JS SDK, you'll first need to initialise it with your unique application ID.
You can get yours by filling out the registration form [here](https://go.digi.me/developers/register).

By default, the SDK will point to the production environment of digi.me, but when initialising the SDK, you have the ability to override some default behaviour and specify some options.

#### Configuration Options
See all possible [configurations](../../interfaces/types.sdkconfiguration.html) when initializing the SDK.

#### Returns
The returned SDK has the following [properties](../../interfaces/sdk.digimesdk.html)

#### Examples
The most basic initialization:

_Using ES6 modules_
```typescript
import { init } from "@digime/digime-js-sdk";

const sdk = init({ applicationId: <my-unique-application-id> });
```

_Using CommonJS_
```typescript
const { init } = require("@digime/digime-js-sdk");

const sdk = init({ applicationId: <my-unique-application-id> });
```

If you'd like to specify retry options for the SDK:
```typescript
import { init } from "@digime/digime-js-sdk";

const sdk = init({
    applicationId: <my-unique-application-id>,
    retryOptions: {
        retries: 10,
    }
});
```

Please see [here](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/got/index.d.ts#L271) for all possible retry options.
