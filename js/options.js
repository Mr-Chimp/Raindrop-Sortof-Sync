const collectionsInterface = {
  collectionSelect: document.getElementById('collectionSelect'),
  saveCollectionButton: document.getElementById('saveCollectionButton'),
  fetchCollectionButton: document.getElementById('fetchCollections'),
  collectionContainer: document.getElementById('collectionContainer'),
  currentCollection: document.getElementById('currentCollection'),
  chosenCollection: 0,

  saveSelectedCollection: function() {
    const selectedCollection = this.collectionSelect.value;
    chrome.storage.sync.set({ 'selectedCollection': selectedCollection }, () => {
      console.log('Selected collection saved:', selectedCollection);

      this.collectionContainer.classList.remove('hide');
      this.currentCollection.textContent = selectedCollection;
      this.chosenCollection = parseInt(selectedCollection, 10);
    });
  },

  fetchCollections: (accessToken) => {
    fetch('https://api.raindrop.io/rest/v1/collections', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + tokenInterface.accessTokenInput.value
        }
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        // Populate the collectionSelect element with the fetched collections
        data.items.forEach(collection => {
            const option = document.createElement('option');
            option.value = collection._id;
            option.textContent = collection.title;
            collectionSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.log('Error:', error);
      });
  }
}

const folderInterface = {
  folderSelect: document.getElementById('folderSelect'),
  saveFolderButton: document.getElementById('saveFolder'),
  fetchFolderButton: document.getElementById('refreshFolders'),
  folderContainer: document.getElementById('folderContainer'),
  currentfolderID: document.getElementById('folderID'),
  chosenFolder: 0,

  saveSelectedFolder: function() {
    const selectedFolder = this.folderSelect.value;
    chrome.storage.sync.set({ 'selectedFolder': selectedFolder }, () => {
      console.log('Selected folder saved:', selectedFolder);

      this.folderContainer.classList.remove('hide');
      this.currentfolderID.textContent = selectedFolder;
      this.chosenFolder = parseInt(selectedFolder, 10);
    });
  },

  fetchFolders: () => {
    // Clear existing options
    folderInterface.folderSelect.innerHTML = '';

    // Fetch all bookmarks tree
    chrome.bookmarks.getTree((bookmarks) => {
      const folders = [];

      // Recursive function to traverse the bookmarks tree
      const extractFolders = (node) => {
        if (node.children) {
          node.children.forEach((child) => {
            if (child.url) {
              // Ignore bookmarks, only consider folders
              return;
            }

            folders.push({
              id: child.id,
              title: child.title,
            });

            extractFolders(child);
          });
        }
      };

      // Start the extraction
      bookmarks.forEach((bookmarkTree) => {
        extractFolders(bookmarkTree);
      });

      // Populate the select box with folder options
      folders.forEach((folder) => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.title;
        folderInterface.folderSelect.appendChild(option);
      });
    });
  }
}

const utils = {
  progressBar: document.getElementById('progress-bar'),

  updateProgress: (current, total) => {
    const progress = (current / total) * 100;
    utils.progressBar.style.width = `${progress}%`;
  },

  arrayToHTMLList: (array) =>{
    if (!Array.isArray(array) || array.length === 0) {
        return '';
    }
  
    return `<ul>${array.map(item => `<li>${item.title}${utils.arrayToHTMLList(item.children)}</li>`).join('')}</ul>`;
  },
  
  flattenItems: (items) => {
    const flattenedItems = [];
  
    function flatten(item) {
      flattenedItems.push(item);
  
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          flatten(child);
        });
      }
    }
  
    items.forEach(item => {
      flatten(item);
    });
  
    return flattenedItems;
  }
  
}

const tokenInterface = {
  accessTokenInput: document.getElementById('accessToken'),
  saveTokenButton: document.getElementById('saveTokenButton')
}

