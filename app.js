const scheduleURL = 'https://ca.bytebloc.com/sk/Svc/getMasterSchedule/V5/BCEHS/BCEHS/d31648c6853e464aa71c9ff0be062f2a?format=XML';
const userURL = 'https://ca.bytebloc.com/sk/Svc/getUserDetails/V1/BCEHS/BCEHS/d31648c6853e464aa71c9ff0be062f2a?providersonly=false';

// Use AllOrigins to bypass CORS
const proxy = 'https://api.allorigins.win/get?url=';

function parseXML(xmlStr) {
  return new window.DOMParser().parseFromString(xmlStr, "text/xml");
}

function formatDateUTC(date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .split("T")[0];
}

async function fetchXML(url) {
  const response = await fetch(proxy + encodeURIComponent(url));
  const data = await response.json();
  return parseXML(data.contents);
}

async function loadSchedule() {
  try {
    const [scheduleXML, userXML] = await Promise.all([
      fetchXML(scheduleURL),
      fetchXML(userURL)
    ]);

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    const days = [formatDateUTC(today), formatDateUTC(tomorrow)];
    console.log("Looking for shifts on:", days);

    const users = {};
    userXML.querySelectorAll("User").forEach(user => {
      users[user.getAttribute("ID")] = user.getAttribute("FullName");
    });

    const scheduleRows = [];
    scheduleXML.querySelectorAll("Schedule").forEach(entry => {
      const startDate = entry.getAttribute("StartDate");
      const date = startDate.split("T")[0];

      if (!days.includes(date)) return;

      scheduleRows.push({
        name: users[entry.getAttribute("ProviderID")] || "Unknown",
        role: entry.getAttribute("Position"),
        location: entry.getAttribute("Location"),
        start: startDate.split("T")[1]?.substring(0, 5),
        end: entry.getAttribute("EndDate").split("T")[1]?.substring(0, 5)
      });
    });

    if (scheduleRows.length === 0) {
      document.getElementById("schedule").innerHTML = `<p>No shifts found for today or tomorrow.</p>`;
      return;
    }

    const tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Location</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          ${scheduleRows.map(row => `
            <tr>
              <td>${row.name}</td>
              <td>${row.role}</td>
              <td>${row.location}</td>
              <td>${row.start}</td>
              <td>${row.end}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;

    document.getElementById("schedule").innerHTML = tableHTML;

  } catch (err) {
    console.error("Error loading schedule:", err);
    document.getElementById("schedule").innerText = "Failed to load schedule.";
  }
}

loadSchedule();
