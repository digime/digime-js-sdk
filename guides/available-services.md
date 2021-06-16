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

# Getting Available Services

The SDK Provides a function which you can use to determine what services can be onboarded for your contract.
The Contract you pass in must be a READ contract, which means it's a contract that asks for user's data.

#### Configuration Options
See all possible [configurations](../../interfaces/types.sdkconfiguration.html) when initializing the SDK.

#### Returns
The [available services](../../interfaces/types.getavailableservicesresponse.html).

Service describes the different service groups

#### Examples
The most basic initialization:
```typescript
// Initialize the SDK
import {init} from "@digime/digime-js-sdk";
const sdk = init({ applicationId: <you-application-id> });

const services = await sdk.getAvailableServices(<read-contract-id>);
```

For a contract that only asks for Twitter data, the response might be:
```
[{
    "name": "Twitter",
    "publishedDate": 1518428711000,
    "publishedStatus": "approved",
    "reference": "twitter",
    "id": 2,
    "serviceGroups": [
        {
            "id": 1
        }
    ],
    "countries": [],
    "homepageURL": "https://twitter.com",
    "title": "Add your Twitter...",
    "subTitle": "Your tweets, likes and mentions",
    "resources": [
        {
            "mimetype": "image/png",
            "resize": "fit",
            "type": 0,
            "url": "https://securedownloads.digi.me/static/development/discovery/services/twitter/icon25x25.png",
            "aspectratio": {
                "accuracy": 100,
                "actual": "1:1",
                "closest": "1:1"
            },
            "height": 25,
            "width": 25
        }
    ]
}]
```
