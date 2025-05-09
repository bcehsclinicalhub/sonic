const proxy = "https://api.allorigins.win/raw?url=";
const scheduleURL = proxy + encodeURIComponent("https://ca.bytebloc.com/sk/Svc/getMasterSchedule/V5/BCEHS/BCEHS/d31648c6853e464aa71c9ff0be062f2a?format=XML");
const userURL = proxy + encodeURIComponent("https://ca.bytebloc.com/sk/Svc/getUserDetails/V1/BCEHS/BCEHS/d31648c6853e464aa71c9ff0be062f2a?providersonly=false");

function parseXML(xmlStr) {
    return new window.DOMParser().parseFromString(xmlStr, "text/xml");
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

async function loadSchedule() {
    try {
        const [scheduleRes, userRes] = await Promise.all([
            fetch(scheduleURL),
            fetch(userURL)
        ]);

        const scheduleXML = parseXML(await scheduleRes.text());
        const userXML = parseXML(await userRes.text());

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const days = [formatDate(today), formatDate(tomorrow)];

        const users = {};
        userXML.querySelectorAll("User").forEach(user => {
            users[user.getAttribute("ID")] = user.getAttribute("FullName");
        });

        const scheduleRows = [];
        scheduleXML.querySelectorAll("Schedule").forEach(entry => {
            const date = entry.getAttribute("StartDate").split("T")[0];
            if (!days.includes(date)) return;

            scheduleRows.push({
                name: users[entry.getAttribute("ProviderID")] || "Unknown",
                role: entry.getAttribute("Position"),
                location: entry.getAttribute("Location"),
                start: entry.getAttribute("StartDate").split("T")[1]?.substring(0, 5),
                end: entry.getAttribute("EndDate").split("T")[1]?.substring(0, 5)
            });
        });

        if (scheduleRows.length === 0) {
            document.getElementById("schedule").innerText = "No schedule found for today or tomorrow.";
            return;
        }

        const tableHTML = `
            <table>
                <thead><tr><th>Name</th><th>Role</th><th>Location</th><th>Start</th><th>End</th></tr></thead>
                <tbody>
                    ${scheduleRows.map(row => `
                        <tr>
                            <td>${row.name}</td>
                            <td>${row.role}</td>
                            <td>${row.location}</td>
                            <td>${row.start}</td>
                            <td>${row.end}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
        document.getElementById("schedule").innerHTML = tableHTML;

    } catch (err) {
        console.error(err);
        document.getElementById("schedule").innerText = "Failed to load schedule.";
    }
}

loadSchedule();