document.addEventListener('DOMContentLoaded', function () {
    const yearDropdown = document.getElementById('year');
    const currentYear = new Date().getFullYear();

    // Add options for current year and previous 4 years
    for (let i = 0; i < 5; i++) {
        const option = document.createElement('option');
        option.value = currentYear - i;
        option.textContent = currentYear - i;
        yearDropdown.appendChild(option);
    }

    document.getElementById('workingDaysForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const monthName = document.getElementById('month').value;
        const year = parseInt(document.getElementById('year').value);

        // Convert month name to month number
        const monthNumber = monthNameToNumber(monthName);

        try {
            const holidaysData = await fetchHolidays(monthNumber, year);
            const result = await calculateWorkingDays(monthNumber, year, holidaysData);
            displayResult(result, holidaysData, monthName);
            toggleButtonState();
        } catch (error) {
            console.error('Error:', error.message);
            document.getElementById('result').textContent = `Error: ${error.message}`;
        }
    });

    // document.getElementById('resetButton').addEventListener('click', function() {
    //     document.getElementById('workingDaysForm').reset();
    //     document.getElementById('result').textContent = '';
    //     toggleButtonState();
    // });
});

async function fetchHolidays(month, year) {
    try {
        const response = await fetch(`https://api-harilibur.vercel.app/api?month=${month}&year=${year}`);
        if (!response.ok) {
            throw new Error('Failed to fetch holidays');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

async function calculateWorkingDays(month, year, holidaysData) {
    try {
        // Input validation
        if (isNaN(month) || month < 1 || month > 12) {
            throw new Error('Invalid month. Month should be between 1 and 12.');
        }

        if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
            throw new Error('Invalid year. Year should be between 1900 and current year.');
        }

        // Function to get the number of working days in a month
        function getWorkingDays(year, month) {
            const totalDays = new Date(year, month, 0).getDate();
            const weekends = [0, 6]; // Sunday (0) and Saturday (6) are weekends
            let workingDays = 0;

            for (let i = 1; i <= totalDays; i++) {
                const currentDate = new Date(year, month - 1, i);
                if (!weekends.includes(currentDate.getDay())) {
                    workingDays++;
                }
            }

            return workingDays;
        }

        // Count the number of national holidays
        const nationalHolidays = holidaysData.filter(holiday => holiday.is_national_holiday).length;

        // Get the total number of working days in the month
        const totalWorkingDays = getWorkingDays(year, month);

        // Subtract national holidays from total working days
        const workingDaysAfterHolidays = totalWorkingDays - nationalHolidays;

        return {
            totalWorkingDays: workingDaysAfterHolidays,
            nationalHolidays: nationalHolidays
        };
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function getDayName(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex];
}

function getMonthName(monthName) {
    const months = {
        'January': 'Januari', 'February': 'Februari', 'March': 'Maret', 'April': 'April',
        'May': 'Mei', 'June': 'Juni', 'July': 'Juli', 'August': 'Agustus',
        'September': 'September', 'October': 'Oktober', 'November': 'November', 'December': 'Desember'
    };
    return months[monthName] || monthName;
}

function formatDateToIndonesian(dateString) {
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    const dayName = getDayName(dayIndex);
    const dateNumber = date.getDate();
    const monthName = getMonthName(date.toLocaleString('en-US', { month: 'long' }));
    const year = date.getFullYear();

    return `${dayName} ${dateNumber} ${monthName} ${year}`;
}

function displayResult(result, holidaysData, monthName) {
    monthName = toTitleCase(monthName); // Convert month name to title case
    const resultContainer = document.getElementById('result');
    resultContainer.innerHTML = ''; // Clear previous result

    // Display total working days after holidays
    const workingDaysParagraph = document.createElement('p');
    const indonesianMonth = getMonthName(monthName);
    workingDaysParagraph.textContent = `Total hari kerja di bulan ${indonesianMonth} adalah : ${result.totalWorkingDays} hari`;
    workingDaysParagraph.classList.add('result-heading');
    resultContainer.appendChild(workingDaysParagraph);

    // Filter national holidays that don't occur on weekends
    const nationalHolidays = holidaysData.filter(holiday => holiday.is_national_holiday && !isWeekend(new Date(holiday.holiday_date)));

    if (nationalHolidays.length > 0) {
        // Sort holidays by date in ascending order
        nationalHolidays.sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date));
        
        const holidaysList = document.createElement('ul');
    
        // Add header text before listing the holidays
        const headerText = document.createElement('p');
        headerText.textContent = 'Hari libur di hari kerja dalam bulan ini adalah:';
        resultContainer.appendChild(headerText);
    
        nationalHolidays.forEach(holiday => {
            const holidayItem = document.createElement('li');
            const indonesianDate = new Date(holiday.holiday_date);
            holidayItem.textContent = `${holiday.holiday_name} pada ${formatDateToIndonesian(indonesianDate)}`;
            holidaysList.appendChild(holidayItem);
        });
        resultContainer.appendChild(holidaysList);
    } else {
        const noHolidaysParagraph = document.createElement('p');
        noHolidaysParagraph.textContent = `Tidak ada hari libur Nasional di hari kerja dalam Bulan ini.`;
        resultContainer.appendChild(noHolidaysParagraph);
    }    
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday (0) and Saturday (6) are weekends
}

function toggleButtonState() {
    const calculateBtn = document.getElementById('calculateBtn');

    if (calculateBtn) {
        if (calculateBtn.style.display === 'none') {
            calculateBtn.style.display = 'inline-block';
        } else {
            calculateBtn.style.display = 'none';
        }
    }
}

function monthNameToNumber(monthName) {
    const months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    return months[monthName.toLowerCase()] || 1; // Default to 0 if month name is not found
}
