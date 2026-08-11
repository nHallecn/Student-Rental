import type { RentalUnitSummary } from '@student-rental/contracts';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RentalCard } from '@/components/RentalCard';
import { Screen } from '@/components/Screen';
import { EmptyView, LoadingView } from '@/components/StateView';
import { apiRequest } from '@/lib/api';
import { useSession } from '@/store/session';

export default function SavedTab() { const user = useSession((state) => state.user); const saved = useQuery({ queryKey: ['favourites'], queryFn: () => apiRequest<{ items: RentalUnitSummary[] }>('/favourites', {}, true), enabled: user?.role === 'STUDENT' }); if (!user) return <EmptyView title="Sign in to save homes" message="Your shortlist stays linked to your account." actionLabel="Sign in" onAction={() => router.push('/auth/sign-in')} />; if (saved.isLoading) return <LoadingView label="Loading saved homes..." />; return <Screen>{saved.data?.items.length ? saved.data.items.map((unit) => <RentalCard key={unit.id} unit={unit} />) : <EmptyView title="No saved homes" message="Open a property and tap Save rental to build your shortlist." actionLabel="Explore homes" onAction={() => router.push('/universities')} />}</Screen>; }

