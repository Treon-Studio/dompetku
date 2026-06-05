import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export type TTheme = 'light' | 'dark' | 'system';

export type TUiState = {
	readonly isSidebarOpen: boolean;
	readonly theme: TTheme;
};

export type TUiActions = {
	readonly toggleSidebar: () => void;
	readonly openSidebar: () => void;
	readonly closeSidebar: () => void;
	readonly setTheme: (theme: TTheme) => void;
};

export const useUiStore = create<TUiState & TUiActions>()((set) => ({
	// Initial state
	isSidebarOpen: false,
	theme: 'system',

	// Actions
	toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
	openSidebar: () => set(() => ({ isSidebarOpen: true })),
	closeSidebar: () => set(() => ({ isSidebarOpen: false })),
	setTheme: (theme) => set(() => ({ theme })),
}));

// Selectors
export const useSidebarOpen = () => useUiStore((s) => s.isSidebarOpen);
export const useTheme = () => useUiStore((s) => s.theme);
export const useUiActions = () =>
	useUiStore(
		useShallow((s) => ({
			toggleSidebar: s.toggleSidebar,
			openSidebar: s.openSidebar,
			closeSidebar: s.closeSidebar,
			setTheme: s.setTheme,
		}))
	);
