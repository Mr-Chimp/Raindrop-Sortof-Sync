# Raindrop-Sortof-Sync
A chrome extension that sort of syncs with Raindrop, so it doesn't sync at all but what it does do is let you copy Raindrops from a Raindrop.io collection over to a local bookmark folder in your browser. It has built in rate limiting to stick within Raindrop.io's rate limits.

I do not intend to develop this into a full sync extension but will fix bugs if any arise.

Known Bugs
- The text that updates during sync to let you know what is going on doesn't run correctly at the end of the fetching process which it should do

# Raindrop-Sortof-Sync

Raindrop-Sortof-Sync is a Chrome extension designed to facilitate the transfer of Raindrops from a Raindrop.io collection to a local bookmark folder in your browser. While it's not a full sync solution, the extension ensures a seamless copying process, complete with built-in rate limiting to adhere to Raindrop.io's rate limits.

**Development Status:** This extension is not intended for ongoing development to become a full sync solution. However, any bug reports will be addressed and fixed if I can, JS is not my main language.

## Features

- Copy Raindrops from a Raindrop.io collection to a local bookmark folder.
- Built-in rate limiting to comply with Raindrop.io's rate limits.

## Known Bugs

- The text that updates during sync to inform about the ongoing process may not run correctly at the end of the fetching process.

## Setting Up Raindrop-Sortof-Sync Chrome Extension

1. **Raindrop.io Integration Setup:**
   - Log in to Raindrop.io and navigate to your account settings.
   - Click on 'Integrations' and in the 'For Developers' seciton create a new App and give it a random name
   - Copy the Client Secret.
     ![App screen in Raindrop.io](url_to_image)

2. **Extension Options:**
   - Install the extension
   - Pin the extension to the taskbar and right-click.
   - Choose 'Options' from the context menu.

3. **Client Secret Configuration:**
   - Paste the Client Secret into the Access Token box.
     ![Access Token Box](url_to_image)

4. **Select Raindrop Collection:**
   - Click 'Refresh Collections' to view your Raindrop.io collections.
   - Choose a collection and click 'Save Collection.'
     ![Collection Box](url_to_image)

5. **Select Local Bookmark Folder:**
   - In the 'Select Local Folder' box, click 'Refresh Folders.'
   - Choose the desired local folder for your bookmarks.
   - Click 'Save Folder.'
     ![Select Folder Box](url_to_image)

6. **Sync Bookmarks:**
   - In the 'Sync Bookmarks' section, press the 'Sync' button.
   - This action is destructive and will clear the selected folder before bringing in items from the chosen Raindrop.io collection.
     ![Sync Bookmarks Box](url_to_image)

**Note:** Ensure the accuracy of your actions as this process is irreversible.

## Bug Reporting

If you encounter any issues or bugs, please [submit a bug report](#) to help us improve the extension.

## License

This project is licensed under the [MIT License](LICENSE.md) - see the [LICENSE.md](LICENSE.md) file for details.