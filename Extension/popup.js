document.addEventListener("DOMContentLoaded", function () {
    const plusButton = document.getElementById("plus-button");
    const minusButton = document.getElementById("minus-button");
    const jobList = document.getElementById("job-list");
    const jobDescription = document.getElementById("job-description");
    const clickCountElement = document.getElementById("click-count");
    const showHideButton = document.getElementById("show-hide-button");
    const exportButton = document.getElementById("export-button");
  

    
    // Initialize an array to store job data
    let jobData = [];
    let clickCount = 0;
    let jobCount = 0;



    
    // Initially hide the job list and set the button text
    jobList.style.display = "none";
    showHideButton.textContent = "Show Job List";
  
    function updateJobData(tab) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const h1Element = document.querySelector(".t-24.t-bold.job-details-jobs-unified-top-card__job-title");
          const h1Content = h1Element ? h1Element.textContent.trim() : "N/A";
          const pageURL = window.location.href; // Get the URL of the current page
          chrome.runtime.sendMessage({ jobDescription: h1Content, jobLink: pageURL }); // Send the page URL along with job description
        },
      });
    }
    
  
    // Load saved job data and click count from local storage if available
    chrome.storage.local.get(["jobData", "clickCount"], function (result) {
      if (result.jobData) {
        jobData = result.jobData;
  
        for (const jobItem of jobData) {
          const jobLink = jobItem.jobLink;
          const jobDescriptionContent = jobItem.jobDescription;
          jobList.innerHTML += `<p>${jobDescriptionContent} <a href="${jobLink}" target="_blank">Link</a></p>`;
        }
      }
  
      if (result.clickCount !== undefined) {
        clickCount = result.clickCount;
        clickCountElement.textContent = `Click Count: ${clickCount}`;
      }
    });
  
    plusButton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        updateJobData(activeTab);
    
        clickCount++;
        clickCountElement.textContent = `Click Count: ${clickCount}`;
    
        // Save the click count to local storage
        chrome.storage.local.set({ clickCount: clickCount });
      });
    });
  
    minusButton.addEventListener("click", function () {
      jobData = [];
      jobList.innerHTML = "";
  
      // Clear the job data from local storage
      chrome.storage.local.remove("jobData");
  
      clickCount = 0;
      clickCountElement.textContent = `Click Count: ${clickCount}`;
  
      // Clear the click count from local storage
      chrome.storage.local.remove("clickCount");
    });
  
    chrome.runtime.onMessage.addListener(function (message) {
      if (message.jobDescription) {
        const jobDescriptionContent = message.jobDescription;
        const jobLink = message.jobLink || "#";
    
        // Create a new list item with a link
        const listItem = document.createElement("li");
        listItem.innerHTML = `${jobDescriptionContent} <a href="${jobLink}" target="_blank">Link</a>`;
    
        // Get the ordered list element
        const orderedList = document.getElementById("job-list");
    
        // Append the list item to the ordered list
        orderedList.appendChild(listItem);
    
        // Save the updated job data to local storage
        jobData.push({ jobDescription: jobDescriptionContent, jobLink });
        chrome.storage.local.set({ jobData: jobData });
      }
    });
  
    // Add a click event listener to the show-hide button
    showHideButton.addEventListener("click", function () {
      if (jobList.style.display === "none") {
        jobList.style.display = "block";
        showHideButton.textContent = "Hide Job List";
      } else {
        jobList.style.display = "none";
        showHideButton.textContent = "Show Job List";
      }
    });


    
  
// Function to export data to an Excel file
function exportToExcel() {
    const data = [['Job Description', 'Link']];
  
    // Add job data to the array
    for (const jobItem of jobData) {
      const jobLink = jobItem.jobLink;
      const jobDescriptionContent = jobItem.jobDescription;
      data.push([jobDescriptionContent, jobLink]);
    }
  
    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
  
    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Job Data');
  
    // Auto-expand cell widths
    const wscols = [{ wch: 50 }, { wch: 50 }];
    ws['!cols'] = wscols;
  
    // Export the workbook to a file
    XLSX.writeFile(wb, 'Applied.xlsx');
  }
  
  
  
  
  
  
  
  
  
    // Add an event listener to the "Export to Excel" button
    exportButton.addEventListener("click", exportToExcel);
  });
  