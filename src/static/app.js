document.addEventListener("DOMContentLoaded", () => {
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
          .map(email => `
            <li>
              <span class="participant-email">${email}</span>
              <button class="delete-btn" data-activity="${activityName}" data-email="${email}" title="Unregister">✕</button>
            </li>`)
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
        
        // Add event listeners to delete buttons
        card.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', handleDeleteParticipant);
        });

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

  // Handle participant deletion
  async function handleDeleteParticipant(e) {
    e.preventDefault();
    const btn = e.target;
    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!confirm(`Are you sure you want to unregister ${email} from ${activity}?`)) {
      return;
    }

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        messageDiv.textContent = data.message;
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");
        loadActivities();
      } else {
        messageDiv.textContent = data.detail || "Error unregistering";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error unregistering. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    if (!activity) {
      messageDiv.textContent = "Please select an activity";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
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
        await loadActivities(); // Refresh the activities list
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
