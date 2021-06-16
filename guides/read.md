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

# Reading data

Before data can be read, we should already have a user access token for this user.

If not, you'll need to [authorize them](./authorize.html) first, and ask them to [onboard any extra services](./onboard.html) to provide the data you're requesting.


## Getting a Read Session
To start reading user data, we first need to obtain a session:

```typescript
// initialize the SDK
import { init } from "@digime/digime-js-sdk";
const sdk = init({ applicationId });

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// scope - (Optional) For filtering the amount of data retrieved.

const { session, updatedAccessToken }  = await sdk.readSession({
    contractDetails,
    userAccessToken,
});
```

The [session](../../interfaces/types.session.html) received can now be used to query data.

## Reading All Files
Using the session received above, we can trigger [readAllFiles()](../../interfaces/sdk.digimesdk.html#readallfiles) to read all available files from this user.

```typescript
// ... initialize the SDK

// session - The session we received from readSession().
// privateKey - The private key for this contract.
// onFileData - A function that will be called when a file is successfully downloaded.
// onFileError - A function that will be called when an error occurs when downloading a file.

const { stopPolling, filePromise } = await sdk.readAllFiles({
    sessionKey: session.key,
    privateKey: <private-key-of-contract>,
    onFileData: ({fileData, fileName, fileMetadata}) => {
        // This is where you deal with any data you receive from digi.me,
        const data = JSON.parse(fileData.toString("utf8"));
        console.log("Retrieved: ", fileName);
        console.log("Metadata:\n", JSON.stringify(fileMetadata, null, 2));
        console.log("Content:\n", JSON.stringify(data, null, 2));
    },
    onFileError: ({fileName, error}) => {
        console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
    },
});

// filePromise is a promise that will resolve when data fetching is complete.
// stopPolling is a function that you can call if you would like to stop the process when it's still running.
```
The type of FileMetadata that is returned depends on the type of data it is. Please see [here](./read/file-meta.html) for more information.

## Selecting Files
If you'd like more control over the downloading of the files, we can call [readFileList()](../../interfaces/sdk.digimesdk.html#readallfiles) to see all available files from this user:

```typescript
// ... initialize the SDK
// session - The session we received from readSession().

const response = await readFileList({ sessionKey: session.key });
```

[Response](../../interfaces/types.readfilelistresponse.html) contains a `fileList` and `status` of each user service onboarded.

You can then download the files manually using [readFile()](../../interfaces/sdk.digimesdk.html#readfile).

```typescript
// ... initialize the SDK
// session - The session we received from readSession().
// file - The file object from getFileList() that you want to download.
// privateKey - private key of your contract.

const data = await readFile({
    sessionKey: session.key,
    fileName: file.name,
    privateKey,
});
```
