"""
Tests for the Mergington High School Activities API
"""

import pytest


def test_root_redirect(client):
    """Test that root path redirects to static index.html"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert "/static/index.html" in response.headers["location"]


def test_get_activities(client):
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    
    # Check that activities dictionary is returned
    assert isinstance(data, dict)
    assert len(data) > 0
    
    # Check Basketball Team exists with expected structure
    assert "Basketball Team" in data
    assert "description" in data["Basketball Team"]
    assert "schedule" in data["Basketball Team"]
    assert "max_participants" in data["Basketball Team"]
    assert "participants" in data["Basketball Team"]


def test_signup_for_activity(client):
    """Test signing up a student for an activity"""
    response = client.post(
        "/activities/Soccer Club/signup?email=test@example.com"
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "test@example.com" in data["message"]


def test_signup_duplicate_student(client):
    """Test that a student cannot signup twice for the same activity"""
    email = "duplicate@example.com"
    
    # First signup should succeed
    response1 = client.post(
        f"/activities/Basketball Team/signup?email={email}"
    )
    assert response1.status_code == 200
    
    # Second signup should fail
    response2 = client.post(
        f"/activities/Basketball Team/signup?email={email}"
    )
    assert response2.status_code == 400
    assert "already signed up" in response2.json()["detail"]


def test_signup_nonexistent_activity(client):
    """Test signing up for a non-existent activity"""
    response = client.post(
        "/activities/Nonexistent Activity/signup?email=test@example.com"
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_unregister_from_activity(client):
    """Test unregistering a student from an activity"""
    email = "unregister@example.com"
    
    # First, sign up the student
    signup_response = client.post(
        f"/activities/Drama Club/signup?email={email}"
    )
    assert signup_response.status_code == 200
    
    # Then unregister them
    unregister_response = client.delete(
        f"/activities/Drama Club/unregister?email={email}"
    )
    assert unregister_response.status_code == 200
    assert "Unregistered" in unregister_response.json()["message"]
    
    # Verify they're not in the participants list
    activities_response = client.get("/activities")
    participants = activities_response.json()["Drama Club"]["participants"]
    assert email not in participants


def test_unregister_nonexistent_activity(client):
    """Test unregistering from a non-existent activity"""
    response = client.delete(
        "/activities/Nonexistent Activity/unregister?email=test@example.com"
    )
    assert response.status_code == 404


def test_unregister_not_registered_student(client):
    """Test unregistering a student who is not registered"""
    response = client.delete(
        "/activities/Basketball Team/unregister?email=notregistered@example.com"
    )
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]


def test_activity_participant_count(client):
    """Test that participant count is accurate"""
    # Get initial count
    response1 = client.get("/activities")
    initial_count = len(response1.json()["Programming Class"]["participants"])
    
    # Sign up a new student
    email = "counter@example.com"
    client.post(f"/activities/Programming Class/signup?email={email}")
    
    # Check updated count
    response2 = client.get("/activities")
    new_count = len(response2.json()["Programming Class"]["participants"])
    
    assert new_count == initial_count + 1
    assert email in response2.json()["Programming Class"]["participants"]


def test_multiple_activities(client):
    """Test that student can sign up for multiple different activities"""
    email = "multi@example.com"
    
    # Sign up for first activity
    response1 = client.post(
        f"/activities/Basketball Team/signup?email={email}"
    )
    assert response1.status_code == 200
    
    # Sign up for second activity
    response2 = client.post(
        f"/activities/Chess Club/signup?email={email}"
    )
    assert response2.status_code == 200
    
    # Verify in both activities
    activities = client.get("/activities").json()
    assert email in activities["Basketball Team"]["participants"]
    assert email in activities["Chess Club"]["participants"]
