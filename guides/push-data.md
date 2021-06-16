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

# Pushing data into Postbox

Once we have the [postbox created](./create-postbox.md), we are ready to push data to the user! Regardless of whether you went through the one off or ongoing push, the function to call is the same.

Check out [push.pushDataToPostbox()](../functions/push.md#push-pushDataToPostbox) for details.

If no access token was provided, the data pushed will be imported to the user's digi.me next time they open digi.me. You can also trigger this manually by redirecting to the url returned in [push.getPostboxImportUrl()](../functions/push.md#push-getPostboxImportUrl).

If you have an access token, you can provide this when pushing data, which would import the data to their digi.me straight away.

-----

[Back to Index](../README.md)
