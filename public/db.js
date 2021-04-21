let db;
//database
let budgetVersion;

// Create a new db

const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  //old to new
  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    //mongo db add
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

//if error happens
request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('check db invoked');

  // Opens BudgetStore db
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  //access BudgetStore
  const store = transaction.objectStore('BudgetStore');

  // Get all records
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    // Add bulk
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
        
          if (res.length !== 0) {
            // makes another BS
            transaction = db.transaction(['BudgetStore'], 'readwrite');

            // assign in BS
            const currentStore = transaction.objectStore('BudgetStore');

            // Clears
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

//checks db 
request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // online check
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  //BudgetStore object store
  const store = transaction.objectStore('BudgetStore');

  // Add record
  store.add(record);
};

// app coming back online
window.addEventListener('online', checkDatabase);