const syncInterface = {
  syncFoldersButton: document.getElementById('syncFolders'),
  syncStatus: document.getElementById('task-status'),
  currentAction: document.getElementById('currentAction'),

  populateBookmarks: async (items) => {
    this.currentAction.textContent = 'Create New Folders';
    await bookmarkUtils.createBookmarkFolders(folderInterface.chosenFolder.toString(), items);
    this.currentAction.textContent = 'Folders created :)';

    const flattenedItems = utils.flattenItems(items);

   // const requestsPerMinute = 120;
   // const rateLimit = 60 * 1000 / requestsPerMinute; // Convert minutes to milliseconds
    const maxRequestsPerInterval = 115; // Set to 5 less than the limit
    let currentIndex = 0;
    let requestCounter = 0;

    async function fetchDataForPage(item, page = 0) {
      // Use the bookmarkId stored in the item
      const parentId = item.bookmarkId;
      const perPage = 50;
      this.currentAction.textContent = `Fetch bookmarks from Raindrop ${item.id}?page=${page}&perpage=${perPage}`;
      const response = await fetch(`https://api.raindrop.io/rest/v1/raindrops/${item.id}?page=${page}&perpage=${perPage}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + tokenInterface.accessTokenInput.value
        }
      });
  
      const data = await response.json();
  
      // Process additional data
      for (const item of data.items) {
        await bookmarkUtils.createBookmark(String(parentId), item.title, item.link);
      }
      // Increment the request counter
      requestCounter++;
  
      // Check if the limit is reached
      if (requestCounter >= maxRequestsPerInterval) {
        // Reset the counter and wait for the remaining time in the rate limit interval
        requestCounter = 0;
        //Wait for 1 minute before carrying on
        this.currentAction.textContent = 'Wait for 1 minute';
        await new Promise(resolve => setTimeout(resolve, 60000));
      }

      // Check if there are more pages to fetch, page starts at 0 which messes up this calculation
      let tempPage = page+1; //Page is zero indexed, need to +1 to get proper checks
      const totalItemsProcessed = tempPage * perPage;
      console.log('Total items processed: ', totalItemsProcessed);
      console.log('Data Count: ', data.count);
      if (totalItemsProcessed < data.count) {
        // Move to the next page
        await fetchDataForPage(item, page + 1);
      } else {
        // Update progress and move to the next item
        utils.updateProgress(currentIndex + 1, flattenedItems.length);
        currentIndex++;
        if (currentIndex < flattenedItems.length) {
          fetchDataForPage(flattenedItems[currentIndex]);
        }
      }
    }
  
    // Start processing items
    if (currentIndex < flattenedItems.length) {
      await fetchDataForPage(flattenedItems[currentIndex]);
      //TODO - There is a bug here, this code runs earlier in the process than it should. Like it isn't waiting for fetchDataForPage to complete.
      //syncInterface.currentAction.textContent = 'All Done';
      //syncInterface.syncStatus.classList.add('hide');
    }

  },

  grabBookmarksAndPopulate: async function () {
    //Unhide the status bits
    this.syncStatus.classList.remove('hide');
    this.currentAction.textContent = 'Remove Folders';

    // Remove all bookmarks in folder ID '1' (bookmarks bar)
    await bookmarkUtils.removeBookmarksInFolder('1');

    let childCopy = [], childCollections = [], selectedItems = [], parentMap = {};

    // Here we are going to loop through the list of children, looking for everything that is in one particular collection
    fetch('https://api.raindrop.io/rest/v1/collections/childrens', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + tokenInterface.accessTokenInput.value
      }
    })
    .then(async (response) => {
      const data = await response.json();

      childCollections = data.items;

      function findChildren(parentId, items) {
        const children = items.filter(item => item.parent && item.parent.$id === parentId);

        // Create an array to store the children of the current parent
        const childrenArray = [];

        // Recursively call the function for each found child
        children.forEach(child => {
          let tmp = {
            id: child._id,
            title: child.title,
            children: []
          };

          // Recursively find and add children to the current child
          tmp.children = findChildren(tmp.id, items);

          // Add the current child to the array
          childrenArray.push(tmp);

        });

        return childrenArray;
      }

      // console.log(collectionsInterface.chosenCollection);

      selectedItems = findChildren(collectionsInterface.chosenCollection, childCollections);

      syncInterface.populateBookmarks(selectedItems);

    }); // End then
  }
}








document.addEventListener('DOMContentLoaded', function() {

    // Save access token
    tokenInterface.saveTokenButton.addEventListener('click', function() {
      const accessToken = tokenInterface.accessTokenInput.value;
      chrome.storage.sync.set({ 'accessToken': accessToken }, function() {
        console.log('Access token saved:', accessToken);
        collectionsInterface.fetchCollections(accessToken);
      });
    });

    // Load saved access token and selectedCollection
    chrome.storage.sync.get(['accessToken', 'selectedCollection','selectedFolder'], function(result) {
      if (result.accessToken) {
        tokenInterface.accessTokenInput.value = result.accessToken;
      
        // Load and populate collections only if an access token is saved
        if (result.selectedCollection) {
          // Show the selected collection
          collectionsInterface.collectionContainer.classList.remove('hide');
          collectionsInterface.currentCollection.textContent = result.selectedCollection;
          collectionsInterface.chosenCollection = parseInt(result.selectedCollection,10);
        } else {
          // Fetch and populate collections
          collectionsInterface.fetchCollections(result.accessToken);
        }
      }
      
      if(result.selectedFolder) {
        folderInterface.folderContainer.classList.remove('hide');
        folderInterface.currentfolderID.textContent = result.selectedFolder;
        folderInterface.chosenFolder = parseInt(result.selectedFolder,10);
      }
    });
  
    collectionsInterface.fetchCollectionButton.addEventListener('click', function() {
      // Call the fetchCollections method with the saved access token
      collectionsInterface.fetchCollections(tokenInterface.accessTokenInput.value);
    });
  
    // Save selected collection
    saveCollectionButton.addEventListener('click', function() {
      collectionsInterface.saveSelectedCollection();
    });

    folderInterface.fetchFolderButton.addEventListener('click', function() {
      // Call the fetchCollections method with the saved access token
      folderInterface.fetchFolders();
    });

    // Save selected collection
    folderInterface.saveFolderButton.addEventListener('click', function() {
      folderInterface.saveSelectedFolder();
    });

  
    // Save selected collection
    syncFolders.addEventListener('click', async function() {
      syncInterface.grabBookmarksAndPopulate();
    });
  });

//TODO:
//- Folders with large amounts of items it is missing some items. In a folder of 83 items it is missing 8 (the Want folder) and in To Download (505 items) it only has about 275
//- 