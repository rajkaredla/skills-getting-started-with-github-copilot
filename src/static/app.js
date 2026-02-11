document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Fetch and display activities
  async function loadActivities() {
    try {
      const response = await fetch("/activities");
      const data = await response.json();

      const activitiesList = document.getElementById("activities-list");
      const activitySelect = document.getElementById("activity");

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(data).forEach(([activityName, details]) => {
        // Create activity card
        const card = document.createElement("div");
        card.className = "activity-card";

        const participantsList = details.participants
          .map(email => `<li>${email}</li>`)
          .join("");

        card.innerHTML = `
          <h4>${activityName}</h4>
          <p><strong>Description:</strong> ${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Spots Available:</strong> ${details.max_participants - details.participants.length}/${details.max_participants}</p>
          <div class="participants-section">
            <strong>Registered Participants (${details.participants.length}):</strong>
            <ul class="participants-list">
              ${participantsList || '<li class="no-participants">No participants yet</li>'}
            </ul>
          </div>
        `;

        activitiesList.appendChild(card);

        // Add to activity select dropdown
        const option = document.createElement("option");
        option.value = activityName;
        option.textContent = activityName;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading activities:", error);
      document.getElementById("activities-list").innerHTML = 
        "<p>Error loading activities. Please refresh the page.</p>";
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    const messageDiv = document.getElementById("message");

    if (!activity) {
      messageDiv.textContent = "Please select an activity";
      messageDiv.className = "message error";
      return;
    }

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });

      const data = await response.json();

      if (response.ok) {
        messageDiv.textContent = data.message;
        messageDiv.className = "message success";
        document.getElementById("signup-form").reset();
        loadActivities(); // Refresh the activities list
      } else {
        messageDiv.textContent = data.detail || "Error signing up";
        messageDiv.className = "message error";
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error signing up. Please try again.";
      messageDiv.className = "message error";
    }

    messageDiv.classList.remove("hidden");
  });

  // Load activities on page load
  loadActivities();
});
