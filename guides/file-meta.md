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

# File MetaData
The type of FileMetadata that is returned depends on the type of data it is.

### MappedFileMetadata
When reading data that was sync'd from an external service, data returned will be of type [MappedFileMetadata](../../interfaces/types.mappedfilemetadata.html).

```
interface MappedFileMetadata {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
}
```
| Property | Description | Data type |
|-|-|-|
| `objectCount` | How many data objects are returned in this file. | number |
| `objectType` | What data these objects represent. E.g. Media For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs. | string |
| `serviceGroup` | What service group the data belongs to. E.g. Social. For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs. | string |
| `serviceName` | What service the data came from. E.g. Facebook. For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs. | string |


### RawFileMetadata
If it is a file that you wrote to the user, it will be of type [RawFileMetadata](../../interfaces/types.rawfilemetadata.html).

```
interface RawFileMetadata {
    mimetype: string;
    accounts: {
        accountid: string,
    }[];
    reference?: string[];
    tags?: string[];
}
```
| Property | Description | Data type |
|-|-|-|
| `mimetype` | The mimetype of this data blob. | string |
| `accounts` | An array of account IDs that was pushed up with this file. | UserAccount[] |
| `tags` | Any tags linked to this file when it was pushed up. | string[] |
| `reference` | Any references linked to this file when it was pushed up. | string[] |
