import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    # Login as admin seed user
    email = "admin_seed@test.com"
    password = "password123"
    data = {"username": email, "password": password}
    try:
        res = requests.post(f"{BASE_URL}/auth/token", data=data)
        if res.status_code == 200:
            return res.json()["access_token"]
        print(f"Login failed: {res.text}")
    except Exception as e:
        print(f"Connection failed: {e}")
    return None

def seed_articles():
    token = get_token()
    if not token:
        print("Skipping seed: No token")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    articles = [
        {
            "title": "Understanding Neurodiversity in the Workplace",
            "summary": "A primer on what neurodiversity is and why it matters for modern teams.",
            "content": """
# Neurodiversity: A Competitive Advantage

Neurodiversity refers to the natural variation in the human brain regarding sociability, learning, attention, mood and other mental functions.

## Why it matters
Teams with neurodivergent members (Autism, ADHD, Dyslexia, etc.) are often 30% more productive than neurotypical ones when properly supported. They bring unique perspectives:
- **Pattern recognition**
- **Hyper-focus**
- **Creativity**

## Getting Started
The first step is moving from "awareness" to "acceptance". This means creating psychological safety where differences are celebrated, not just tolerated.
            """,
            "author": "Dr. Sarah Miller",
            "category": "Neurodiversity 101",
            "tags": ["Inclusion", "Basics"],
            "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800"
        },
        {
            "title": "The Sensory-Friendly Office",
            "summary": "Practical steps to adjust your physical and digital environment for sensory needs.",
            "content": """
# Audit Your Environment

For many neurodivergent individuals, the physical environment can be a source of stress.

## Lighting
Fluorescent lights can be physically painful for some.
- **Solution**: Offer natural light zones or dimmable LEDs.

## Noise
Open offices are often overwhelming.
- **Solution**: Create "quiet zones" or provide noise-cancelling headphones as a standard perk (see our Solutions Catalog).

## Digital Clutter
Reduce slack notifications and email storms. Asynchronous communication is often preferred.
            """,
            "author": "Alex Chen",
            "category": "Accommodations",
            "tags": ["Environment", "Sensory"],
            "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
        },
        {
            "title": "Inclusive Hiring: Rethinking the Interview",
            "summary": "Standard interviews often screen out great candidates. Here's how to fix it.",
            "content": """
# Beyond the "Culture Fit"

Traditional interviews rely heavily on social mirroring and rapid-fire verbal processing, which can disadvantage autistic candidates.

## 1. Share Questions in Advance
Sending questions 24 hours ahead reduces anxiety and allows candidates to show their best thinking.

## 2. Focus on Work Samples
Instead of "Tell me about a time...", ask candidates to solve a real problem relevant to the role.

## 3. Clear Instructions
Avoid idioms and vague questions. Be literal and specific about what you are looking for.
            """,
            "author": "Teamworkz HR",
            "category": "Hiring",
            "tags": ["Recruiting", "Interviewing"],
            "image_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
        }
    ]

    for article in articles:
        res = requests.post(f"{BASE_URL}/api/learning/", json=article, headers=headers)
        if res.status_code == 200:
            print(f"Created article: {article['title']}")
        else:
            print(f"Failed to create {article['title']}: {res.text}")

if __name__ == "__main__":
    seed_articles()
