import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type UserContextType = {
  dailyGoal: number;
  setDailyGoal: (val: number) => void;
  isLoaded: boolean;
};

const UserContext = createContext<UserContextType>({
  dailyGoal: 2200,
  setDailyGoal: () => {},
  isLoaded: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [dailyGoal, setDailyGoal] = useState<number>(2200);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Globally fetch user goal automatically on app boot
    const fetchGoal = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('users').select('daily_goal').eq('id', session.user.id).single();
        if (data && data.daily_goal) {
          setDailyGoal(data.daily_goal);
        }
      }
      setIsLoaded(true);
    };
    fetchGoal();

    // Re-fetch if they login seamlessly
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchGoal();
      else setIsLoaded(true); // If no session, it's "loaded" as guest/logged out
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ dailyGoal, setDailyGoal, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
