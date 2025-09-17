"use client";
import React from 'react';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';
import { Home, Sparkles, FolderOpen, User, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

function getNavItems(user) {
	return [
		{ key: 'welcome', label: 'Home', icon: Home },
		{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ key: 'results', label: 'Internships', icon: Sparkles },
		{ key: 'submitted-applications', label: 'Applications', icon: FolderOpen },
		...(user ? [{ key: 'profile-settings', label: 'Profile', icon: User }] : []),
	];
}

export function BottomNav({ currentView }) {
	const router = useRouter();
	const { user } = useUser();
	const navMap = {
		'welcome': '/',
		'dashboard': '/dashboard',
		'results': '/internships',
		'submitted-applications': '/applications',
		'profile-settings': '/profile',
	};
	const items = getNavItems(user);
	return (
		<nav className="fixed bottom-0 left-0 w-full max-w-screen bg-white border-t border-gray-200 shadow-lg z-50 md:hidden flex justify-around items-center py-2 overflow-x-auto">
			<ul className="flex justify-around items-stretch w-full">
				{items.map(item => {
					const ActiveIcon = item.icon;
					const active = (item.key === currentView) || (item.key === 'welcome' && currentView === 'login');
					return (
						<li key={item.key} className="flex-1">
							<button
								onClick={() => router.push(navMap[item.key] || '/')}
								className={clsx('w-full flex flex-col items-center justify-center text-xs font-medium transition-colors py-2', active ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600')}
							>
								<ActiveIcon className={clsx('w-5 h-5 mb-0.5', active && 'fill-blue-50')} />
								{item.label}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
