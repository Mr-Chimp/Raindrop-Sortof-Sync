const createBookmarkFolder = async (parentFolderId, folderTitle) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({ parentId: parentFolderId, title: folderTitle });
  });
};

// Add a bookmark for www.google.com
function addBookmark() {
  

  chrome.bookmarks.get('1').then((result) => {
    console.log(result);
  })
  

  chrome.bookmarks.create(
    {'parentId': '1', 'title': 'Extension bookmarks'},
    function(newFolder) {
      console.log("added folder: " + newFolder.title);
    },
  );

  chrome.bookmarks.create(
    {
      parentId: '1',
      title: 'Google',
      url: 'https://www.google.com'
    },
    () => {
      console.log('Bookmark added');
      location.reload(); // Refresh the popup
    }
  );
}

const createBookmark = async (folderId, bookmarkTitle, bookmarkUrl) => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({
      parentId: folderId,
      title: bookmarkTitle,
      url: bookmarkUrl,
    });
  });
};



// Function to recursively remove bookmarks and folders
function removeBookmarks(bookmarkNode) {
  if (bookmarkNode.children) {
    for (let child of bookmarkNode.children) {
      removeBookmarks(child);
    }
  }

  // Remove the bookmark or folder
  chrome.bookmarks.remove(bookmarkNode.id);
}

// Function to get all bookmarks in a folder
function removeBookmarksInFolder(folderId) {
  chrome.bookmarks.getSubTree(folderId, function (results) {
    if (results && results.length > 0 && results[0].children) {
      for (let child of results[0].children) {
        removeBookmarks(child);
      }
    } else {
      console.log('Folder not found or empty.');
    }
  });
}

function arrayToHTMLList(array) {
  if (!Array.isArray(array) || array.length === 0) {
      return '';
  }

  return `<ul>${array.map(item => `<li>${item.title}${arrayToHTMLList(item.children)}</li>`).join('')}</ul>`;
}

/**
 * Creates bookmark folders based on the given parent ID and items array, intended to be run with the collection folders built in the fetch statement on a sync
 *
 * @param {string} parentId - The ID of the parent bookmark folder.
 * @param {Array} items - An array of items representing the bookmark folders to be created.
 * @return {void} 
 */
function createBookmarkFolders(parentId, items) {
  const promises = items.map(item => {
    return new Promise(resolve => {
      chrome.bookmarks.create({ parentId, title: item.title }, bookmark => {
        item.bookmarkId = bookmark.id;
        if (item.children && item.children.length > 0) {
          createBookmarkFolders(bookmark.id, item.children)
            .then(() => resolve()); // Resolve the promise after processing children
        } else {
          resolve(); // Resolve the promise if there are no children
        }
      });
    });
  });

  return Promise.all(promises);
}

// Function to create additional bookmarks for each item

//TODO - Things to do
// - Creating bookmarks in sub folders doesn't seem to work 'Training Videos' - 42058901 is an example, probably just not looping correctly somewhere
// - Want to sort the array
// - Want to check each folder to ensure it is getting things correctly



