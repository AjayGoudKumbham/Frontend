import React, { useEffect, useState } from 'react';
import { UserCircle2 } from 'lucide-react';
import evernorth from "../assets/evernorth.jpg"; 
import axios from 'axios';

// Define the type for the user object
interface User {
  name: string;
  memberId: string;
}

function Welcome() {
  const [user, setUser] = useState<User | null>(null); // Explicitly typing the state

  // Fetch user details from the backend
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Directly retrieve the token (assuming it's always present)
        const token = localStorage.getItem('token');

        const response = await axios.get('http://localhost:8080/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        // Access response data properly
        setUser({
          name: response.data.fullName,
          memberId: response.data.memberId,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserDetails();
  }, []);
  
  const heroImageStyle: React.CSSProperties = {
    backgroundImage: `url(${evernorth})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  if (!user) {
    return <div>Loading...</div>; // Show loading state while fetching
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Image */}
          <div 
            className="h-64"
            style={heroImageStyle} 
          />
          
          {/* Content */}
          <div className="p-8">
            <div className="flex items-center justify-center -mt-20">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <UserCircle2 size={64} className="text-teal-600" />
              </div>
            </div>
            <div className="text-center mt-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Welcome, {user.name}!
              </h1>
              <p className="text-gray-600 mb-8">
                A user-friendly platform to manage your health, track issues, and make payments
              </p>
              <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-6 rounded-xl inline-block">
                <p className="text-teal-100 text-sm">MEMBER ID</p>
                <p className="text-white text-2xl font-mono tracking-wider">
                  {user.memberId}
                </p>
              </div>
              <div className="mt-8"> {/* Slightly reduced margin-top */}
                <a 
                  href="/profile-setup" 
                  className="px-6 py-2 bg-teal-600 text-white rounded-md shadow-md hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                >
                  Go to Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
