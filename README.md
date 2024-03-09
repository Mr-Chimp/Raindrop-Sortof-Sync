# Raindrop-Sortof-Sync

Raindrop-Sortof-Sync is a Chrome extension designed to facilitate the transfer of Raindrops from a Raindrop.io collection to a local bookmark folder in your browser. While it's not a full sync solution, the extension ensures a seamless copying process, complete with built-in rate limiting to adhere to Raindrop.io's rate limits.

**Development Status:** This extension is not intended for ongoing development to become a full sync solution. However, any bug reports will be addressed and fixed if I can, JS is not my main language.

**Important Note:**
- This extension operates with a developer authentication mechanic to keep the setup simple, and there are no plans to change this approach.

**Warning:**
- The sync process is destructive to the folder you select. It will clear out everything in the selected folder before bringing across items from the chosen Raindrop.io collection.
  - **Please take a backup of your bookmarks before initiating the sync.**

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
TODO - Actually do the license bits here
This project is licensed under the [MIT License](LICENSE.md) - see the [LICENSE.md](LICENSE.md) file for details.