document.addEventListener('DOMContentLoaded', function() {
    const accessTokenInput = document.getElementById('accessToken');
    const saveTokenButton = document.getElementById('saveTokenButton');
    const collectionSection = document.getElementById('collectionSection');
    const collectionSelect = document.getElementById('collectionSelect');
    const saveCollectionButton = document.getElementById('saveCollectionButton');
    const fetchCollectionButton = document.getElementById('fetchCollections');
    const syncFolders = document.getElementById('syncFolders');
    const outputContainer = document.getElementById('outputContainer');
    const progressBar = document.getElementById('progress-bar');

    let chosenCollection = 0;
  
    // Load saved access token
    chrome.storage.sync.get(['accessToken', 'selectedCollection'], function(result) {
      if (result.accessToken) {
        accessTokenInput.value = result.accessToken;
        collectionSection.style.display = 'block';
        // Load and populate collections only if an access token is saved
        if (result.selectedCollection) {
          // Show the selected collection
          // Example: Create a new DOM element to display the selected collection
          const selectedCollectionLabel = document.createElement('label');
          selectedCollectionLabel.textContent = 'Selected Collection: ' + result.selectedCollection;
          document.body.appendChild(selectedCollectionLabel);
          chosenCollection = parseInt(result.selectedCollection,10);
        } else {
          // Fetch and populate collections
          fetchCollections(result.accessToken);
        }
      }
    });
  
    // Save access token
    saveTokenButton.addEventListener('click', function() {
      const accessToken = accessTokenInput.value;
      chrome.storage.sync.set({ 'accessToken': accessToken }, function() {
        console.log('Access token saved:', accessToken);
        collectionSection.style.display = 'block';
        fetchCollections(accessToken);
      });
    });
  
    // Save selected collection
    saveCollectionButton.addEventListener('click', function() {
      const selectedCollection = collectionSelect.value;
      chrome.storage.sync.set({ 'selectedCollection': selectedCollection }, function() {
        console.log('Selected collection saved:', selectedCollection);
        // Optionally, display the selected collection on the page
        const selectedCollectionLabel = document.createElement('label');
        selectedCollectionLabel.textContent = 'Selected Collection: ' + selectedCollection;
        document.body.appendChild(selectedCollectionLabel);
      });
    });

    function updateProgress(current, total) {
      const progress = (current / total) * 100;
      progressBar.style.width = `${progress}%`;
    }

    async function populateBookmarks(items) {
      await createBookmarkFolders('1', items);

      const requestsPerMinute = 120;
      const rateLimit = 60 * 1000 / requestsPerMinute; // Convert minutes to milliseconds
      let currentIndex = 0;

      function processItem() {
        if (currentIndex < items.length) {
          const item = items[currentIndex];
          const perPage = 20;
         
          // Use the bookmarkId stored in the item
          const parentId = item.bookmarkId;

           // Function to handle fetching data for a specific page
          const fetchDataForPage = (page = 0) => {
            fetch(`https://api.raindrop.io/rest/v1/raindrops/${item.id}?page=${page}&perPage=${perPage}`, {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + accessTokenInput.value
              }
            })
            .then(response => response.json())
            .then(data => {
              // Process additional data
              data.items.forEach(item => {
                createBookmark(String(parentId), item.title, item.link);
              });

              // Check if there are more pages to fetch
              const totalItemsProcessed = page * perPage;
              if (totalItemsProcessed < data.count) {
                // Move to the next page
                fetchDataForPage(page + 1);
              }  else {
                // Update progress and move to the next item
                updateProgress(currentIndex + 1, items.length);

                // Move to the next item after the rate limit timeout
                setTimeout(() => {
                  currentIndex++;
                  processItem();
                }, rateLimit);
              }
            })
            .catch(error => {
              console.error('Error fetching additional data:', error);
              currentIndex++;
              processItem();
            });
          };

          fetchDataForPage();
  
       
        }
      }

      // Start processing items
      processItem();
    
    }


    fetchCollectionButton.addEventListener('click', function() {
        // Call the fetchCollections method with the saved access token
        fetchCollections(accessTokenInput.value);
      });
  
    // Save selected collection
    syncFolders.addEventListener('click', function() {
     
        //Remove all bookmarks in folder ID '1' (bookmarks bar)
        removeBookmarksInFolder('1');
       
/*
      let collectionsArray = [];
      // Call the fetchCollections method with the saved access token
      let response = fetch('https://api.raindrop.io/rest/v1/collections', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer '+accessTokenInput.value            
              }
        })
        .then(response => {
          return response.json()
        })
        .then(data => {
            //The root collections
            data.items.forEach(item => {
                collectionsArray.push({
                  id: item._id,
                  title: item.title,
                  children: []
                });
            });
        });
        */

      let childCopy = [], childCollections = [], selectedItems = [], parentMap = {};

    //Here we are going to loop through the list of children, looking for everything that is in one particular collection
    fetch('https://api.raindrop.io/rest/v1/collections/childrens', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + accessTokenInput.value
          }
    })
    .then(response => {
      return response.json();
    })
    .then(data => {

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
  

      selectedItems = findChildren(chosenCollection,childCollections);

      //Output the collections into a html structure for debug purposes
      //outputContainer.innerHTML = arrayToHTMLList(selectedItems);

      //Now we have all the children we need to loop through them and create bookmarks for them
      //createBookmarkFolders('1', selectedItems);
      populateBookmarks(selectedItems);
      
    }); //End then




  });


    // Function to fetch and populate collections
    function fetchCollections(accessToken) {
        fetch('https://api.raindrop.io/rest/v1/collections', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + accessToken
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


});