document.addEventListener('DOMContentLoaded', function() {
    const accessTokenInput = document.getElementById('accessToken');
    const saveTokenButton = document.getElementById('saveTokenButton');
    const collectionSection = document.getElementById('collectionSection');
    const collectionSelect = document.getElementById('collectionSelect');
    const saveCollectionButton = document.getElementById('saveCollectionButton');
    const fetchCollectionButton = document.getElementById('fetchCollections');
    const syncFolders = document.getElementById('syncFolders');
    const outputContainer = document.getElementById('outputContainer');

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


    fetchCollectionButton.addEventListener('click', function() {
        // Call the fetchCollections method with the saved access token
        fetchCollections(accessTokenInput.value);
      });
  
    // Save selected collection
    syncFolders.addEventListener('click', function() {
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
        

      let childCopy = [], childCollections = [], selectedItems = [], parentMap = {};

      function arrayToHTMLList(array) {
        if (!Array.isArray(array) || array.length === 0) {
            return '';
        }
    
        return `<ul>${array.map(item => `<li>${item.title}${arrayToHTMLList(item.children)}</li>`).join('')}</ul>`;
    }
    
    function generateNestedList(items) {
      let result = '<ul>';
    
      items.forEach(item => {
        result += `<li>${item.title}`;
    
        if (item.children && item.children.length > 0) {
          // Recursively generate nested list for children
          result += generateNestedList(item.children);
        }
    
        result += '</li>';
      });
    
      result += '</ul>';
      return result;
    }
    

    //Here we are going to loop through the list of children, looking for everything that is in one particular collection
    fetch('https://api.raindrop.io/rest/v1/collections/childrens', {
      //fetch('https://api.raindrop.io/rest/v1/collection/'+chosenCollection, {
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

      outputContainer.innerHTML = generateNestedList(selectedItems);
      
    }); //End tehn



















/*

      //This code gets the children, loops through them and populates an arrya with the collections. It is incorrect hwoever
      //Now get this children and build the array:
      fetch('https://api.raindrop.io/rest/v1/collections/childrens', {
        //fetch('https://api.raindrop.io/rest/v1/collection/'+chosenCollection, {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + accessTokenInput.value
            }
      })
      .then(response => {
        return response.json();
      })
      .then(data => {

        function buildCollectionRecursively(items) {
          items.forEach((child, index) => {
            let tmp = {
              id: child._id,
              title: child.title,
              children: []
            }
  
            const parentIndex = collectionsArray.findIndex(item => item.id === child.parent.$id);
  
            
            // If the parent is found and has 'children' property, add the child to its children array
            if (parentIndex !== -1 && collectionsArray[parentIndex].hasOwnProperty('children')) {
                collectionsArray[parentIndex].children.push(tmp);
  
                // Remove the processed item from the copied array
                childCopy.splice(index, 1);
            } 
  
          }); //End data.items foreach
        }

        console.log('Direct Child Return',data.items);
        //Create a copy of the children
        childCopy = [...data.items];
        //Loop through the children and add them to the parent IF theirt parent exists in the root collection
        buildCollectionRecursively(data.items);

        console.log(childCopy);
        while (childCopy.length > 2) {
          // Your logic here
          console.log('While Loop');
          buildCollectionRecursively(data.items);
          console.log(childCopy);
        }
        //Now we need to recursively iterate through the remaining items to see if we can process them yet
        console.log("Complete",childCopy);

        //Find index of specific item
        const theIndex = collectionsArray.findIndex(item => item.id === 42053423);
        console.log('Missing Index:', theIndex);


        outputContainer.innerHTML = arrayToHTMLList(collectionsArray);


      })
      .catch(error => {
        console.log('Error:', error);
      })
      .finally(() => {
        
      });

      */
      

        
      //Load up the children collections
      /*chrome.storage.sync.get(['selectedCollection'], async function(result) {
          let collections = await fetchNestedCollections(null, result.selectedCollection);
          console.log("Results");
          console.log(collections);
      });
      */
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



    async function fetchNestedCollections(collectionsData, parentId) {
      try {
          if (!collectionsData) {
              const response = await fetch('https://api.raindrop.io/rest/v1/collections/childrens', {
                  method: 'GET',
                  headers: {
                      'Authorization': 'Bearer 11ed7fea-b703-4f47-83b7-595acc7d2660'
                  }
              });
              collectionsData = await response.json();
          }
  
          function getNestedCollections(collectionsData, parentId) {
              const nestedCollections = {};
              collectionsData.items.forEach(collection => {
                console.log(parentId);
                  //if (collection.parent && collection.parent.$id === parentId) {
                      const collectionId = collection._id;
                      const nested = getNestedCollections(collectionsData, collectionId);
                      collection.children = nested;
                      nestedCollections[collectionId] = collection;
                  //}
              });
              return Object.values(nestedCollections);
          }
  
          const rootCollections = getNestedCollections(collectionsData, parentId);
          return rootCollections;
      } catch (error) {
          console.error('Error fetching child collections:', error);
          return [];
      }
  }

});