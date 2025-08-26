// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', function () {
    // --- Element References ---
    const yearDropdown = document.getElementById('year');
    const workingDaysForm = document.getElementById('workingDaysForm');
    const resultContainer = document.getElementById('result');
    const calculateButton = document.getElementById('calculateButton');

    // --- Initial Setup ---
    populateYearDropdown(yearDropdown);

    // --- Event Listeners ---
    workingDaysForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Show loading state
        calculateButton.textContent = 'Menghitung...';
        calculateButton.disabled = true;
        resultContainer.innerHTML = '';

        const monthName = document.getElementById('month').value;
        const year = parseInt(yearDropdown.value);
        const monthNumber = monthNameToNumber(monthName);

        try {
            const holidaysData = await fetchHolidays(monthNumber, year);
            const result = calculateWorkingDays(monthNumber, year, holidaysData);
            displayResult(result, holidaysData, monthName, year, resultContainer);
        } catch (error) {
            console.error('Error:', error.message);
            resultContainer.textContent = `Error: ${error.message}`;
        } finally {
            // Restore button state
            calculateButton.textContent = 'Kalkulasi';
            calculateButton.disabled = false;
        }
    });
});

// --- Core Functions ---

/**
 * Populates the year dropdown with 5 years, centered on the current year.
 * @param {HTMLSelectElement} dropdownElement The select element to populate.
 */
function populateYearDropdown(dropdownElement) {
    const currentYear = new Date().getFullYear();
    for (let i = 2; i >= -2; i--) {
        const yearValue = currentYear + i;
        const option = document.createElement('option');
        option.value = yearValue;
        option.textContent = yearValue;
        if (yearValue === currentYear) {
            option.selected = true;
        }
        dropdownElement.appendChild(option);
    }
}

/**
 * Fetches holiday data from the API.
 * @param {number} month The month number (1-12).
 * @param {number} year The year.
 * @returns {Promise<Array>} A promise that resolves to an array of holiday objects.
 */
async function fetchHolidays(month, year) {
    const response = await fetch(`https://api-harilibur.vercel.app/api?month=${month}&year=${year}`);
    if (!response.ok) {
        throw new Error('Gagal mengambil data hari libur. Silakan coba lagi.');
    }
    return await response.json();
}

/**
 * Calculates the number of working days in a given month and year.
 * @param {number} month The month number (1-12).
 * @param {number} year The year.
 * @param {Array} holidaysData Array of holiday objects.
 * @returns {{totalWorkingDays: number, nationalHolidays: number}} An object containing the results.
 */
function calculateWorkingDays(month, year, holidaysData) {
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
    }

    const nationalHolidaysOnWeekdays = holidaysData.filter(holiday => {
        const holidayDate = new Date(holiday.holiday_date);
        const holidayDayOfWeek = holidayDate.getDay();
        return holiday.is_national_holiday && holidayDayOfWeek !== 0 && holidayDayOfWeek !== 6;
    }).length;

    return {
        totalWorkingDays: workingDays - nationalHolidaysOnWeekdays,
        nationalHolidays: nationalHolidaysOnWeekdays
    };
}

// --- Display Functions ---

/**
 * Displays the calculation results in the specified container.
 * @param {object} result The result object from calculateWorkingDays.
 * @param {Array} holidaysData The raw holiday data from the API.
 * @param {string} monthName The name of the month.
 * @param {number} year The selected year.
 * @param {HTMLElement} container The HTML element to display the results in.
 */
function displayResult(result, holidaysData, monthName, year, container) {
    container.innerHTML = ''; // Clear previous results

    const indonesianMonth = getMonthName(toTitleCase(monthName));
    
    // Create and append the main result heading
    const workingDaysParagraph = document.createElement('p');
    workingDaysParagraph.textContent = `Total hari kerja di bulan ${indonesianMonth} ${year} adalah: ${result.totalWorkingDays} hari`;
    workingDaysParagraph.className = 'result-heading';
    container.appendChild(workingDaysParagraph);

    // Filter for national holidays that fall on a weekday
    const nationalHolidays = holidaysData.filter(holiday => 
        holiday.is_national_holiday && !isWeekend(new Date(holiday.holiday_date))
    );

    if (nationalHolidays.length > 0) {
        // Create and append the holiday list
        const headerText = document.createElement('p');
        headerText.textContent = 'Daftar hari libur nasional pada hari kerja:';
        container.appendChild(headerText);

        const holidaysList = document.createElement('ul');
        nationalHolidays
            .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
            .forEach(holiday => {
                const holidayItem = document.createElement('li');
                holidayItem.textContent = `${holiday.holiday_name} - ${formatDateToIndonesian(holiday.holiday_date)}`;
                holidaysList.appendChild(holidayItem);
            });
        container.appendChild(holidaysList);
    } else {
        const noHolidaysParagraph = document.createElement('p');
        noHolidaysParagraph.textContent = 'Tidak ada hari libur nasional pada hari kerja di bulan ini.';
        container.appendChild(noHolidaysParagraph);
    }
}


// --- Utility Functions ---

/**
 * Checks if a given date is a weekend.
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a weekend, false otherwise.
 */
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Converts a month name to its corresponding number.
 * @param {string} monthName The name of the month.
 * @returns {number} The month number (1-12).
 */
function monthNameToNumber(monthName) {
    const months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    return months[monthName.toLowerCase()] || 0;
}

/**
 * Converts a string to Title Case.
 * @param {string} str The string to convert.
 * @returns {string} The Title Cased string.
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Formats a date string into a full Indonesian date format.
 * @param {string} dateString The date string to format.
 * @returns {string} The formatted date string.
 */
function formatDateToIndonesian(dateString) {
    // The date string from the API is 'YYYY-MM-DD'.
    // Creating a new Date(dateString) can be unreliable as browsers
    // may interpret it as local time or UTC. To avoid the date shifting
    // by a day due to timezone differences, we parse the string manually
    // and create the date using UTC values.
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(Date.UTC(year, month, day));

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('id-ID', options);
}

/**
 * Gets the Indonesian name for a given English month name.
 * @param {string} monthName The English month name.
 * @returns {string} The Indonesian month name.
 */
function getMonthName(monthName) {
    const months = {
        'January': 'Januari', 'February': 'Februari', 'March': 'Maret', 'April': 'April',
        'May': 'Mei', 'June': 'Juni', 'July': 'Juli', 'August': 'Agustus',
        'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Desember'
    };
    return months[monthName] || monthName;
}
