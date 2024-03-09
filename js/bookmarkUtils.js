const bookmarkUtils = {
    createBookmark: async (folderId, bookmarkTitle, bookmarkUrl) => {
        return new Promise((resolve, reject) => {
          chrome.bookmarks.create({
            parentId: folderId,
            title: bookmarkTitle,
            url: bookmarkUrl,
          }, (bookmark) => {
            // Resolve the promise with the created bookmark
            resolve(bookmark);
          });
        });
      },

      removeBookmarks: async (bookmarkNode) => {
        if (bookmarkNode.children) {
          for (let child of bookmarkNode.children) {
            await bookmarkUtils.removeBookmarks(child);
          }
        }
      
        // Remove the bookmark or folder
        await new Promise((resolve, reject) => {
            chrome.bookmarks.remove(bookmarkNode.id, () => {
              // Resolve the promise after removal is complete
              resolve();
            });
          });
      },

      removeBookmarksInFolder: async (folderId) => {
        return new Promise((resolve, reject) => {
          chrome.bookmarks.getSubTree(folderId, async (results) => {
            if (results && results.length > 0 && results[0].children) {
              for (let child of results[0].children) {
                // Wait for the removal of child bookmarks
                await bookmarkUtils.removeBookmarks(child);
              }
            } else {
              console.log('Folder not found or empty.');
            }
    
            // Resolve the promise after all bookmarks are removed
            resolve();
          });
        });
      },

      /**
         * Creates bookmark folders based on the given parent ID and items array, intended to be run with the collection folders built in the fetch statement on a sync
         *
         * @param {string} parentId - The ID of the parent bookmark folder.
         * @param {Array} items - An array of items representing the bookmark folders to be created.
         * @return {void} 
        */
        createBookmarkFolders: async (parentId, items) => {
            items.reverse()
            const promises = items.map(item => {
                return new Promise(resolve => {
                    chrome.bookmarks.create({ parentId, title: item.title }, bookmark => {
                    item.bookmarkId = bookmark.id;
                    if (item.children && item.children.length > 0) {
                        bookmarkUtils.createBookmarkFolders(bookmark.id, item.children)
                        .then(() => resolve()); // Resolve the promise after processing children
                    } else {
                        resolve(); // Resolve the promise if there are no children
                    }
                    });
                });
            });
        
            await Promise.all(promises);
        }
}; //End utility function