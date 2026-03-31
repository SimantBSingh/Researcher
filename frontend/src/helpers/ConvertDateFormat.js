export default function formatDate(datetime) {
    const dateOrTextVal = (datetime.format('DD/MM/YYYY')).toString();

    const [day, month, year] = dateOrTextVal.split("/");

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayInt = parseInt(day, 10);

    let daySuffix = "th";
    if (dayInt % 10 === 1 && dayInt !== 11) {
        daySuffix = "st";
    } else if (dayInt % 10 === 2 && dayInt !== 12) {
        daySuffix = "nd";
    } else if (dayInt % 10 === 3 && dayInt !== 13) {
        daySuffix = "rd";
    }

    const formattedDate = `${dayInt}${daySuffix} ${monthNames[parseInt(month, 10) - 1]} ${year}`;

    return formattedDate;
}
