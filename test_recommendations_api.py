"""
Test script to verify recommendations API with sample skills
"""
import requests
import json

def test_recommendations():
    # Sample skills that would be extracted from a typical CS student resume
    test_skills = [
        {"name": "python", "confidence": 0.7},
        {"name": "java", "confidence": 0.8},
        {"name": "javascript", "confidence": 0.6},
        {"name": "html", "confidence": 0.7},
        {"name": "css", "confidence": 0.6},
        {"name": "sql", "confidence": 0.5},
        {"name": "git", "confidence": 0.7},
        {"name": "data structures", "confidence": 0.6}
    ]
    
    print("🧪 Testing Recommendations API")
    print("=" * 60)
    print(f"\n📊 Test Skills ({len(test_skills)}):")
    for skill in test_skills:
        print(f"  • {skill['name']}: {skill['confidence']*100:.0f}% confidence")
    
    print(f"\n🎯 Target Role: Software Engineer")
    print("\n⏳ Sending request to API...")
    
    try:
        response = requests.post(
            'http://localhost:8000/api/recommendations',
            json={
                "skills": test_skills,
                "target_role": "software engineer"
            },
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n✅ API Response Successful!")
            print("=" * 60)
            print(f"\n📈 Readiness Score: {data['readiness_score']}%")
            print(f"🎓 Target Role: {data['target_role']}")
            
            summary = data['summary']
            print(f"\n📚 Summary:")
            print(f"  • Skills Needed: {summary['total_skills_needed']}")
            print(f"  • Current Skills: {summary['current_skills']}")
            print(f"  • Courses Available: {summary['courses_available']}")
            print(f"  • Videos Available: {summary['videos_available']}")
            
            recommendations = data['recommendations']
            print(f"\n🎯 Recommendations ({len(recommendations)}):")
            
            for i, rec in enumerate(recommendations[:5], 1):  # Show first 5
                print(f"\n  {i}. {rec['skill_name'].upper()}")
                print(f"     Phase: {rec['phase']} | Priority: {rec['priority']}")
                print(f"     Reason: {rec['reason']}")
                print(f"     Courses: {len(rec['courses'])}")
                print(f"     Videos: {len(rec['videos'])}")
                
                if rec['courses']:
                    print(f"     Sample Course: {rec['courses'][0]['title']} ({rec['courses'][0]['platform']})")
                if rec['videos']:
                    print(f"     Sample Video: {rec['videos'][0]['title']} - {rec['videos'][0]['channel']}")
            
            if len(recommendations) > 5:
                print(f"\n  ... and {len(recommendations) - 5} more recommendations")
            
            print("\n" + "=" * 60)
            print("✅ Test Complete! Recommendations API is working correctly.")
            
        else:
            print(f"\n❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == '__main__':
    test_recommendations()
