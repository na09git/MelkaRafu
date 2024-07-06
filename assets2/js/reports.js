$(document).ready(function () {
    // Initialize counts and total Birr amounts
    var paidCount = 0;
    var notPaidCount = 0;
    var totalBirr = 0;
    var weeklyTotalBirr = 0;
    var monthlyTotalBirr = 0;

    // Current date
    var currentDate = new Date();

    // Calculate the start date for the last 7 days starting from today
    var startDateLast7Days = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago in milliseconds

    // Calculate the start of the month starting from today
    var startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Loop through each row in the table
    $("#data_buy tbody tr").each(function () {
        // Find status and birr amount from each row
        var status = $(this).find("td:nth-child(9)").text().trim(); // Assuming status is in the 9th column
        var birr = parseFloat($(this).find("td:nth-child(8)").text().trim()); // Assuming birr is in the 8th column

        // Update counts and total Birr amounts
        if (status === "Paid") {
            paidCount++;
        } else {
            notPaidCount++;
        }
        totalBirr += birr;

        // Calculate the purchase date
        var dateString = $(this).find("td:nth-child(12)").text().trim(); // Assuming date is in the 12th column
        var purchaseDate = new Date(dateString);

        // If the purchase was made within the last 7 days (including today)
        if (purchaseDate >= startDateLast7Days && purchaseDate <= currentDate) {
            weeklyTotalBirr += birr;
        }

        // If the purchase was made within the current month
        if (
            purchaseDate.getMonth() === currentDate.getMonth() &&
            purchaseDate.getFullYear() === currentDate.getFullYear()
        ) {
            monthlyTotalBirr += birr;
        }
    });

    // Update the HTML elements with the counts and total Birr amounts
    $("#paidCount").text("Paid: " + paidCount);
    $("#notPaidCount").text("Not Paid: " + notPaidCount);
    $("#totalBirr").text("Total Amount (Birr): " + totalBirr.toFixed(2)); // Display total with 2 decimal places
    $("#weeklyTotalBirr").text("Weekly Total Amount (Birr): " + weeklyTotalBirr.toFixed(2)); // Display weekly total with 2 decimal places
    $("#monthlyTotalBirr").text("Monthly Total Amount (Birr): " + monthlyTotalBirr.toFixed(2)); // Display monthly total with 2 decimal places
});


