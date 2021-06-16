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

# Writing Data

Before we can be write data to the user, we should already have a user access token for this user.

If not, you'll need to [authorize them](./authorize.html) first. Make sure the user access token is for a [write contract](../fundamentals/contracts.html).

Once you have authorized a write contract, you should have the `postboxId`, `publicKey` and the `userAccessToken` for this user.

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


```
A status of `delivered` will be returned if it is written to the user's digi.me.
An user access token that was successfully used will also be returned. The SDK might have refreshed the one that was passed in.

## FileMeta
This is how you should format the `data` property:

```typescript
interface FileMeta {
    fileData: Buffer;
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
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `fileData` | Yes | A Buffer of the data that is to be pushed into the user's library. | Buffer |
| `fileDescriptor` | Yes | Information regarding the data pushed. | FileDescriptor |
| `fileName` | Yes | Name of the file to be attached. | string |

## FileDescriptor
| Parameter | Required | Description | Type |
|-|-|-|-|
| `accountId` | Yes | Account ID of the user in your system. Currently this is a required field for all data to be pushed in. | string |
| `accounts` | Yes | An array of account objects used to identify the user in your system. | object[] |
| `mimeType` | Yes | MimeType of the file that has been pushed in. | string |
| `tags` | No | Any tags you might want to attach with the file. Used when you want to retrieve it again. | string[] |
