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

# Contracts

To access the digi.me platform, you need to obtain a custom application ID as well as a valid contract ID.

To get your own application ID, you can get yours by filling out the [registration form here](https://go.digi.me/developers/register).

Contracts represent the data that you are requesting from your users as well as the specifics around terms of use. Each contract has a contract ID, a private key that work together to request, download and decrypt personal data shared with your app.

For demo purposes, we provide example contracts with its example keys in our [example application](https://github.com/digime/digime-js-sdk-example). In order to release your app to production, you will need personalised contracts that are tied to your application ID and have your branding and contact information as well as your legal terms embedded. When you are ready to go to production or interact with real users, visit our [launching your app](https://developers.digi.me/launching-your-app) page to request production contracts.

There are three types of contracts available in digi.me:

## Read Contracts
These are contracts that request data from the user.

Some example read contracts may be:
  * A contract requesting all social media posts from a user.
  * A contract requesting all medical data in the past six months.

## Write Contracts
These are contracts that allow you to write data in to a user's digi.me.

## Read Raw Contracts
If you have written something to the user, then you can use a read raw contract to request this data back out.
