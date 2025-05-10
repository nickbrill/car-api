document.addEventListener("DOMContentLoaded", function () {
  const root = document.getElementById("auction-search-app");
  if (!root || root.dataset.loaded) return;
  root.dataset.loaded = "true";
  root.innerHTML = ""; // Clear "Loading..." text

  const API_URL = "https://car-api-mss9.onrender.com/cars";
  let currentIndex = 0;
  const RESULTS_PER_PAGE = 20;

  const makeModelMap = {
    "Daihatsu": ["Terios", "Mira", "Tanto", "Move"],
    "Honda": ["CR-V", "S2000", "Fit", "Accord", "Civic"],
    "Mazda": ["RX-7", "MX-5", "Mazda3", "CX-5", "Mazda6"],
    "Mitsubishi": ["Lancer", "Outlander", "Delica", "Pajero", "Eclipse"],
    "Nissan": ["Note", "Skyline", "Elgrand", "March", "Silvia"],
    "Subaru": ["Legacy", "Forester", "Outback", "BRZ", "Impreza"],
    "Suzuki": ["Wagon R", "Jimny", "Swift", "Alto", "Vitara"],
    "Toyota": ["Crown", "Supra", "Land Cruiser", "Corolla", "Prius"]
  };

  // Build search form
  const form = document.createElement("form");
  form.innerHTML = `
<div class="search-container">
  <div style='display: flex; flex-wrap: wrap; gap: 10px;'>
      <select id="make"><option value="">Make</option>${Object.keys(makeModelMap).map(make => `<option value="${make}">${make}</option>`).join("")}</select>
      <select id="model"><option value="">Model</option></select>
      <select id="yearFrom"><option value="">Year From</option>${Array.from({ length: 76 }, (_, i) => 2025 - i).map(y => `<option value="${y}">${y}</option>`).join('')}</select>
      <select id="yearTo"><option value="">Year To</option>${Array.from({ length: 76 }, (_, i) => 2025 - i).map(y => `<option value="${y}">${y}</option>`).join('')}</select>
      <select id="transmission">
        <option value="">Transmission</option>
        <option value="Automatic">Automatic</option>
        <option value="Manual">Manual</option>
        <option value="CVT">CVT</option>
      </select>
      <select id="auctionDate">
        <option value="">Auction Date</option>
        <option value="Today">Today</option>
        <option value="Future">Future</option>
        <option value="Past">Past</option>
      </select>
      <button type="submit">Search</button>
  </div>
</div>
`;

  const results = document.createElement("div");
  results.id = "results";
  results.style.marginTop = "20px";

  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.textContent = "Load More";
  loadMoreBtn.style.display = "none";
  loadMoreBtn.style.margin = "20px auto";
  loadMoreBtn.style.padding = "10px 20px";

  root.appendChild(form);
  root.appendChild(results);
  root.appendChild(loadMoreBtn);

  // Add sorting dropdown above the results section
  const sortingContainer = document.createElement("div");
  sortingContainer.style.margin = "20px 0";
  sortingContainer.style.display = "none"; // Initially hidden until results are displayed
  sortingContainer.innerHTML = `
    <label for="sortResults" style="margin-right: 10px;">Sort By:</label>
    <select id="sortResults">
      <option value="">Select</option>
      <option value="priceAsc">Price: Low to High</option>
      <option value="priceDesc">Price: High to Low</option>
      <option value="yearAsc">Year: Old to New</option>
      <option value="yearDesc">Year: New to Old</option>
      <option value="mileageAsc">Mileage: Low to High</option>
      <option value="mileageDesc">Mileage: High to Low</option>
    </select>
  `;
  root.insertBefore(sortingContainer, results);

  document.getElementById("make").addEventListener("change", function () {
    const selectedMake = this.value;
    const modelDropdown = document.getElementById("model");
    modelDropdown.innerHTML = '<option value="">Model</option>';
    if (makeModelMap[selectedMake]) {
      makeModelMap[selectedMake].forEach(model => {
        modelDropdown.innerHTML += `<option value="${model}">${model}</option>`;
      });
    }
  });

  let filteredCars = [];
  let allCars = [];

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    currentIndex = 0;
    results.innerHTML = "";
    sortingContainer.style.display = "none"; // Hide sorting dropdown until results are displayed

    const filters = {
      make: document.getElementById("make").value,
      model: document.getElementById("model").value,
      yearFrom: document.getElementById("yearFrom").value,
      yearTo: document.getElementById("yearTo").value,
      transmission: document.getElementById("transmission").value,
      auctionDate: document.getElementById("auctionDate").value
    };

    // Build query string
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });

    fetch(`${API_URL}?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        console.log("API Response:", data); // Log the API response
        filteredCars = data;

        if (filteredCars.length === 0) {
          results.innerHTML = "<p>No cars found matching your criteria.</p>";
        } else {
          sortingContainer.style.display = "block"; // Show sorting dropdown
          displayNextBatch();
        }
      })
      .catch(err => {
        console.error("Failed to load data", err);
        results.innerHTML = "<p>Error loading data.</p>";
      });
  });

  document.getElementById("sortResults").addEventListener("change", function () {
    const sortBy = this.value;

    if (sortBy) {
      filteredCars.sort((a, b) => {
        if (sortBy === "priceAsc") {
          return (a["Starting Price (JPY)"] || 0) - (b["Starting Price (JPY)"] || 0);
        } else if (sortBy === "priceDesc") {
          return (b["Starting Price (JPY)"] || 0) - (a["Starting Price (JPY)"] || 0);
        } else if (sortBy === "yearAsc") {
          return (a.Year || 0) - (b.Year || 0);
        } else if (sortBy === "yearDesc") {
          return (b.Year || 0) - (a.Year || 0);
        } else if (sortBy === "mileageAsc") {
          return (a["Mileage (km)"] || 0) - (b["Mileage (km)"] || 0);
        } else if (sortBy === "mileageDesc") {
          return (b["Mileage (km)"] || 0) - (a["Mileage (km)"] || 0);
        }
      });

      currentIndex = 0;
      results.innerHTML = ""; // Clear current results
      displayNextBatch();
    }
  });

  function displayNextBatch() {
    const nextSlice = filteredCars.slice(currentIndex, currentIndex + RESULTS_PER_PAGE);
    nextSlice.forEach(car => {
      const card = document.createElement("div");
      card.className = "car-listing";
      card.style.cssText = `
        border: 1px solid #e0e0e0;
        padding: 0;
        margin-bottom: 15px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        overflow: hidden;
      `;

      const price = car["Starting Price (JPY)"]
        ? new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(car["Starting Price (JPY)"])
        : "N/A";

      const carId = car.id || car._id || `${car.Make}-${car.Model}-${car.Year}`;

      card.innerHTML = `
        <div style="position: relative;">
          <img src="${car["Image URL"] || ""}" alt="${car.Make || ""} ${car.Model || ""}" 
              style="width: 100%; height: 240px; object-fit: cover;" loading="lazy" />
        </div>
        <div style="padding: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 1.2em; color: #333;">
              ${car.Year} ${car.Make} ${car.Model}
            </h3>
            <div style="font-size: 1.3em; font-weight: bold; color: #2b79d0;">
              ${price}
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #666; font-size: 0.9em;">📅 Year</span>
              <span style="font-weight: 500;">${car.Year || "N/A"}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #666; font-size: 0.9em;">⚙️ Trans</span>
              <span style="font-weight: 500;">${car.Transmission || "N/A"}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #666; font-size: 0.9em;">🛣️ ODO</span>
              <span style="font-weight: 500;">${car["Mileage (km)"] || "N/A"} km</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #666; font-size: 0.9em;">⛽ Fuel</span>
              <span style="font-weight: 500;">${car["Fuel Type"] || "N/A"}</span>
            </div>
          </div>
          <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 12px;">
            <button onclick="window.location.href='/car-details/?id=${carId}'" 
                style="background: #2b79d0; color: white; border: none; padding: 10px 0; 
                border-radius: 4px; cursor: pointer; width: 100%; font-weight: 500;">
              More Details
            </button>
          </div>
        </div>
      `;
      results.appendChild(card);
    });
    currentIndex += RESULTS_PER_PAGE;
    loadMoreBtn.style.display = currentIndex < filteredCars.length ? "block" : "none";
  }
});